import React from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const EyeIcon = ({ isVisible, onClick }) => (
  <button 
    type="button" 
    onClick={onClick} 
    className="absolute inset-y-0 right-0 flex items-center pr-3 focus:outline-none"
  >
    {isVisible ? (
      <FaEye className="h-5 w-5 text-gray-400" />
    ) : (
      <FaEyeSlash className="h-5 w-5 text-gray-400" />
    )}
  </button>
);

export default EyeIcon;
