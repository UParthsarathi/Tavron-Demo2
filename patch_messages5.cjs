const fs = require('fs');
let code = fs.readFileSync('src/components/messages/MessagesView.tsx', 'utf8');

code = code.replace(
  "  const engineerChats = engineers.map(e => ({",
  `  const engineerChats = userRole === 'MANAGER' 
    ? engineers.map(e => ({
        id: \`eng-\${e.id}\`,
        name: e.name,
        role: e.role,
        isTask: false,
        engineer: e
      }))
    : [{
        id: \`eng-\${user?.email}\`,
        name: 'Project Manager',
        role: 'Manager',
        isTask: false,
        engineer: null
      }];`
);

fs.writeFileSync('src/components/messages/MessagesView.tsx', code);
