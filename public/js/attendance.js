console.log("Attendance Loaded");

/* =========================
   GLOBAL STATE
========================= */

window.attendanceData = {};


/* =========================
   ATTENDANCE
========================= */

async function loadAttendanceForDate(date) {

let students = [];

try {
  students = await API.getStudents();
  saveCachedStudents(students);

} catch {
  students = getCachedStudents();
}

 // only active students for attendance page
const activeStudents = getActiveStudents(students);

attendanceData = {};

let attendance = [];

try {
  attendance = await API.getAttendance();

} catch {
  attendance = await getOfflineAttendance();
}

const day = attendance.find(a => a.date === date);

if (day) {

  day.records.forEach(record => {

    attendanceData[record.studentId] = {
      status: record.status,
      time: record.time
    };

  });

}


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

/* INIT */
document.addEventListener("DOMContentLoaded", loadStudentDetails);


window.attendanceData;