console.log("Attendance Loaded");

/* =========================
   GLOBAL STATE
========================= */

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
   MARK AS ABSENT
========================= */

function markUnmarkedAsAbsent() {
  API.getStudents().then(students => {
    students = getActiveStudents(students);
    const settings = getSettings();

    if (settings.autoAbsent) {

      students.forEach(s => {
        const id = normalizeId(s.id);
        
        if (!attendanceData[id]) {
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

const students = await API.getStudents();

 // only active students for attendance page
const activeStudents = getActiveStudents(students);

attendanceData = {};
const attendance = await API.getAttendance() || [];
const day = attendance.find(a => a.date === date);


  if (day) {
    day.records.forEach(r => {
      attendanceData[normalizeId(r.studentId)] = {
        status: r.status,
        time: r.time || null
      };

    });
  }

  renderAttendanceTable(activeStudents);
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

async function renderAttendanceTable(students) {
  const container = document.getElementById("attendanceTable");
  if (!container) return;

  container.innerHTML = "";
students = getActiveStudents(students);

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

/* INIT */
document.addEventListener("DOMContentLoaded", loadStudentDetails);



/* =========================
   SAVE ATTENDANCE
========================= */

async function submitAttendance() {

  const date = document.getElementById("datePicker").value;
  if (!date) return alert("Select date first");
const selectedDate = document.getElementById("datePicker").value;

const holiday = await isHoliday(selectedDate);

if(holiday){
  alert(
    `Attendance disabled.\n${holiday.name} is a holiday.`
  );

  return;
}

let attendance = await API.getAttendance();

  // Fill unmarked as absent
const settings = getSettings();
const students = await API.getStudents();
const activeStudents = getActiveStudents(students);

if (settings.autoAbsent) {
  
  activeStudents.forEach(s => {
    const id = normalizeId(s.id);

    if (!attendanceData[id]) {
      attendanceData[id] = {
        status: "absent",
        time: null
      };
    }
  });
}

// remove existing same date
attendance = attendance.filter(a => a.date !== date);

// add updated day
attendance.push({
  date,
  records: activeStudents.map(s => {
    const id = normalizeId(s.id);

    return {
      studentId: id,
      status: attendanceData[id]?.status || "absent",
      time: attendanceData[id]?.time || null
    };
  })
});

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