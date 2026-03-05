import React, { useId } from 'react';

export function Input(props) {
  const reactId = useId();
  const providedId = props.id || props.name || null;
  const id = providedId || `input-${reactId}`;
  const name = props.name || id;

  // Avoid duplicating id/name in props spread: build newProps
  const { id: _id, name: _name, ...rest } = props;
  return <input id={id} name={name} {...rest} />;
}
