import React from "react";

export const ScrollArea = ({ children, className = "" }) => {
  return (
    <div className={`overflow-y-auto max-h-96 ${className}`}>
      {children}
    </div>
  );
};
