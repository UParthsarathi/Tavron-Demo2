const fs = require('fs');

const engCode = `import React from 'react';
import { BaseLoginForm } from './BaseLoginForm';

export function EngineerLoginForm() {
  return (
    <BaseLoginForm 
      role="engineer" 
      defaultEmail="engineer3@demo.com"
      subtitle={
        <React.Fragment>
          <p className="font-medium mb-1">Demo Access Active</p>
          <p>We have 15 engineers pre-configured.</p>
          <p>Use <strong>engineer3@demo.com</strong> up to <strong>engineer15@demo.com</strong> to view different assigned tasks.</p>
        </React.Fragment>
      }
    />
  );
}
`;
fs.writeFileSync('src/components/auth/forms/EngineerLoginForm.tsx', engCode);

const mgrCode = `import React from 'react';
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
`;
fs.writeFileSync('src/components/auth/forms/ManagerLoginForm.tsx', mgrCode);
