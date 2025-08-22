const express = require('express');
const cors = require('cors');
const fs = require('fs');
const zlib = require('zlib');
const readline = require('readline');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory data store (you might want to use a database for production)
let productData = new Map();
let isDataLoaded = false;

// Function to load data from compressed JSON file
async function loadData(filePath) {
    console.log('Loading data...');
    
    try {
        const fileStream = fs.createReadStream(filePath);
        const gunzip = zlib.createGunzip();
        const rl = readline.createInterface({
            input: fileStream.pipe(gunzip),
            crlfDelay: Infinity
        });

        let count = 0;
        for await (const line of rl) {
            try {
                // Parse the line as JSON (assuming it's in proper JSON format)
                // If it's Python eval format, you might need to preprocess it
                const data = JSON.parse(line);
                
                // Assuming your data has an 'asin' field as product ID
                const productId = data.asin || data.productId || data.id;
                
                if (productId) {
                    if (!productData.has(productId)) {
                        productData.set(productId, []);
                    }
                    productData.get(productId).push({
                        question: data.question,
                        answer: data.answer,
                        answerTime: data.answerTime || '',
                        unixTime: data.unixTime || null,
                        questionType: data.questionType || '',
                        answerType: data.answerType || ''
                    });
                    count++;
                }
            } catch (parseError) {
                console.error('Error parsing line:', parseError.message);
            }
        }
        
        console.log(`Loaded ${count} Q&A records for ${productData.size} products`);
        isDataLoaded = true;
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Function to parse Python dictionary format
function convertPythonToJson(pythonStr) {
    try {
        // Handle Python dictionary format conversion to JSON
        let jsonStr = pythonStr
            .replace(/'/g, '"')                    // Replace single quotes with double quotes
            .replace(/True/g, 'true')              // Convert Python True to JSON true
            .replace(/False/g, 'false')            // Convert Python False to JSON false
            .replace(/None/g, 'null')              // Convert Python None to JSON null
            .replace(/\bnan\b/g, 'null')           // Convert nan to null
            .replace(/\binf\b/g, 'null')           // Convert inf to null
            .replace(/\b-inf\b/g, 'null');         // Convert -inf to null
        
        return JSON.parse(jsonStr);
    } catch (error) {
        // If JSON parsing fails, try a more robust approach
        try {
            // Use eval in a safer way (still risky, but controlled environment)
            const safeEval = new Function('return ' + pythonStr);
            return safeEval();
        } catch (evalError) {
            throw new Error(`Failed to parse Python dict: ${evalError.message}`);
        }
    }
}

async function loadDataPythonEval(filePath) {
    console.log('Loading data (Python dictionary format)...');
    
    try {
        const fileStream = fs.createReadStream(filePath);
        const gunzip = zlib.createGunzip();
        const rl = readline.createInterface({
            input: fileStream.pipe(gunzip),
            crlfDelay: Infinity
        });

        let count = 0;
        let errorCount = 0;
        
        for await (const line of rl) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            
            try {
                const data = convertPythonToJson(trimmedLine);
                
                const productId = data.asin;
                
                if (productId && data.question && data.answer) {
                    if (!productData.has(productId)) {
                        productData.set(productId, []);
                    }
                    
                    productData.get(productId).push({
                        question: data.question,
                        answer: data.answer,
                        answerTime: data.answerTime || '',
                        unixTime: data.unixTime || null,
                        questionType: data.questionType || '',
                        answerType: data.answerType || ''
                    });
                    count++;
                }
            } catch (parseError) {
                errorCount++;
                if (errorCount <= 5) { // Only log first 5 errors
                    console.error('Error parsing line:', parseError.message);
                    console.error('Line content:', trimmedLine.substring(0, 100) + '...');
                }
            }
        }
        
        console.log(`Loaded ${count} Q&A records for ${productData.size} products`);
        if (errorCount > 0) {
            console.log(`Skipped ${errorCount} invalid records`);
        }
        isDataLoaded = true;
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Routes
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        dataLoaded: isDataLoaded,
        totalProducts: productData.size 
    });
});

app.get('/api/product/:productId', (req, res) => {
    const { productId } = req.params;
    
    if (!isDataLoaded) {
        return res.status(503).json({ 
            error: 'Data is still loading, please try again later' 
        });
    }
    
    const qaData = productData.get(productId);
    
    if (!qaData) {
        return res.status(404).json({ 
            error: 'Product not found',
            productId 
        });
    }
    
    res.json({
        productId,
        totalQAs: qaData.length,
        qaData
    });
});

app.get('/api/search/:query', (req, res) => {
    const { query } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    if (!isDataLoaded) {
        return res.status(503).json({ 
            error: 'Data is still loading, please try again later' 
        });
    }
    
    const results = [];
    const searchTerm = query.toLowerCase();
    
    for (const [productId, qaData] of productData.entries()) {
        if (productId.toLowerCase().includes(searchTerm)) {
            results.push({
                productId,
                totalQAs: qaData.length,
                preview: qaData.slice(0, 2) // Show first 2 Q&As as preview
            });
            
            if (results.length >= limit) break;
        }
    }
    
    res.json({
        query,
        results,
        totalFound: results.length
    });
});

// Initialize data loading - prioritize Python dictionary format
const dataFile = process.env.DATA_FILE || './qa_Clothing_Shoes_and_Jewelry.json.gz';
if (fs.existsSync(dataFile)) {
    // Load Python dictionary format data
    loadDataPythonEval(dataFile);
} else {
    console.log(`Data file ${dataFile} not found. Place your data file in the server directory.`);
    console.log('You can specify a different file path using DATA_FILE environment variable.');
    console.log('Expected format: Python dictionary objects, one per line in a .gz file');
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API endpoints:`);
    console.log(`  GET /api/health - Check server status`);
    console.log(`  GET /api/product/:productId - Get Q&As for a product`);
    console.log(`  GET /api/search/:query - Search for products`);
});

module.exports = app;