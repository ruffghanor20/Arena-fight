import React from 'react';

export function Tabs({ children, defaultValue, className = '' }) {
  return <div className={className}>{children}</div>;
}

export function TabsList({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

export function TabsTrigger({ children, value, className = '' }) {
  return <button className={className} data-value={value}>{children}</button>;
}

export function TabsContent({ children, value, className = '' }) {
  return <div className={className}>{children}</div>;
}
