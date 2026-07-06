import React from 'react';
import { BaseLoginForm } from './BaseLoginForm';

export function ManagerLoginForm() {
  return (
    <BaseLoginForm 
      role="manager" 
      defaultEmail="manager@demo.com"
      subtitle={
        <React.Fragment>
          <p className="font-medium mb-1">Demo Access Active</p>
          <p>We have 2 managers pre-configured.</p>
          <p>Use <strong>manager@demo.com</strong> or <strong>parthu3915@gmail.com</strong>.</p>
        </React.Fragment>
      }
    />
  );
}
