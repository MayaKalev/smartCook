import React from 'react';

export default function Button({ children, onClick }) {
  const label = String(children).toLowerCase();

  let className = "text-white font-semibold py-2 px-5 rounded-lg shadow transition ";

  if (label === 'apply') {
    className += "bg-blue-600 hover:bg-blue-700 ring-2 ring-blue-300";
  } else if (label === 'cancel' || label === 'back') {
    className += "bg-gray-500 hover:bg-gray-600 ring-2 ring-gray-300";
  } else {
    className += "bg-blue-300 hover:bg-blue-400";
  }

  return (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  );
}
