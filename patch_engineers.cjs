const fs = require('fs');

// Patch data.ts
let dataCode = fs.readFileSync('src/data.ts', 'utf8');

if (!dataCode.includes('eng-16')) {
    dataCode = dataCode.replace(
        "{ id: 'eng-15', name: 'Michael Reed', email: 'engineer15@demo.com', role: 'Full Stack Engineer' }",
        "{ id: 'eng-15', name: 'Michael Reed', email: 'engineer15@demo.com', role: 'Full Stack Engineer' },\n  { id: 'eng-16', name: 'Oliver Stone', email: 'engineer16@demo.com', role: 'UI/UX Engineer' }"
    );
    fs.writeFileSync('src/data.ts', dataCode);
}

// Patch server.ts
let serverCode = fs.readFileSync('server.ts', 'utf8');

const seedCode = `    const insertStmt = db.prepare('INSERT INTO engineers (id, name, email, role) VALUES (?, ?, ?, ?)');
    insertStmt.run('eng-1', 'Parthsarathi', 'parthsarathi3915@gmail.com', 'Engineer');
    insertStmt.run('eng-2', 'Parthu Epic', 'parthuepicgames@gmail.com', 'Engineer');
    insertStmt.run('eng-3', 'Alice Smith', 'engineer3@demo.com', 'Frontend Engineer');
    insertStmt.run('eng-4', 'Bob Johnson', 'engineer4@demo.com', 'Backend Engineer');
    insertStmt.run('eng-5', 'Charlie Davis', 'engineer5@demo.com', 'DevOps Engineer');
    insertStmt.run('eng-6', 'Diana Evans', 'engineer6@demo.com', 'QA Engineer');
    insertStmt.run('eng-7', 'Evan Harris', 'engineer7@demo.com', 'Full Stack Engineer');
    insertStmt.run('eng-8', 'Fiona Garcia', 'engineer8@demo.com', 'Data Engineer');
    insertStmt.run('eng-9', 'George Hall', 'engineer9@demo.com', 'Security Engineer');
    insertStmt.run('eng-10', 'Hannah Lee', 'engineer10@demo.com', 'Mobile Engineer');
    insertStmt.run('eng-11', 'Ian Martin', 'engineer11@demo.com', 'Frontend Engineer');
    insertStmt.run('eng-12', 'Julia Nelson', 'engineer12@demo.com', 'Backend Engineer');
    insertStmt.run('eng-13', 'Kevin Perez', 'engineer13@demo.com', 'Systems Engineer');
    insertStmt.run('eng-14', 'Laura Quinn', 'engineer14@demo.com', 'Cloud Engineer');
    insertStmt.run('eng-15', 'Michael Reed', 'engineer15@demo.com', 'Full Stack Engineer');
    insertStmt.run('eng-16', 'Oliver Stone', 'engineer16@demo.com', 'UI/UX Engineer');`;

serverCode = serverCode.replace(
    /    const insertStmt = db\.prepare\('INSERT INTO engineers \(id, name, email, role\) VALUES \(\?, \?, \?, \?\)'\);\n    insertStmt\.run\('eng-1', 'Parthu', 'parthsarathi3915@gmail\.com', 'Engineer'\);\n    insertStmt\.run\('eng-2', 'Parthu Epic', 'parthuepicgames@gmail\.com', 'Engineer'\);/g,
    seedCode
);

fs.writeFileSync('server.ts', serverCode);

