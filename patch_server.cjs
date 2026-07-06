const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newEndpoint = `
  app.get("/api/delegated-tasks-count", (req, res) => {
    try {
      const stmt = db.prepare("SELECT chat_id, COUNT(*) as count FROM direct_messages WHERE content LIKE '**New Delegated Task:%' GROUP BY chat_id");
      const rows = stmt.all();
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch delegated tasks count" });
    }
  });

  // Vite middleware for development`;

code = code.replace("  // Vite middleware for development", newEndpoint);
fs.writeFileSync('server.ts', code);
