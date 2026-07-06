const fs = require('fs');
let code = fs.readFileSync('src/components/messages/MessagesView.tsx', 'utf8');

code = code.replace(
  `        isTask: false,
        engineer: null
      }];
    id: \`eng-\${e.id}\`,
    name: e.name,
    role: e.role,
    isTask: false,
    engineer: e
  }));`,
  `        isTask: false,
        engineer: null
      }];`
);

fs.writeFileSync('src/components/messages/MessagesView.tsx', code);
