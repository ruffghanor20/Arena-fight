import React from 'react';

export function Table({ children, className = '', ...props }) {
  return (
    <table className={className} {...props}>
      {children}
    </table>
  );
}

export function TableHeader({ children, className = '' }) {
  return <thead className={className}>{children}</thead>;
}

export function TableBody({ children, className = '' }) {
  return <tbody className={className}>{children}</tbody>;
}

export function TableRow({ children, className = '', ...props }) {
  return <tr className={className} {...props}>{children}</tr>;
}

export function TableHead({ children, className = '', ...props }) {
  return <th className={className} {...props}>{children}</th>;
}

export function TableCell({ children, className = '', ...props }) {
  return <td className={className} {...props}>{children}</td>;
}
