import express from "express";
import { createServer as createViteServer } from "vite";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import fs from "fs";

dotenv.config();

const app = express();
const logStream = fs.createWriteStream("server.log", { flags: "a" });
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
console.log = (...args) => {
  logStream.write(args.join(" ") + "\n");
  originalConsoleLog(...args);
};
console.error = (...args) => {
  logStream.write("ERROR: " + args.join(" ") + "\n");
  originalConsoleError(...args);
};
const PORT = 3000;
const JWT_SECRET = process.env.SESSION_SECRET || "vpsl-secret";

app.set("trust proxy", 1);
app.use(express.json());

// Auth Middleware
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Não autorizado" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    (req as any).userId = decoded.userId;
    
    // Fetch user role
    const user = db.prepare("SELECT role FROM users WHERE id = ?").get(decoded.userId) as any;
    (req as any).userRole = user ? user.role : null;
    
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido" });
  }
};

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
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      team_id INTEGER,
      FOREIGN KEY (team_id) REFERENCES teams (id)
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

// Add role to users
const userCols2 = db.prepare("PRAGMA table_info(users)").all() as any[];
if (!userCols2.some(c => c.name === 'role')) {
  try {
    db.prepare("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'").run();
    db.prepare("UPDATE users SET role = 'admin' WHERE email = 'ricocidral@gmail.com'").run();
    console.log("Added 'role' column to users table.");
  } catch (e) {
    console.error("Failed to add 'role' column:", e);
  }
}

// Add owner_id and logo_url to teams
const teamCols = db.prepare("PRAGMA table_info(teams)").all() as any[];
if (!teamCols.some(c => c.name === 'owner_id')) {
  try {
    db.prepare("ALTER TABLE teams ADD COLUMN owner_id INTEGER").run();
    console.log("Added 'owner_id' column to teams table.");
  } catch (e) {
    console.error("Failed to add 'owner_id' column:", e);
  }
}
if (!teamCols.some(c => c.name === 'logo_url')) {
  try {
    db.prepare("ALTER TABLE teams ADD COLUMN logo_url TEXT").run();
    console.log("Added 'logo_url' column to teams table.");
  } catch (e) {
    console.error("Failed to add 'logo_url' column:", e);
  }
}

// Create championship_teams table
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS championship_teams (
      championship_id INTEGER,
      team_id INTEGER,
      PRIMARY KEY (championship_id, team_id),
      FOREIGN KEY (championship_id) REFERENCES championships(id),
      FOREIGN KEY (team_id) REFERENCES teams(id)
    );
  `);
  console.log("Created championship_teams table.");
  // Migrate existing teams to championship_teams
  db.prepare("INSERT OR IGNORE INTO championship_teams (championship_id, team_id) SELECT championship_id, id FROM teams WHERE championship_id IS NOT NULL").run();
} catch (e) {
  console.error("Failed to create championship_teams table:", e);
}



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

app.get("/api/public/championships", (req, res) => {
  try {
    const championships = db.prepare("SELECT * FROM championships WHERE active = 1 ORDER BY created_at DESC").all();
    res.json(championships);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar campeonatos" });
  }
});

app.get("/api/public/championships/:id/teams", (req, res) => {
  try {
    const teams = db.prepare(`
      SELECT t.* FROM teams t
      JOIN championship_teams ct ON t.id = ct.team_id
      WHERE ct.championship_id = ?
    `).all(req.params.id);
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar times" });
  }
});

app.get("/api/public/teams/:id/players", (req, res) => {
  try {
    const players = db.prepare("SELECT * FROM players WHERE team_id = ?").all(req.params.id);
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar jogadores" });
  }
});

// Auth Routes
app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;
  console.log("Register request for:", email);
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
    console.error("Registration error:", error);
    if (error.code === "SQLITE_CONSTRAINT") {
      res.status(400).json({ error: "E-mail já cadastrado" });
    } else {
      res.status(500).json({ error: "Erro no servidor: " + error.message });
    }
  }
});

app.post("/api/verify", (req, res) => {
  const { email, code } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ? AND verification_code = ?").get(email, code) as any;

  if (user) {
    db.prepare("UPDATE users SET verified = 1, verification_code = NULL WHERE id = ?").run(user.id);
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ success: true, token });
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

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });
  console.log("User logged in, token generated");
  res.json({ success: true, token });
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
  console.log("Reset password request:", { email, code });
  const user = db.prepare("SELECT * FROM users WHERE email = ? AND verification_code = ?").get(email, code) as any;

  if (!user) {
    console.log("User not found or invalid code");
    return res.status(400).json({ error: "Código inválido ou e-mail incorreto" });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  db.prepare("UPDATE users SET password = ?, verification_code = NULL WHERE id = ?").run(hashedPassword, user.id);

  res.json({ success: true, message: "Senha alterada com sucesso!" });
});

app.get("/api/user", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.json({ loggedIn: false });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const user = db.prepare("SELECT email, role FROM users WHERE id = ?").get(decoded.userId) as any;
    if (user) {
      res.json({ loggedIn: true, email: user.email, role: user.role });
    } else {
      res.json({ loggedIn: false });
    }
  } catch (err) {
    res.json({ loggedIn: false });
  }
});

app.post("/api/logout", (req, res) => {
  res.json({ success: true });
});

app.get("/api/users", requireAuth, (req, res) => {
  try {
    const users = db.prepare("SELECT id, email, verified, role FROM users").all();
    console.log("Fetched users count:", users.length);
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

app.post("/api/users/:id/role", requireAuth, (req: any, res: any) => {
  console.log("Role update request for user:", req.params.id, "by user:", req.userId, "with role:", req.userRole);
  
  // Only admins can change roles
  if (req.userRole !== 'admin') {
    console.log("Access denied for user:", req.userId, "role:", req.userRole);
    return res.status(403).json({ error: "Acesso negado" });
  }
  
  const { role } = req.body;
  if (!role || (role !== 'admin' && role !== 'user')) {
    console.log("Invalid role:", role);
    return res.status(400).json({ error: "Papel inválido" });
  }

  try {
    db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, req.params.id);
    console.log("Role updated successfully for user:", req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("Error updating user role:", err);
    res.status(500).json({ error: "Erro ao atualizar papel do usuário" });
  }
});

// Admin Routes (Championships & Teams)
app.get("/api/championships", requireAuth, (req, res) => {
  try {
    const championships = db.prepare("SELECT * FROM championships ORDER BY created_at DESC").all();
    console.log("Fetched championships count:", championships.length);
    res.json(championships);
  } catch (err) {
    console.error("Error fetching championships:", err);
    res.status(500).json({ error: "Erro ao buscar campeonatos" });
  }
});

app.post("/api/championships", requireAuth, (req, res) => {
  console.log("POST /api/championships body:", req.body);
  const { name, description } = req.body;
  console.log("Creating championship:", { name, description, userId: (req as any).userId });
  if (!name) return res.status(400).json({ error: "Nome é obrigatório" });

  try {
    const info = db.prepare("INSERT INTO championships (name, description) VALUES (?, ?)").run(name, description);
    console.log("Championship inserted successfully, ID:", info.lastInsertRowid);
    res.json({ id: Number(info.lastInsertRowid), name, description, active: 1 });
  } catch (err: any) {
    console.error("Error inserting championship:", err);
    res.status(500).json({ error: err.message || "Erro interno ao salvar campeonato" });
  }
});

app.patch("/api/championships/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: "Nome é obrigatório" });

  try {
    db.prepare("UPDATE championships SET name = ?, description = ? WHERE id = ?").run(name, description, id);
    const updated = db.prepare("SELECT * FROM championships WHERE id = ?").get(id);
    res.json(updated);
  } catch (err: any) {
    console.error("Error updating championship:", err);
    res.status(500).json({ error: "Erro ao atualizar campeonato" });
  }
});

app.patch("/api/championships/:id/toggle-active", requireAuth, (req, res) => {
  const { id } = req.params;
  const champ = db.prepare("SELECT active FROM championships WHERE id = ?").get(id) as any;
  if (!champ) return res.status(404).json({ error: "Campeonato não encontrado" });

  const newActive = champ.active ? 0 : 1;
  db.prepare("UPDATE championships SET active = ? WHERE id = ?").run(newActive, id);
  res.json({ success: true, active: newActive });
});

app.delete("/api/championships/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  try {
    db.prepare("DELETE FROM teams WHERE championship_id = ?").run(id);
    db.prepare("DELETE FROM championships WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting championship:", err);
    res.status(500).json({ error: "Erro ao excluir campeonato" });
  }
});

app.get("/api/championships/:id/teams", requireAuth, (req, res) => {
  const teams = db.prepare(`
    SELECT t.* FROM teams t
    JOIN championship_teams ct ON t.id = ct.team_id
    WHERE ct.championship_id = ?
  `).all(req.params.id);
  res.json(teams);
});

app.post("/api/championships/:id/teams", requireAuth, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Nome do time é obrigatório" });

  const info = db.prepare("INSERT INTO teams (name, championship_id) VALUES (?, ?)").run(name, req.params.id);
  const teamId = Number(info.lastInsertRowid);
  db.prepare("INSERT INTO championship_teams (championship_id, team_id) VALUES (?, ?)").run(req.params.id, teamId);
  res.json({ id: teamId, name, championship_id: req.params.id });
});

app.delete("/api/championships/:id/teams/:teamId", requireAuth, (req, res) => {
  const teamId = Number(req.params.teamId);
  console.log(`Deleting team ${teamId} from championship ${req.params.id}`);
  try {
    db.prepare("DELETE FROM championship_teams WHERE championship_id = ? AND team_id = ?").run(req.params.id, teamId);
    // Note: We don't delete the team itself, just the enrollment
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting team enrollment:", err);
    res.status(500).json({ error: "Erro ao excluir time do campeonato" });
  }
});

// User Panel Routes
app.get("/api/my-teams", requireAuth, (req: any, res: any) => {
  try {
    const teams = db.prepare("SELECT * FROM teams WHERE owner_id = ?").all(req.userId);
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar seus times" });
  }
});

app.post("/api/my-teams", requireAuth, (req: any, res: any) => {
  const { name, logo_url } = req.body;
  if (!name) return res.status(400).json({ error: "Nome é obrigatório" });
  
  try {
    const info = db.prepare("INSERT INTO teams (name, logo_url, owner_id) VALUES (?, ?, ?)").run(name, logo_url || null, req.userId);
    res.json({ id: Number(info.lastInsertRowid), name, logo_url, owner_id: req.userId });
  } catch (err) {
    res.status(500).json({ error: "Erro ao criar time" });
  }
});

app.put("/api/my-teams/:id", requireAuth, (req: any, res: any) => {
  const { name, logo_url } = req.body;
  try {
    db.prepare("UPDATE teams SET name = ?, logo_url = ? WHERE id = ? AND owner_id = ?").run(name, logo_url || null, req.params.id, req.userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erro ao atualizar time" });
  }
});

app.delete("/api/my-teams/:id", requireAuth, (req: any, res: any) => {
  try {
    db.prepare("DELETE FROM players WHERE team_id = ?").run(req.params.id);
    db.prepare("DELETE FROM championship_teams WHERE team_id = ?").run(req.params.id);
    db.prepare("DELETE FROM teams WHERE id = ? AND owner_id = ?").run(req.params.id, req.userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erro ao excluir time" });
  }
});

app.post("/api/championships/:id/enroll", requireAuth, (req: any, res: any) => {
  const { team_id } = req.body;
  try {
    const team = db.prepare("SELECT * FROM teams WHERE id = ? AND owner_id = ?").get(team_id, req.userId);
    if (!team) return res.status(403).json({ error: "Time não encontrado ou não pertence a você" });
    
    db.prepare("INSERT INTO championship_teams (championship_id, team_id) VALUES (?, ?)").run(req.params.id, team_id);
    res.json({ success: true });
  } catch (err: any) {
    if (err.code === "SQLITE_CONSTRAINT_PRIMARYKEY" || err.code === "SQLITE_CONSTRAINT") {
      res.status(400).json({ error: "Este time já está inscrito neste campeonato" });
    } else {
      res.status(500).json({ error: "Erro ao inscrever time" });
    }
  }
});

app.get("/api/teams/:teamId/players", requireAuth, (req, res) => {
  const players = db.prepare("SELECT * FROM players WHERE team_id = ?").all(req.params.teamId);
  res.json(players);
});

app.post("/api/teams/:teamId/players", requireAuth, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Nome do jogador é obrigatório" });

  const info = db.prepare("INSERT INTO players (name, team_id) VALUES (?, ?)").run(name, req.params.teamId);
  res.json({ id: Number(info.lastInsertRowid), name, team_id: req.params.teamId });
});

app.delete("/api/players/:id", requireAuth, (req, res) => {
  db.prepare("DELETE FROM players WHERE id = ?").run(req.params.id);
  res.json({ success: true });
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
