import React, { useState, useEffect } from 'react';
import { Search, MessageCircle } from 'lucide-react';
import QAChat from './components/QAChat';
import ServerStatus from './components/ServerStatus';
import Chatbot from './components/Chatbot';
import './App.css';

const App = () => {
  const [productId, setProductId] = useState('');
  const [qaData, setQaData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serverStatus, setServerStatus] = useState('checking');
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [currentProductForChat, setCurrentProductForChat] = useState('');

  // Check server status on component mount
  useEffect(() => {
    checkServerStatus();
    // Check server status every 10 seconds while data is loading
    const interval = setInterval(() => {
      if (serverStatus !== 'ready') {
        checkServerStatus();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [serverStatus]);

  const checkServerStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/health');
      const data = await response.json();
      setServerStatus(data.dataLoaded ? 'ready' : 'loading');
    } catch (error) {
      setServerStatus('error');
    }
  };

  const handleSearch = async () => {
    if (!productId.trim()) {
      setError('Please enter a product ID');
      return;
    }

    setLoading(true);
    setError('');
    setQaData(null);

    try {
      const response = await fetch(`http://localhost:3001/api/product/${productId.trim()}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Product not found. Please check the product ID and try again.');
        } else if (response.status === 503) {
          throw new Error('Server is still loading data. Please wait a moment and try again.');
        } else {
          throw new Error('Server error. Please try again later.');
        }
      }

      const data = await response.json();
      setQaData(data.qaData);
      setCurrentProductForChat(productId.trim()); // Set product for chatbot
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800">Product Q&A Search</h1>
          <p className="text-gray-600 mt-2">Search for product questions and answers using the product ID (ASIN)</p>
        </div>
      </header>

      {/* Server Status Banner */}
      <ServerStatus 
        status={serverStatus} 
        onRetry={checkServerStatus} 
      />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex space-x-4">
            <div className="flex-1">
              <label htmlFor="productId" className="block text-sm font-medium text-gray-700 mb-2">
                Product ID (ASIN)
              </label>
              <input
                id="productId"
                type="text"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter product ID (e.g., 1617160040)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading || serverStatus !== 'ready'}
              />
              <p className="text-xs text-gray-500 mt-1">
                Example: 1617160040 (from your dataset)
              </p>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={loading || serverStatus !== 'ready'}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2 font-medium"
              >
                <Search size={20} />
                <span>{loading ? 'Searching...' : 'Search'}</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        {qaData && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <QAChat qaData={qaData} productId={productId} />
          </div>
        )}

        {/* Instructions */}
        {!qaData && !loading && !error && serverStatus === 'ready' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-800 mb-2">How to use:</h3>
            <ol className="text-blue-700 space-y-1">
              <li>1. Enter a product ID (ASIN) in the search field above</li>
              <li>2. Click "Search" or press Enter</li>
              <li>3. View all questions and answers for that product</li>
            </ol>
            <p className="text-blue-600 text-sm mt-3">
              The system will display Q&As in a chat-like format with questions and corresponding answers.
            </p>
          </div>
        )}
      </main>

      {/* Chatbot Toggle Button */}
      {!chatbotOpen && (
        <button
          onClick={() => setChatbotOpen(true)}
          className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40 group"
          title="Open AI Assistant"
        >
          <MessageCircle size={24} />
          <span className="absolute -top-8 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            AI Assistant
          </span>
        </button>
      )}

      {/* Chatbot Component */}
      <Chatbot 
        isOpen={chatbotOpen} 
        onToggle={() => setChatbotOpen(false)}
        currentProductId={currentProductForChat}
      />
    </div>
  );
};

export default App;