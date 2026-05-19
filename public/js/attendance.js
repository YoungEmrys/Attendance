console.log("Attendance Loaded");

/* =========================
   GLOBAL STATE
========================= */

window.attendanceData = {};


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

/* INIT */
document.addEventListener("DOMContentLoaded", loadStudentDetails);


window.attendanceData;