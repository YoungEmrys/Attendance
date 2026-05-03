console.log("Attendance script loaded");

/* =========================
   GLOBAL STATE
========================= */

/* =========================
SETTINGS
========================= */

function getSettings() {
  const saved = localStorage.getItem("settings");

  const DEFAULT_SETTINGS = {
    lateTime: "08:30",
    graceEnabled: false,
    graceTime: "08:10",
    compareMode: "strict",
    autoAbsent: true,
    displayMode: "friendly",
    timeFormat: "12h",
    idPadding: 3,
  };

  return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
}


/* =========================
   HELPERS
========================= */

function getInitials(name) {
  if (!name) return "??";
  return name.split(" ").map(n => n[0]).join("").toUpperCase();
}

function todayString() {
  return new Date().toISOString().split("T")[0];
}

function getDayName(dateStr) {
  const [y, m, d] = dateStr.split("-");
  const date = new Date(y, m - 1, d);  
  
  if (isNaN(d)) return "";
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function formatDate(dateStr) {
  const settings = getSettings();
const [y, m, d] = dateStr.split("-");
const date = new Date(y, m - 1, d);

  if (settings.displayMode === "compact") {
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit"
    });
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric"
  });
}

function normalizeId(id) {
  const settings = getSettings();

  let clean = String(id).trim();

  // remove leading zeros first (important)
  clean = String(parseInt(clean));

  if (!settings.idPadding || settings.idPadding <= 0) {
    return clean; // no padding
  }

  return clean.padStart(settings.idPadding, "0");
}

let attendanceData = {};

/* =========================
   INIT
========================= */

document.addEventListener("DOMContentLoaded", init);

async function init() {
  try {
    console.log("INIT START");

    // STUDENTS PAGE
    if (document.getElementById("studentCards")) {
      loadStudents();

      const input = document.getElementById("searchStudent");
      if (input) {
        input.addEventListener("input", (e) => {
          loadStudents(e.target.value);
        });
      }
    }

    // ATTENDANCE PAGE
    if (document.getElementById("datePicker")) {
      const datePicker = document.getElementById("datePicker");

      datePicker.value = todayString();

      await loadAttendanceForDate(datePicker.value);

      datePicker.addEventListener("change", onDateChange);
    }

    if (document.getElementById("editStudentForm")) {
  loadEditStudent();
}

    // SAVE BUTTON
const saveBtn = document.getElementById("saveAttendanceBtn");
if (saveBtn) {
  saveBtn.addEventListener("click", submitAttendance);
}

// MARK ABSENT
const markAbsentBtn = document.getElementById("markAbsentBtn");
if (markAbsentBtn) {
  markAbsentBtn.addEventListener("click", markUnmarkedAsAbsent);
}

// CLEAR MONTH
const clearBtn = document.getElementById("clearMonthBtn");
if (clearBtn) {
  clearBtn.addEventListener("click", clearMonthAttendance);
}

// RESET
const resetBtn = document.getElementById("resetAttendanceBtn");
if (resetBtn) {
  resetBtn.addEventListener("click", fullResetAttendance);
}

    // ADD STUDENT BUTTON
    const btn = document.getElementById("addStudentBtn");
    if (btn) {
      btn.addEventListener("click", addStudent);
    }

    // COURSE BUTTON
    const courseBtn = document.getElementById("addCourseBtn");
    if (courseBtn) {
      courseBtn.addEventListener("click", () => {
        const input = document.getElementById("studentCourseInput");
        const value = input.value.trim();
        if (!value) return;

        const tag = document.createElement("span");
        tag.textContent = value;

        document.getElementById("courseTags").appendChild(tag);
        input.value = "";
      });
    }

    const imageInput = document.getElementById("studentImage");
if (imageInput) {
  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById("imagePreview").src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

    console.log("INIT DONE");

  } catch (err) {
    console.error("INIT ERROR:", err);
  }
}


/* =========================
   GLOBAL ACTIONS
========================= */

window.openStudentDetails = async function(id) {
const res = await API.getStudents();
  const students = res.data || res;
  
  const student = students.find(s => String(s.id) === String(id));

  if (!student) {
    alert("Student not found");
    return;
  }

localStorage.setItem("selectedStudent", JSON.stringify(student));

window.location.href = "student-details.html";
};

window.editStudent = async function(id) {
  const res = await API.getStudents();
  const students = res.data || res;

  const student = students.find(s => String(s.id) === String(id));

  if (!student) {
    alert("Student not found");
    return;
  }

  localStorage.setItem("editStudent", JSON.stringify(student));
  window.location.href = "edit-student.html";
};

window.deleteStudent = async function(id) {
  if (!confirm("Delete this student?")) return;

  try {
    await API.deleteStudent(id);
    alert("Deleted successfully");
    loadStudents();

  } catch (err) {
    console.error(err);
    alert("Delete failed");
  }
};


/* =========================
   SETTINGS FUNCTION
========================= */


/* =========================
   LOAD STUDENTS
========================= */

async function loadStudents(search = "") {
  const container = document.getElementById("studentCards");
  if (!container) return;

  try {
const res = await API.getStudents();
const students = res.data || res;

    let filtered = students;

    if (search && search.trim() !== "") {
      const q = search.toLowerCase();
      filtered = students.filter(s =>
        (s.name || "").toLowerCase().includes(q)
      );
    }

    if (filtered.length === 0) {
      container.innerHTML = "<p>No students found</p>";
      return;
    }

    container.innerHTML = filtered.map(s => `
      <div class="student-card" onclick="openStudentDetails('${s.id}')">

        <div class="student-header">
          <div class="student-img">
            ${
              s.image
                ? `<img src="${s.image}" class="student-img">`
                : getInitials(s.name)
            }
          </div>

          <div>
            <strong>${s.name}</strong><br>
            <small>ID: ${s.id}</small><br>
            <small>${(s.courses || []).join(", ")}</small>
          </div>
        </div>

        <div>
          <button class= "edit-btn"  onclick="event.stopPropagation(); editStudent('${s.id}')">Edit</button>
          <button class= "delete-btn" onclick="event.stopPropagation(); deleteStudent('${s.id}')">Delete</button>
        </div>

      </div>
    `).join("");

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p style='color:red'>Failed to load students</p>";
  }
}

/* =========================
   ADD STUDENT
========================= */

async function addStudent() {
  try {
    const name = document.getElementById("studentName").value.trim();
    const id = document.getElementById("studentId").value.trim();

    if (!name || !id) {
      alert("Student name and ID are required");
      return;
    }

    if (!/^\d+$/.test(id)) {
  alert("Student ID must contain numbers only");
  return;
}

const res = await API.getStudents();
const students = res.data || res;

if (students.some(s => normalizeId(s.id) === normalizeId(id))) {
  alert("Student ID already exists");
  return;
}

    const courseTags = document.querySelectorAll("#courseTags span");
    const courses = Array.from(courseTags).map(tag => tag.textContent);

    
    let image = "";

    const MAX_IMAGE_SIZE_MB = 1;

    const imageInput = document.getElementById("studentImage");

    if (imageInput && imageInput.files.length > 0) {
      const file = imageInput.files[0];

      const sizeMB = file.size / (1024 * 1024);

      if (sizeMB > MAX_IMAGE_SIZE_MB) {
    alert(`Image too large. Max allowed is ${MAX_IMAGE_SIZE_MB}MB`);
    return;
  }
      const reader = new FileReader();

      image = await new Promise(resolve => {
        reader.onload = e => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    }

    await API.addStudent({ name, id, courses, image });

    alert("Student Added Successfully");

    // clear form
    document.getElementById("studentName").value = "";
    document.getElementById("studentId").value = "";
    document.getElementById("courseTags").innerHTML = "";
    document.getElementById("studentImage").value = "";
    document.getElementById("imagePreview").src = "";
loadStudents();

  } catch (err) {
    console.error(err);
    alert("Failed to add student");
  }
}

/* =========================
   MARK AS ABSENT
========================= */

function markUnmarkedAsAbsent() {
  API.getStudents().then(res => {
    const students = res.data || res;
    const settings = getSettings();

    if (settings.autoAbsent) {
      students.forEach(s => {
        if (!attendanceData[s.id]) {
          attendanceData[s.id] = {
            status: "absent",
            time: null
          };
        }
      });
    }

    renderAttendanceTable(students);
  });
}


/* =========================
   ATTENDANCE
========================= */

async function loadAttendanceForDate(date) {
  const res = await API.getStudents();
  const students = res.data || res;

  const attendance = await API.getAttendance();

  attendanceData = {};

  const day = attendance.find(a => a.date === date);

  if (day) {
    day.records.forEach(r => {
      attendanceData[normalizeId(r.studentId)] = {
        status: r.status,
        time: r.time || null
      };
    });
  }

  renderAttendanceTable(students);
}


async function onDateChange() {
  const date = document.getElementById("datePicker").value;
  if (!date) return;

  attendanceData = {};
  await loadAttendanceForDate(date);
}


/* =========================
   RENDER ATTENDANCE TABLE
========================= */

function formatTime(t) {
  const settings = getSettings();

  if (!t || t === "--:--") return "--:--";

  if (settings.timeFormat === "24h") {
    return t;
  }

  const [h, m] = t.split(":");
  let hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";

  if (hour > 12) hour -= 12;
  if (hour === 0) hour = 12;

  return `${hour}:${m} ${ampm}`;
}


async function renderAttendanceTable(students) {
  const container = document.getElementById("attendanceTable");
  if (!container) return;

  container.innerHTML = "";

  students.forEach(s => {
    const record = attendanceData[normalizeId(s.id)] || {};    
    const status = record.status || "";
    const time = record.time || "--:--";

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h3>${s.name}</h3>

      <div class="time-display ${status}">
        ${formatTime(time)}
      </div>

      <div class="status-buttons">

        <button class="btn-ontime ${status === "ontime" ? "active-status" : ""}"
          onclick="setStatus('${s.id}','ontime',this)">
          On Time
        </button>

        <button class="btn-late ${status === "late" ? "active-status" : ""}"
          onclick="setStatus('${s.id}','late',this)">
          Late
        </button>

        <button class="btn-absent ${status === "absent" ? "active-status" : ""}"
          onclick="setStatus('${s.id}','absent',this)">
          Absent
        </button>

      </div>
    `;

    container.appendChild(card);
  });
}


/* =========================
   SET STATUS
========================= */

function setStatus(id, status, btn) {
  id = normalizeId(id);

  if (!attendanceData[id]) {
    attendanceData[id] = { time: null };
  }

  attendanceData[id].status = status;

  const parent = btn.parentElement;

  parent.querySelectorAll("button").forEach(b => {
    b.classList.remove("active-status");
  });

  btn.classList.add("active-status");

  // update color on time display
  const card = btn.closest(".card");
  const timeDiv = card.querySelector(".time-display");

  timeDiv.className = "time-display " + status;
}

/* =========================
   EDIT STUDENT
========================= */

let editCourses = [];

function loadEditStudent() {
  const student = JSON.parse(localStorage.getItem("editStudent"));
  if (!student) return;

  document.getElementById("editName").value = student.name || "";
  document.getElementById("editId").value = student.id || "";

  // Load courses
  editCourses = [...(student.courses || [])];
  renderEditCourses();

  // Image preview
  const preview = document.getElementById("editImagePreview");
  if (preview) {
    preview.src = student.image || "";
  }

  // Realtime image preview
  const imageInput = document.getElementById("editImage");
  if (imageInput) {
    imageInput.addEventListener("change", () => {
      const file = imageInput.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = e => {
        preview.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Add course button
  const btn = document.getElementById("addCourseBtnEdit");
  if (btn) {
    btn.addEventListener("click", addEditCourse);
  }
}

/* =========================
   SAVE EDIT
========================= */

async function saveEdit() {
  const student = JSON.parse(localStorage.getItem("editStudent"));
  if (!student) return alert("No student loaded");

  const name = document.getElementById("editName").value.trim();
  const id = document.getElementById("editId").value.trim();

  if (!name || !id) return alert("Student Name and ID required");

  if (!/^\d+$/.test(id)) {
  alert("Student ID must contain numbers only");
  return;
}

  let image = student.image;

  const MAX_IMAGE_SIZE_MB = 1;
  const imageInput = document.getElementById("editImage");

  if (imageInput && imageInput.files.length > 0) {

    const file = imageInput.files[0];
    const sizeMB = file.size / (1024 * 1024);
    const reader = new FileReader();

    if (sizeMB > MAX_IMAGE_SIZE_MB) {
    alert(`Image too large. Max allowed is ${MAX_IMAGE_SIZE_MB}MB`);
    return;
  }
    image = await new Promise(resolve => {
      reader.onload = e => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }

  await API.updateStudent(student.id, {
    name,
    id,
    courses: editCourses,
    image
  });

  alert("Student updated");
  window.location.href = "registered-students.html";
}

/* =========================
   UPDATE COURSE IN EDIT PAGE
========================= */

function addEditCourse() {
  const input = document.getElementById("editCourseInput");
  const value = input.value.trim();

  if (!value) return;

  if (editCourses.includes(value)) {
    alert("Course already added");
    return;
  }

  editCourses.push(value);
  input.value = "";

  renderEditCourses();
}

function renderEditCourses() {
  const container = document.getElementById("editCourses");

  container.innerHTML = editCourses.map(c => `
    <span onclick="removeEditCourse('${c}')">
      ${c} ❌
    </span>
  `).join("");
}

function removeEditCourse(course) {
  editCourses = editCourses.filter(c => c !== course);
  renderEditCourses();
}

function goBack() {
  window.location.href = "registered-students.html";
}

/* =========================
   LOAD DETAILS (CLEAN)
========================= */
function loadStudentDetails() {
  const student = JSON.parse(localStorage.getItem("selectedStudent"));

  const profileBar = document.getElementById("profileBar");
  const coursesContainer = document.getElementById("coursesContainer");

  if (!profileBar) return;

  if (!student) {
    profileBar.innerHTML = "<p style='color:red'>Student not found</p>";
    return;
  }

  /* PROFILE BAR*/
  profileBar.innerHTML = `
    <div class="profile-bar">

      <img 
        src="${student.image || ''}" 
        class="profile-img"
        onerror="this.src='https://via.placeholder.com/90'"
      />

      <div class="profile-info">
        <h3>${student.name}</h3>
        <p><strong>ID:</strong> ${student.id}</p>
        <p><strong>Courses:</strong> ${(student.courses || []).join(", ")}</p>      </div>
     </div>
  `;

  /* COURSES */
if (coursesContainer) {
    if (!student.courses || student.courses.length === 0) {
      coursesContainer.innerHTML = `<p class="empty">No courses assigned</p>`;
    }  
  }

}

/* INIT */
document.addEventListener("DOMContentLoaded", loadStudentDetails);



/* =========================
   SAVE ATTENDANCE
========================= */

async function submitAttendance() {
  const date = document.getElementById("datePicker").value;
  if (!date) return alert("Select date first");

const res = await API.getStudents();
const students = res.data || res;

let attendance = await API.getAttendance();

  // Fill unmarked as absent
const settings = getSettings();

if (settings.autoAbsent) {
  students.forEach(s => {
    const id = normalizeId(s.id);

    if (!attendanceData[id]) {
      attendanceData[id] = {
        status: "absent",
        time: null
      };
    }
  });
}

  // Remove existing date
  attendance = attendance.filter(a => a.date !== date);

  // Add new & save attendance
  attendance.push({
    date,
    records: students.map(s => {
      const id = normalizeId(s.id);

      return{
      studentId: id,
      status: attendanceData[id]?.status,
      time: attendanceData[id]?.time
    };
  })
})

  await API.saveAttendance(attendance);

  alert("Attendance saved successfully");
}


/* =========================
   CLEAR MONTH
========================= */

async function clearMonthAttendance() {
  if (!confirm("Clear this month's attendance?")) return;

  const date = document.getElementById("datePicker").value;
  if (!date) return;

  const month = date.slice(0, 7);

  let attendance = await API.getAttendance();

  attendance = attendance.filter(day => !day.date.startsWith(month));

  await API.saveAttendance(attendance);

  alert("Month cleared");

  await loadAttendanceForDate(date);
}


/* =========================
   FULL RESET
========================= */

async function fullResetAttendance() {
  if (!confirm("Delete ALL attendance?")) return;

await API.saveAttendance([]);

  alert("All attendance deleted");

  const date = document.getElementById("datePicker").value;
  await loadAttendanceForDate(date);
}


/* =========================
   FILE HANDLER
========================= */

async function handleFile() {
  const input = document.getElementById("file");
  const file = input.files[0];

  if (!file) {
    alert("Select a file first");
    return;
  }

  // 🔥 CLEAR OLD DATA
  window.previewData = null;
  document.getElementById("previewContainer").innerHTML = "";

  const data = await file.arrayBuffer();

  const workbook = XLSX.read(data, { type: "array" });

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json(sheet);

  console.log("RAW ROWS:", rows);

  processRows(rows);
}


/* =========================
   PROCESSOR FOR ROWS
========================= */

function processRows(rows) {
  const grouped = {};
  const seen = {};

  if (!rows || rows.length < 2) {
    console.error("Invalid file");
    return;
  }

  /* =========================
     1. FIND HEADER ROW (DATES)
  ========================= */
  const headerIndex = rows.findIndex(row =>
    Object.values(row).some(v => typeof v === "number" && v >= 1 && v <= 31)
  );

  if (headerIndex === -1) {
    console.error("No header row found");
    return;
  }

  const headerRow = rows[headerIndex];

  /* =========================
     2. BUILD DAY MAP
  ========================= */
  const dayMap = {};

  Object.entries(headerRow).forEach(([key, value]) => {
    if (typeof value === "number" && value >= 1 && value <= 31) {
      dayMap[key] = value;
    }
  });

  console.log("DAY MAP:", dayMap);

  /* =========================
     3. DETECT YEAR + MONTH FROM FILE NAME (AUTO)
  ========================= */
let today = new Date();
let year = today.getFullYear();
let month = today.getMonth() + 1;

if (Object.values(dayMap).some(d => d <= 3)) {
  const prev = new Date(today.getFullYear(), today.getMonth() - 1);
  month = prev.getMonth() + 1;
  year = prev.getFullYear();
}

  // Try to extract from first column header text
  const firstRow = rows[0];
  const titleText = Object.values(firstRow).join(" ");

  const match = titleText.match(/(\d{4})-(\d{2})/);
  if (match) {
    year = parseInt(match[1]);
    month = parseInt(match[2]);
  }

  console.log("Detected:", { year, month });

  /* =========================
     4. PROCESS DATA ROWS
  ========================= */
  const dataRows = rows.slice(headerIndex + 1);

  dataRows.forEach(row => {
    // 🔥 Find ID dynamically (first non-empty value)
    let rawId = null;

    for (let key of Object.keys(row)) {
      if (row[key]) {
        rawId = String(row[key]).trim();
        break;
      }
    }

    if (!rawId) return;
    const id = normalizeId(rawId);

    Object.keys(dayMap).forEach(colKey => {
      let time = row[colKey];

      if (!time) return;

      // Handle Excel numeric time
      if (typeof time === "number") {
        time = XLSX.SSF.format("hh:mm", time);
      }

      if (typeof time !== "string") return;

      time = time.trim();

      if (!/^\d{1,2}:\d{2}$/.test(time)) return;

      const day = dayMap[colKey];

      const maxDays = new Date(year, month, 0).getDate();
      if (day < 1 || day > maxDays) return;

      const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      const uniqueKey = id + "_" + date;
      if (seen[uniqueKey]) return;

      seen[uniqueKey] = true;

      if (!grouped[date]) grouped[date] = {};
      grouped[date][id] = time;
    });
  });

  console.log("GROUPED:", grouped);

  buildPreview(grouped);
}


/* =================================
   MATCHING STUDENT WITH TIME RULE
====================================*/

async function buildPreview(grouped) {
  const res = await API.getStudents();
  const students = res.data || res;

  const studentMap = {};
  students.forEach(s => {
    studentMap[normalizeId(s.id)] = s;
  });

const settings = getSettings();
const LATE_TIME = settings.lateTime;

  const previewData = [];

  Object.keys(grouped).forEach(date => {
    const records = [];

    const dayData = grouped[date];

students.forEach(s => {
  const id = normalizeId(s.id);

  const time = dayData[id] || null;

  let status = "absent";

  if (time) {
    if (settings.compareMode === "strict") {
      status = time > LATE_TIME ? "late" : "ontime";
    }
  }

  records.push({
    studentId: id,
    name: s.name,
    time: time || "--:--",
    status,
    matched: true
  });
});


    // detect unmatched IDs
    Object.keys(dayData).forEach(rawId => {
      const id = normalizeId(rawId);

      if (!studentMap[id]) {
        records.push({
          studentId: id,
          name: "Unknown",
          time: dayData[id],
          status: dayData[id] > LATE_TIME ? "late" : "ontime",
          matched: false
        });
      }
    });

    previewData.push({ date, records });
  });

  console.log("PREVIEW DATA:", previewData);

  renderPreview(previewData);
}

/* =========================
  ATTENDANCE PREVIEW FILTER
============================ */

function applyPreviewFilter() {
  if (!window.previewData) return;

  const start = document.getElementById("previewStart").value;
  const end = document.getElementById("previewEnd").value;

  if (!start || !end) {
    renderPreview(window.previewData);
    return;
  }

  const filtered = window.previewData.filter(day => {
    return day.date >= start && day.date <= end;
  });

  renderPreview(filtered);
}


/* =========================
   ATTENDANCE PREVIEW
========================= */

function renderPreview(data) {
  const container = document.getElementById("previewContainer");
  if (!container) return;

  container.innerHTML = "";

  data.forEach(day => {
    const section = document.createElement("div");

    section.innerHTML = `
      <h3>${formatDate(day.date)} (${getDayName(day.date)})</h3>
      ${day.records.map(r => `
  <div class="preview-row ${r.matched ? "" : "unmatched"}">
    <span>${r.studentId}</span>
    <span>${r.name}</span>
    <span>${r.time}</span>
    <span>${r.status}</span>
  </div>
`).join("")}
    `;

    container.appendChild(section);
  });

  window.previewData = data; // store globally for confirm
}


/* =========================
   CONFIRM IMPORT
========================= */

async function confirmImport() {
  if (!window.previewData) return;

  let attendance = await API.getAttendance();

window.previewData.forEach(day => {
  let existing = attendance.find(a => a.date === day.date);

  const newRecords = day.records
    .filter(r => r.matched)
    .map(r => ({
      studentId: r.studentId,
      status: r.status,
      time: r.time
    }));

  if (!existing) {
    attendance.push({
      date: day.date,
      records: newRecords
    });
  } else {
    // 🔥 merge per student (overwrite only those present)
    newRecords.forEach(newRec => {
      const index = existing.records.findIndex(
        r => r.studentId === newRec.studentId
      );

      if (index >= 0) {
        existing.records[index] = newRec; // overwrite
      } else {
        existing.records.push(newRec);
      }
    });
  }
});
  await API.saveAttendance(attendance);

await loadAttendanceForDate(
  document.getElementById("datePicker").value
);

  alert("Import successful");
}




/* =========================
   CANCEL IMPORT
========================= */

function cancelImport() {
  document.getElementById("previewContainer").innerHTML = "";
  window.previewData = null;
}