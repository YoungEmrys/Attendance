// =========================
// IMPORTS
// =========================
const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// =========================
// PATHS (SINGLE SOURCE OF TRUTH)
// =========================
const dbPath = path.join(__dirname, "database.json");

// =========================
// INIT DATABASE SAFETY
// =========================
function initDB() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(
      dbPath,
      JSON.stringify(
        { users: [], students: [], attendance: [] },
        null,
        2
      )
    );
  }
}
initDB();

// =========================
// MIDDLEWARE
// =========================
app.use(express.json({ limit: "10mb" }));

app.use(
  session({
    secret: "attendance-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  })
);

// IMPORTANT: static AFTER API
app.use(express.static(path.join(__dirname, "../public")));

// =========================
// HELPER: DB
// =========================
function readDB() {
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

function writeDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

// =========================
// AUTH CHECK
// =========================
function checkAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Not logged in" });
  }
  next();
}

// =========================
// LOGIN / SESSION
// =========================
app.post("/api/login", (req, res) => {
  const db = readDB();
  const { username, password } = req.body;

  const user = db.users.find(
    u => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid login" });
  }

  req.session.user = user;

  res.json({ username: user.username, role: user.role });
});

app.get("/api/session", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "No session" });
  }

  res.json(req.session.user);
});

// =========================
// STUDENTS API (FIXED)
// =========================

// GET STUDENTS
app.get("/api/students", checkAuth, (req, res) => {
  const db = readDB();
  res.json(db.students);
});

// ADD STUDENT
app.post("/api/students", checkAuth, (req, res) => {
  const db = readDB();

  const { name, id, courses, image } = req.body;

  if (!name || !id) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const exists = db.students.find(s => s.id === id);

  if (exists) {
    return res.status(400).json({ message: "Student exists" });
  }

  db.students.push({
    name,
    id,
    courses: courses || [],
    image: image || "",
    status: "active"
  });

  writeDB(db);

  res.json({ message: "Student added" });
});

// UPDATE STUDENT
app.put("/api/students/:id", checkAuth, (req, res) => {
  const db = readDB();
  const student = db.students.find(s => s.id === req.params.id);

  if (!student) {
    return res.status(404).json({ message: "Not found" });
  }

  const { name, newId, courses, image } = req.body;

  if (name) student.name = name;
  if (courses) student.courses = courses;
  if (image !== undefined) student.image = image;

  if (newId && newId !== student.id) {
    const exists = db.students.find(s => s.id === newId);
    if (exists) {
      return res.status(400).json({ message: "ID exists" });
    }
    student.id = newId;
  }

  writeDB(db);

  res.json({ message: "Updated" });
});

// DELETE STUDENT
app.delete("/api/students/:id", checkAuth, (req, res) => {
  const db = readDB();

  db.students = db.students.filter(s => s.id !== req.params.id);

  writeDB(db);

  res.json({ message: "Deleted" });
});

// =========================
// ATTENDANCE API (FIXED)
// =========================

// GET
app.get("/api/attendance", checkAuth, (req, res) => {
  const db = readDB();
  res.json(db.attendance);
});

// SAVE (FULL REPLACE MODEL)
app.post("/api/attendance", checkAuth, (req, res) => {
  const db = readDB();

  if (!Array.isArray(req.body.attendance)) {
    return res.status(400).json({ message: "Invalid format" });
  }

  db.attendance = req.body.attendance;

  writeDB(db);

  res.json({ message: "Saved" });
});

// CLEAR ALL ATTENDANCE
app.delete("/api/attendance", (req, res) => {
  try {

    fs.writeFileSync("attendance.json", JSON.stringify([]));

    res.json({ message: "All attendance cleared" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reset attendance" });
  }
});


// =========================
// LOGOUT
// =========================
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out" });
  });
});

// =========================
// START SERVER
// =========================
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});