import React from 'react';
import { MessageCircle } from 'lucide-react';

const QAChat = ({ qaData, productId }) => {
  if (!qaData || qaData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
        <p>No Q&A data found for this product.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Q&A for Product: {productId}
        </h3>
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
          {qaData.length} questions
        </span>
      </div>
      
      <div className="space-y-6 max-h-[600px] overflow-y-auto">
        {qaData.map((qa, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            {/* Question */}
            <div className="mb-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  Q
                </div>
                <div className="flex-1">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-gray-800 font-medium">{qa.question}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600">
                      {qa.questionType && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {qa.questionType}
                        </span>
                      )}
                      {qa.questionTime && (
                        <span>{qa.questionTime}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Answer */}
            {qa.answer && (
              <div className="ml-4 pl-6 border-l-2 border-gray-300">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    A
                  </div>
                  <div className="flex-1">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-gray-800">{qa.answer}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600">
                        {qa.answerType && (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                            Type: {qa.answerType}
                          </span>
                        )}
                        {qa.answerTime && (
                          <span>{qa.answerTime}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QAChat;