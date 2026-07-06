const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');

code = code.replace(`{userRole === 'MANAGER' && (
              <button
                onClick={() => onViewChange('dashboard')}`, `<button
                onClick={() => onViewChange('dashboard')}`);

code = code.replace(`Dashboard
              </button>
            )}`, `Dashboard
              </button>`);

fs.writeFileSync('src/components/layout/Header.tsx', code);
