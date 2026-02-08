import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="mb-4">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <div className="animate-spin h-8 w-8 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
          </div>
        </div>
        <p className="text-gray-600 text-lg">Loading whale data...</p>
        <p className="text-gray-500 text-sm">This may take a few seconds</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
