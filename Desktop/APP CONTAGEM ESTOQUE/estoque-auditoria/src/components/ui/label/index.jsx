import React from 'react';

export function Label({ children, className = '', htmlFor, ...props }) {
  // If `htmlFor` is provided, render a real <label> to associate with a form control.
  // Otherwise render a non-form element to avoid unassociated label accessibility warnings.
  if (htmlFor) {
    return (
      <label className={"label " + className} htmlFor={htmlFor} {...props}>
        {children}
      </label>
    );
  }

  return (
    <div className={"label " + className} {...props}>
      {children}
    </div>
  );
}
