// MIDDLE WARE

const session = require("express-session");
const express = require("express");
const fs = require("fs");
const path = require("path");
const dbPath = path.join(__dirname, "database.json");

const app = express();

const PORT = process.env.PORT || 3000;
app.use(express.json());

app.set('trust proxy', 1);

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  res.set("Pragma","no-cache");
  res.set("Expires","0");
  next();
});

app.use(session({
secret: process.env.SESSION_SECRET || "attendance-secret",  
resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 1000 * 60 * 30,
    secure: false
  } // 30 minutes
}));

// serve frontend
app.use(express.static(path.join(__dirname, "../../public")));

// EXPLICIT ROUTE
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../public/index.html"));
});

// Optional: fallback for any other routes to index.html
// Useful if you directly access /attendance.html etc.
app.get("/:page", (req, res) => {
  const page = req.params.page;
  const filePath = path.join(__dirname, "../../public", `${page}.html`);
  res.sendFile(filePath, err => {
    if (err) {
      res.status(404).send("Page not found");
    }
  });
});

// Read database
function readDB() {
  
  if (!fs.existsSync(dbPath)) {
    return { users: [], students: [], attendance: [] };
  }
return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

// Write database
function writeDB(data) {
fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf8");
}

//LOGIN AUTHETICATION
app.post("/api/login", (req, res) => {

  const { username, password } = req.body;

  const db = readDB();   // READ DATABASE

  const user = db.users.find(
    u => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid login" });
  }

  req.session.user = {
    username: user.username,
    role: user.role
  };

  res.json({
    username: user.username,
    role: user.role
  });

});

//LOGOUT
app.post("/api/logout", (req, res) => {

  req.session.destroy(err => {

    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }

    res.clearCookie("connect.sid");

    res.json({ message: "Logged out" });

  });

});

// STUDENTS API
//

app.get("/api/students", checkAuth, (req, res) => {

  const db = readDB();

  res.json(db.students || []);

});

app.post("/api/students", checkAuth, (req, res) => {

  const db = readDB();

  if (!db.students) {
    db.students = [];
  }

  const { name, status } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Student name required" });
  }

  // prevent duplicates
  const exists = db.students.find(s => s.name === name);
  if (exists) {
    return res.status(400).json({ message: "Student already exists" });
  }

  db.students.push({
    name: name,
    status: status || "active"
  });

  writeDB(db);

  res.json({ message: "Student saved successfully" });

});

  // DELETE STUDENT

app.delete("/api/students/:name", checkAuth, (req, res) => {

  const name = decodeURIComponent(req.params.name);

  const db = readDB();

  if (!db.students) {
    db.students = [];
  }

  // remove student
  db.students = db.students.filter(s => s.name !== name);

  // also remove student from attendance
  if (db.attendance) {
    db.attendance.forEach(day => {
      day.records = day.records.filter(r => r.student !== name);
    });
  }

  writeDB(db);

  console.log("Deleted:", name);

  res.json({ message: "Student deleted successfully" });

});	

// BACKUP JSON
app.get("/api/backup", checkAuth, (req, res) => {

  const date = new Date().toISOString().slice(0,10);

  res.download(dbPath, `backup-${date}.json`);

});

//
// ATTENDANCE API
//

app.get("/api/attendance", checkAuth, (req, res) => {
  const db = readDB();
  res.json(db.attendance || []);
});

app.post("/api/attendance", checkAuth, (req, res) => {
  const db = readDB();
  db.attendance = req.body;
  writeDB(db);
  res.json({ message: "Attendance saved" });
});

app.get("/api/session", (req, res) => {

  if (!req.session.user) {
    return res.status(401).json({ message: "Not logged in" });
  }

  res.json(req.session.user);

});

//
// USERS API
//

app.get("/api/users", checkAuth, (req, res) => {
  const db = readDB();
  res.json(db.users || []);
});

app.post("/api/users", checkAuth, (req, res) => {
  const db = readDB();
  db.users = req.body;
  writeDB(db);
  res.json({ message: "Users saved" });
});

function checkAuth(req, res, next) {

  if (!req.session.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  next();

}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});