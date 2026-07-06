const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

const mockEngineers = [
  { id: 'eng-1', name: 'Parthsarathi', email: 'parthsarathi3915@gmail.com', role: 'Engineer' },
  { id: 'eng-2', name: 'Parthu Epic', email: 'parthuepicgames@gmail.com', role: 'Engineer' },
  { id: 'eng-3', name: 'Alice Smith', email: 'engineer3@demo.com', role: 'Frontend Engineer' },
  { id: 'eng-4', name: 'Bob Johnson', email: 'engineer4@demo.com', role: 'Backend Engineer' },
  { id: 'eng-5', name: 'Charlie Davis', email: 'engineer5@demo.com', role: 'DevOps Engineer' },
  { id: 'eng-6', name: 'Diana Evans', email: 'engineer6@demo.com', role: 'QA Engineer' },
  { id: 'eng-7', name: 'Evan Harris', email: 'engineer7@demo.com', role: 'Full Stack Engineer' },
  { id: 'eng-8', name: 'Fiona Garcia', email: 'engineer8@demo.com', role: 'Data Engineer' },
  { id: 'eng-9', name: 'George Hall', email: 'engineer9@demo.com', role: 'Security Engineer' },
  { id: 'eng-10', name: 'Hannah Lee', email: 'engineer10@demo.com', role: 'Mobile Engineer' },
  { id: 'eng-11', name: 'Ian Martin', email: 'engineer11@demo.com', role: 'Frontend Engineer' },
  { id: 'eng-12', name: 'Julia Nelson', email: 'engineer12@demo.com', role: 'Backend Engineer' },
  { id: 'eng-13', name: 'Kevin Perez', email: 'engineer13@demo.com', role: 'Systems Engineer' },
  { id: 'eng-14', name: 'Laura Quinn', email: 'engineer14@demo.com', role: 'Cloud Engineer' },
  { id: 'eng-15', name: 'Michael Reed', email: 'engineer15@demo.com', role: 'Full Stack Engineer' },
  { id: 'eng-16', name: 'Oliver Stone', email: 'engineer16@demo.com', role: 'UI/UX Engineer' }
];

const insertStmt = db.prepare('INSERT OR REPLACE INTO engineers (id, name, email, role) VALUES (?, ?, ?, ?)');

mockEngineers.forEach(eng => {
    insertStmt.run(eng.id, eng.name, eng.email, eng.role);
});

console.log("Database seeded with 16 engineers.");
