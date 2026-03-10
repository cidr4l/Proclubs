import express from "express";
import { createServer as createViteServer } from "vite";
import cookieSession from "cookie-session";
import dotenv from "dotenv";
import path from "path";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Database Setup
const db = new Database("vpsl.db");
console.log("Database connected.");
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT,
      verified INTEGER DEFAULT 0,
      verification_code TEXT
    );
    CREATE TABLE IF NOT EXISTS championships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      championship_id INTEGER,
      FOREIGN KEY (championship_id) REFERENCES championships (id)
    );
  `);
  console.log("Database tables initialized.");
  const userCols = db.prepare("PRAGMA table_info(users)").all() as any[];
  console.log("Users table columns:", userCols.map(c => c.name).join(", "));
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
  console.log("Current user count in database:", userCount.count);
} catch (err) {
  console.error("Database initialization error:", err);
}

// Check if active column exists and add it if not
const columns = db.prepare("PRAGMA table_info(championships)").all() as any[];
console.log("Championships table columns:", columns.map(c => c.name).join(", "));
const hasActive = columns.some(col => col.name === 'active');
if (!hasActive) {
  try {
    db.prepare("ALTER TABLE championships ADD COLUMN active INTEGER DEFAULT 1").run();
    console.log("Added 'active' column to championships table.");
  } catch (e) {
    console.error("Failed to add 'active' column:", e);
  }
}

app.use(
  cookieSession({
    name: "session",
    keys: [process.env.SESSION_SECRET || "vpsl-secret"],
    maxAge: 24 * 60 * 60 * 1000,
    secure: true,
    sameSite: "none",
    httpOnly: true,
  })
);

// Email Transporter (Simulated or Real)
const transporter = nodemailer.createTransport({
  // For demo purposes, we'll log the code to console if no credentials
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Auth Routes
app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email e senha obrigatórios" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const insert = db.prepare("INSERT INTO users (email, password, verification_code) VALUES (?, ?, ?)");
    insert.run(email, hashedPassword, verificationCode);

    // Send Email (Simulated)
    console.log(`[EMAIL SIMULATION] Para: ${email}, Código: ${verificationCode}`);
    
    res.json({ 
      success: true, 
      message: `Usuário registrado. Para este demo, seu código é: ${verificationCode}`,
      demoCode: verificationCode // Adding this so the frontend can show it for testing
    });
  } catch (error: any) {
    if (error.code === "SQLITE_CONSTRAINT") {
      res.status(400).json({ error: "E-mail já cadastrado" });
    } else {
      res.status(500).json({ error: "Erro no servidor" });
    }
  }
});

app.post("/api/verify", (req, res) => {
  const { email, code } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ? AND verification_code = ?").get(email, code) as any;

  if (user) {
    db.prepare("UPDATE users SET verified = 1, verification_code = NULL WHERE id = ?").run(user.id);
    req.session!.userId = user.id;
    res.json({ success: true });
  } else {
    res.status(400).json({ error: "Código inválido" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ error: "Credenciais inválidas" });
  }

  if (!user.verified) {
    return res.status(403).json({ error: "E-mail não verificado", needsVerification: true });
  }

  req.session!.userId = user.id;
  res.json({ success: true });
});

app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;

  if (!user) {
    // For security, don't reveal if user exists or not, but in this specific request the user wants a warning if email is registered, so here we can be more explicit or just say "if exists, we sent a code"
    // Actually, the user asked for "warning if already registered" during registration.
    // For forgot password, we can just say "If the email is registered, you will receive a code".
    return res.json({ success: true, message: "Se o e-mail estiver cadastrado, você receberá um código." });
  }

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  db.prepare("UPDATE users SET verification_code = ? WHERE id = ?").run(resetCode, user.id);

  console.log(`[PASSWORD RESET SIMULATION] Para: ${email}, Código: ${resetCode}`);
  
  res.json({ 
    success: true, 
    message: "Código de recuperação enviado.",
    demoCode: resetCode 
  });
});

app.post("/api/reset-password", async (req, res) => {
  const { email, code, newPassword } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ? AND verification_code = ?").get(email, code) as any;

  if (!user) {
    return res.status(400).json({ error: "Código inválido ou e-mail incorreto" });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  db.prepare("UPDATE users SET password = ?, verification_code = NULL WHERE id = ?").run(hashedPassword, user.id);

  res.json({ success: true, message: "Senha alterada com sucesso!" });
});

app.get("/api/user", (req, res) => {
  if (req.session?.userId) {
    const user = db.prepare("SELECT email FROM users WHERE id = ?").get(req.session.userId) as any;
    res.json({ loggedIn: true, email: user?.email });
  } else {
    res.json({ loggedIn: false });
  }
});

app.post("/api/logout", (req, res) => {
  req.session = null;
  res.json({ success: true });
});

app.get("/api/users", (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "Não autorizado" });
  try {
    const users = db.prepare("SELECT id, email, verified FROM users").all();
    console.log("Fetched users count:", users.length);
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

// Admin Routes (Championships & Teams)
app.get("/api/championships", (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "Não autorizado" });
  try {
    const championships = db.prepare("SELECT * FROM championships ORDER BY created_at DESC").all();
    console.log("Fetched championships count:", championships.length);
    res.json(championships);
  } catch (err) {
    console.error("Error fetching championships:", err);
    res.status(500).json({ error: "Erro ao buscar campeonatos" });
  }
});

app.post("/api/championships", (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "Não autorizado" });
  console.log("POST /api/championships body:", req.body);
  const { name, description } = req.body;
  console.log("Creating championship:", { name, description, userId: req.session.userId });
  if (!name) return res.status(400).json({ error: "Nome é obrigatório" });

  try {
    const info = db.prepare("INSERT INTO championships (name, description) VALUES (?, ?)").run(name, description);
    console.log("Championship inserted successfully, ID:", info.lastInsertRowid);
    res.json({ id: info.lastInsertRowid, name, description, active: 1 });
  } catch (err: any) {
    console.error("Error inserting championship:", err);
    res.status(500).json({ error: err.message || "Erro interno ao salvar campeonato" });
  }
});

app.patch("/api/championships/:id/toggle-active", (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "Não autorizado" });
  const { id } = req.params;
  const champ = db.prepare("SELECT active FROM championships WHERE id = ?").get(id) as any;
  if (!champ) return res.status(404).json({ error: "Campeonato não encontrado" });

  const newActive = champ.active ? 0 : 1;
  db.prepare("UPDATE championships SET active = ? WHERE id = ?").run(newActive, id);
  res.json({ success: true, active: newActive });
});

app.get("/api/championships/:id/teams", (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "Não autorizado" });
  const teams = db.prepare("SELECT * FROM teams WHERE championship_id = ?").all(req.params.id);
  res.json(teams);
});

app.post("/api/championships/:id/teams", (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "Não autorizado" });
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Nome do time é obrigatório" });

  const info = db.prepare("INSERT INTO teams (name, championship_id) VALUES (?, ?)").run(name, req.params.id);
  res.json({ id: info.lastInsertRowid, name, championship_id: req.params.id });
});

// Vite Middleware
async function initVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

initVite().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
