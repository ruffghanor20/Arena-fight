import React from 'react';

export function Badge({ children, variant = 'default', className = '' }) {
  const v = variant ? ` badge-${variant}` : '';
  return <span className={"badge" + v + ' ' + className}>{children}</span>;
}
