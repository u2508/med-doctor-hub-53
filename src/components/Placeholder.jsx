import React from 'react';

const Placeholder = ({ width = "100%", height = "200px" }) => {
  return (
    <div 
      className="bg-gray-200 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center"
      style={{ width, height }}
    >
      <div className="text-center">
        <div className="text-4xl mb-2">👨‍⚕️</div>
        <p className="text-gray-500 text-sm">Doctor Image</p>
      </div>
    </div>
  );
};

export default Placeholder;
