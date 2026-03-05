import React from 'react';

export function Button({ children, type = 'button', variant = 'default', className = '', ...props }) {
  const base = 'btn';
  const v = variant ? ` btn-${variant}` : '';
  return (
    <button type={type} className={base + v + ' ' + className} {...props}>
      {children}
    </button>
  );
}
