// MIDDLE WARE

const session = require("express-session");
const express = require("express");
const fs = require("fs");
const path = require("path");
const dbPath = path.join(__dirname, "../server/database.json");

const app = express();

const PORT = process.env.PORT || 3000;
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({limit: '10mb', extended: true}));

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

app.use(express.static(path.join(__dirname, "../public")));

// EXPLICIT ROUTE
app.get("/", (req, res) => {
if (!req.session.user) {
  return res.sendFile(path.join(__dirname, "../public/index.html"));
}
res.sendFile(path.join(__dirname, "../public/index.html"));

});

app.get("/debug", (req, res) => {
  const fs = require("fs");
  res.json({
    files: fs.readdirSync(__dirname),
    parent: fs.readdirSync(require("path").join(__dirname, ".."))
  });
});


// Optional: fallback for any other routes to index.html
// Useful if you directly access /attendance.html etc.
app.get("/:page", (req, res) => {
  const page = req.params.page;
  const filePath = path.join(__dirname, "../public", `${req.params.page}.html`);
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

  const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

  // ? CLEAN IDS ON LOAD
  if (Array.isArray(db.students)) {
    db.students = db.students.map(s => ({
      ...s,
      id: String(s.id || "").trim()
    }));
  }

  return db;
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
	
  const db = readDB(); // ✅ FIRST

  const { name, id, courses, image, status, mode, students } = req.body;

  if (mode === "bulk") {
    db.students = students;
    writeDB(db);
    return res.json({ message: "Bulk update success" });
  }

  if (!name || !id) {
    return res.status(400).json({ message: "Name and ID required" });
  }
	
		if (!/^[a-zA-Z0-9]+$/.test(id)) {
  return res.status(400).json({
    message: "Invalid ID: only letters and numbers allowed"
  });
}

if (/\s/.test(id)) {
  return res.status(400).json({
    message: "Invalid ID: no spaces allowed"
  });
}


  if (!db.students) db.students = [];

  const existingIndex = db.students.findIndex(s => s.id === id);

  if (mode !== "edit") {
    if (existingIndex !== -1) {
      return res.status(400).json({ message: "ID already exists" });
    }

    db.students.push({
      name,
      id,
      courses: courses || [],
      image: image || "",
      status: status || "active"
    });

    writeDB(db);
    return res.json({ message: "Student created" });
  }
	
  if (mode === "edit") {
    if (existingIndex === -1) {
      return res.status(404).json({ message: "Student not found" });
    }

    db.students[existingIndex] = {
      ...db.students[existingIndex],
      name,
      id,
      courses: courses || [],
      image: image || "",
      status: status || "active"
    };

    writeDB(db);
    return res.json({ message: "Student updated" });
  }
	
	if (image && image.length > 3_000_000) {
  return res.status(400).json({
    message: "Image too large"
  });
}

});

app.put("/api/students/:id", checkAuth, (req, res) => {
	
  const db = readDB();

  const id = req.params.id;
  const { name, newId, courses, image } = req.body;
	
		if (newId && !/^[a-zA-Z0-9]+$/.test(newId)) {
  return res.status(400).json({
    message: "Invalid ID format"
  });
}

if (/\s/.test(newId)) {
  return res.status(400).json({
    message: "ID cannot contain spaces"
  });
}

  const student = db.students.find(s => s.id === id);

  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  // 🔒 Prevent duplicate ID if changed
  if (newId && newId !== id) {
    const idExists = db.students.find(s => s.id === newId);
    if (idExists) {
      return res.status(400).json({ message: "ID already exists" });
    }
    student.id = newId;
  }

  // ✏️ Update fields
  if (name) student.name = name;
  if (courses) student.courses = courses;
  if (image !== undefined) student.image = image;

  writeDB(db);

  res.json({ message: "Student updated successfully" });
});


  // DELETE STUDENT

app.delete("/api/students/:id", checkAuth, (req, res) => {
  try {
    const db = readDB(); // ✅ use same DB

    const id = req.params.id;

    const index = db.students.findIndex(s => s.id === id);

    if (index === -1) {
      return res.status(404).json({ message: "Student not found" });
    }

    db.students.splice(index, 1);

    writeDB(db);

    res.json({ message: "Student deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error deleting student" });
  }
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
  console.log("NEW ATTENDANCE ROUTE HIT")
  const db = readDB();
  
  if (!db.attendance) db.attendance = [];

const { date, records } = req.body;	
	
	records.forEach(r => {
		console.log("Record:", r);
    db.attendance.push({
      id: "", // will improve later
	name: r.student,
      date,
      time: null,
      checkout: null,
      status: r.status || "present",
      source: "manual"
    });
  });
  
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

// CLEAN AND SAVE IDS ON SERVER START
(function cleanStudentIds() {
  const db = readDB();

  if (!Array.isArray(db.students)) return;

  let changed = false;

  db.students = db.students.map(s => {
    const cleanId = String(s.id || "").trim();

    if (s.id !== cleanId) changed = true;

    return { ...s, id: cleanId };
  });

  if (changed) {
    console.log("Fixing student IDs...");
    writeDB(db);
    console.log("Student IDs cleaned and saved");
  }
})();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});