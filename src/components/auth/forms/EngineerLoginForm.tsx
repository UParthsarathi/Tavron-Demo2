import React from 'react';
import { BaseLoginForm } from './BaseLoginForm';

export function EngineerLoginForm() {
  return (
    <BaseLoginForm 
      role="engineer" 
      defaultEmail="engineer3@demo.com"
      subtitle={
        <React.Fragment>
          <p className="font-medium mb-1">Demo Access Active</p>
          <p>We have 16 engineers pre-configured.</p>
          <p>Use <strong>engineer3@demo.com</strong> up to <strong>engineer15@demo.com</strong> to view different assigned tasks.</p>
        </React.Fragment>
      }
    />
  );
}
