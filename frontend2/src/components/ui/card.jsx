import React from "react";

export const Card = ({ children, className = "" }) => {
  return (
    <div className={`bg-white shadow rounded p-4 ${className}`}>
      {children}
    </div>
  );
};
