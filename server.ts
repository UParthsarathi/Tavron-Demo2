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
    insertStmt.run('eng-16', 'Oliver Stone', 'engineer16@demo.com', 'UI/UX Engineer');
  }

  // Create direct_messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS direct_messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      sender_email TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_role TEXT NOT NULL,
      content TEXT,
      image_url TEXT,
      created_at TEXT NOT NULL
    )
  `);

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

  app.get("/api/messages/:chatId", (req, res) => {
    try {
      const stmt = db.prepare('SELECT * FROM direct_messages WHERE chat_id = ? ORDER BY created_at ASC');
      const messages = stmt.all(req.params.chatId);
      res.json(messages);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages/:chatId", (req, res) => {
    try {
      const { id, sender_email, sender_name, sender_role, content, image_url, created_at } = req.body;
      const stmt = db.prepare('INSERT INTO direct_messages (id, chat_id, sender_email, sender_name, sender_role, content, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      stmt.run(id, req.params.chatId, sender_email, sender_name, sender_role, content || null, image_url || null, created_at);
      res.status(201).json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to save message" });
    }
  });


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
