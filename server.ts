import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize SQLite database
  const db = new Database('database.sqlite');
  
  // Create engineers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS engineers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL
    )
  `);

  // Seed data if empty
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM engineers');
  const countResult = countStmt.get() as { count: number };
  if (countResult.count === 0) {
    const insertStmt = db.prepare('INSERT INTO engineers (id, name, email, role) VALUES (?, ?, ?, ?)');
    insertStmt.run('eng-1', 'Parthu', 'parthsarathi3915@gmail.com', 'Engineer');
    insertStmt.run('eng-2', 'Parthu Epic', 'parthuepicgames@gmail.com', 'Engineer');
  }

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/engineers", (req, res) => {
    try {
      const stmt = db.prepare('SELECT * FROM engineers');
      const engineers = stmt.all();
      res.json(engineers);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch engineers" });
    }
  });

  app.post("/api/engineers", (req, res) => {
    try {
      const { id, name, email, role } = req.body;
      const stmt = db.prepare('INSERT INTO engineers (id, name, email, role) VALUES (?, ?, ?, ?)');
      stmt.run(id, name, email, role);
      res.status(201).json({ id, name, email, role });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create engineer" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);
