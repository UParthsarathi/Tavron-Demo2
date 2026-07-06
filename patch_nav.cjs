const fs = require('fs');
let code = fs.readFileSync('src/components/layout/MobileBottomNav.tsx', 'utf8');

code = code.replace(`{userRole === 'MANAGER' && (
          <button
            onClick={() => onViewChange('dashboard')}`, `<button
            onClick={() => onViewChange('dashboard')}`);

code = code.replace(`Dashboard</span>
          </button>
        )}`, `Dashboard</span>
          </button>`);

fs.writeFileSync('src/components/layout/MobileBottomNav.tsx', code);
