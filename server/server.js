// =========================
// IMPORTS
// =========================
const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");
const {
  CURRENT_DB_VERSION,
  migrateDatabase
} = require("./migrations");

const app = express();
const PORT = process.env.PORT || 3000;

// =========================
// PATHS (SINGLE SOURCE OF TRUTH)
// =========================
const dbPath = path.join(__dirname, "database.json");
const backupDir = path.join(__dirname, "backups");

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

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

// =========================
// MIDDLEWARE
// =========================
app.use(express.json({ limit: "10mb" }));

app.use(
  session({
    secret: "attendance-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
    maxAge: 1000 * 60 * 30
  }  
})
);

// IMPORTANT: static AFTER API
app.use(express.static(path.join(__dirname, "../public")));

// =========================
// HELPER: DB
// =========================
function readDB() {
  let db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

  db = migrateDatabase(db);

  fs.writeFileSync(
  dbPath,
  JSON.stringify(db, null, 2)
);

return db;
}

function writeDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

// CREATE BACKUP
function createBackup() {

  try {
    const timestamp = new Date()
      .toISOString()
      .replace(/:/g, "-");

    const backupFile = path.join(
      backupDir,
      `backup-${timestamp}.json`
    );

    fs.copyFileSync(dbPath, backupFile);

    console.log("Backup created:", backupFile);

  } catch (err) {
    console.error("Backup failed:", err);
  }
}

// AUTH CHECK
function checkAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ 
      success: false,
      message: "Not logged in" });
  }
  next();
}

// ADMIN CHECK
function checkAdmin(req, res, next) {

  if (!req.session.user) {
    return res.status(401).json({
      message: "Not logged in"
    });
  }

  if (req.session.user.role !== "admin") {

    return res.status(403).json({
      success: false,
      message: "Admins only"
    });
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
  return res.status(401).json({
    success: false,
    message: "Invalid login"
  });
}

req.session.user = user;

res.json({
  success: true,
  data: {
    username: user.username,
    role: user.role
  }
});

  req.session.user = user;

  res.json({ username: user.username, role: user.role });
});

//SESSION
app.get("/api/session", (req, res) => {

if (!req.session.user) {
  return res.status(401).json({
    success: false,
    message: "No session"
  });
}

res.json({
  success: true,
  data: req.session.user
});
});

// =========
// SIGNUP
// =========

// SIGNUP
app.post("/api/signup", (req, res) => {

  const db = readDB();

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Missing fields"
    });
  }

  const exists = db.users.find(
    u => u.username === username
  );

  if (exists) {
    return res.status(400).json({
      success: false,
      message: "Username already exists"
    });
  }

  db.users.push({
    username,
    password,
    role: "user"
  });

  createBackup();
  writeDB(db);

  res.json({
    success: true,
    message: "Account created"
  });
});


// ===========
// USERS API
// ===========

// GET USERS
app.get("/api/users", checkAdmin, (req, res) => {

  const db = readDB();

res.json({
  success: true,
  data: db.users
});
});

// ADD USER
app.post("/api/users", checkAdmin, (req, res) => {

  const db = readDB();

  const { username, password, role } = req.body;

  if (!username || !password) {
    
return res.status(400).json({
  success: false,
  message: "Missing Fields"
});
}

  const exists = db.users.find(
    u => u.username === username
  );

  if (exists) {
return res.status(400).json({
  success: false,
  message: "User Already Exists"
});  
}

  db.users.push({
    username,
    password,
    role: role || "user"
  });

  createBackup();
  writeDB(db);

res.json({
  success: true,
  message: "User created"
});
});

// UPDATE USER
app.put("/api/users/:username", checkAdmin, (req, res) => {

  const db = readDB();

  const user = db.users.find(
    u => u.username === req.params.username
  );

  if (!user) {
res.json({
  success: true,
  message: "User created"
});  
}

const { password, role } = req.body;

  if (password) {
    user.password = password;
  }

  if (role) {
    user.role = role;
  }

  createBackup();
  writeDB(db);

res.json({
  success: true,
  message: "User updated"
});
});

// DELETE USER
app.delete("/api/users/:username", checkAdmin, (req, res) => {

  const db = readDB();

  db.users = db.users.filter(
    u => u.username !== req.params.username
  );

  createBackup();
  writeDB(db);

res.json({
  success: true,
  message: "User deleted"
});
});


// ===============
// STUDENTS API 
// ==============

// =========================
// HOLIDAYS API
// =========================

// GET HOLIDAYS
app.get("/api/holidays", checkAuth, (req,res)=>{

  const db = readDB();

res.json({
  success: true,
  data: db.holidays || []
});
});

// ADD HOLIDAY
app.post("/api/holidays", checkAuth, (req,res)=>{

  const db = readDB();

  const { name, date } = req.body;

  if(!name || !date){
    return res.status(400).json({
      success: false,
      message:"Missing fields"
    });
  }

  const exists = db.holidays.find(
    h => h.date === date
  );

  if(exists){
    return res.status(400).json({
      success: false,
      message:"Holiday already exists"
    });
  }

  db.holidays.push({
    name, date
  });

  writeDB(db);

  res.json({
    success: true,
    message:"Holiday added"
  });

});

// DELETE HOLIDAY
app.delete("/api/holidays/:date", checkAuth, (req,res)=>{

  const db = readDB();

  db.holidays = db.holidays.filter(
    h => h.date !== req.params.date
  );

  writeDB(db);

  res.json({
    success: true,
    message:"Holiday deleted"
  });

});

// GET STUDENTS
app.get("/api/students", checkAuth, (req, res) => {
  const db = readDB();

  res.json({
  success: true,
  data: db.students
});
});

// ADD STUDENT
app.post("/api/students", checkAuth, (req, res) => {
  const db = readDB();

  const { name, id, courses, image } = req.body;

  if (!name || !id) {
    return res.status(400).json({ 
      success: false,
      message: "Missing fields" 
    });
  }

  const exists = db.students.find(s => s.id === id);

  if (exists) {
    return res.status(400).json({ 
      success: false,
      message: "Student exists" 
    });
  }

  db.students.push({
    name,
    id,
    courses: courses || [],
    image: image || "",
    active: true
  });

  createBackup();
  writeDB(db);

  res.json({ 
    success: true,
    message: "Student added" 
  });
});

// UPDATE STUDENT
app.put("/api/students/:id", checkAuth, (req, res) => {
  const db = readDB();
  const student = db.students.find(s => s.id === req.params.id);

  if (!student) {
    return res.status(404).json({ 
      success: false, 
      message: "Not found" 
    });
  }

  const { name, newId, courses, image, active } = req.body;

  if (name) student.name = name;
  if (courses) student.courses = courses;
  if (image !== undefined) student.image = image;
  if (active !== undefined) {student.active = active};

  if (newId && newId !== student.id) {
    const exists = db.students.find(s => s.id === newId);

    if (exists) {
      return res.status(400).json({ 
        success: false,
        message: "ID exists" 
      });
    }
    student.id = newId;
  }

  createBackup();
  writeDB(db);

  res.json({ 
    success: true,
    message: "Updated" 
  });
});

// DELETE STUDENT
app.delete("/api/students/:id", checkAuth, (req, res) => {
  const db = readDB();

  db.students = db.students.filter(s => s.id !== req.params.id);

  createBackup();
  writeDB(db);

  res.json({ 
    success: true,
    message: "Deleted" 
  });
});

// =========================
// ATTENDANCE API (FIXED)
// =========================

// GET
app.get("/api/attendance", checkAuth, (req, res) => {
  const db = readDB();

  res.json({
  success: true,
  data: db.attendance
});
});

// SAVE (FULL REPLACE MODEL)
app.post("/api/attendance", checkAuth, (req, res) => {
  const db = readDB();

  console.log("BODY RECEIVED:", req.body);

  if (!Array.isArray(req.body.attendance)) {
    return res.status(400).json({ 
      success: false,
      message: "Invalid format" 
    });
  }

  db.attendance = req.body.attendance;

  createBackup();
  writeDB(db);

  res.json({ 
    success: true,
    message: "Saved" 
  });
});

// CLEAR ALL ATTENDANCE
app.delete("/api/attendance", checkAuth, (req, res) => {

  const db = readDB();

  db.attendance = [];

  createBackup();
  writeDB(db);

  res.json({
    success: true,
    message: "All attendance cleared"
  });
});


// =========================
// MANUAL BACKUP
// =========================

app.post("/api/backup", checkAdmin, (req, res) => {

  try {
    createBackup();

    res.json({
      success: true,
      message: "Backup created"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Backup failed"
    });
  }
});

// =========================
// LIST BACKUPS
// =========================

app.get("/api/backups", checkAdmin, (req, res) => {

  try {
    const files = fs.readdirSync(backupDir);

    const backups = files
      .filter(file => file.endsWith(".json"))
      .sort()
      .reverse();

      res.json({
        success: true,
        data: backups
      });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to load backups"
    });
  }
});

// =========================
// RESTORE DATABASE
// =========================

app.post("/api/restore", checkAdmin, (req, res) => {

  try{
    const newDB = req.body;

    // BASIC VALIDATION
    if(
      !newDB.users ||
      !newDB.students ||
      !newDB.attendance
    ){
      return res.status(400).json({
        success: false,
        message:"Invalid backup file"
      });
    }

    // PRESERVE DB VERSION
    newDB.version = CURRENT_DB_VERSION;

    // WRITE DATABASE
    writeDB(newDB);

    res.json({
      success: true,
      message:"Database restored successfully"
    });

  }catch(err){
    console.error(err);

    res.status(500).json({
      success: false,
      message:"Restore failed"
    });
  }
});


// =========================
// LOGOUT
// =========================
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ 
      success: true,
      message: "Logged out" 
    });
  });
});

// =========================
// GLOBAL ERROR HANDLER
// =========================

app.use((err, req, res, next) => {

  console.error("SERVER ERROR:", err);

  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

// =========================
// START SERVER
// =========================
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});