import React from 'react';

const ServerStatus = ({ status, onRetry }) => {
  if (status === 'ready') {
    return null;
  }

  return (
    <div className={`px-4 py-3 text-center text-white ${
      status === 'error' ? 'bg-red-600' : 'bg-yellow-600'
    }`}>
      {status === 'error' && (
        <div>
          <span className="font-semibold">Server Connection Error:</span> Please make sure the backend is running on port 3001.
          <button 
            onClick={onRetry}
            className="ml-4 underline hover:no-underline"
          >
            Retry Connection
          </button>
        </div>
      )}
      {status === 'loading' && (
        <div>
          <span className="font-semibold">Loading Data:</span> Server is processing the dataset, this may take a few minutes...
        </div>
      )}
      {status === 'checking' && 'Connecting to server...'}
    </div>
  );
};

export default ServerStatus;