const fs = require('fs');
let code = fs.readFileSync('src/components/messages/MessagesView.tsx', 'utf8');

const oldProjectChats = `  const projectEngineerChats: any[] = projects.flatMap(p => 
    p.engineers.map(e => ({
      id: \`proj-\${p.id}-eng-\${e.id}\`,
      name: e.name,
      role: \`Project: \${p.name}\`,
      isTask: false,
      isProjectContext: true,
      engineer: e,
      project: p
    }))
  );`;

const newProjectChats = `  const projectEngineerChats: any[] = projects.flatMap(p => {
    if (userRole === 'MANAGER') {
      return p.engineers.map(e => ({
        id: \`proj-\${p.id}-eng-\${e.id}\`,
        name: e.name,
        role: \`Project: \${p.name}\`,
        isTask: false,
        isProjectContext: true,
        engineer: e,
        project: p
      }));
    } else {
      const myEng = p.engineers.find(e => e.email === user?.email);
      if (!myEng) return [];
      return [{
        id: \`proj-\${p.id}-eng-\${myEng.id}\`,
        name: 'Project Manager',
        role: \`Project: \${p.name}\`,
        isTask: false,
        isProjectContext: true,
        engineer: null,
        project: p
      }];
    }
  });`;

code = code.replace(oldProjectChats, newProjectChats);

fs.writeFileSync('src/components/messages/MessagesView.tsx', code);
