console.log("attendance-actions.js Loaded")

// MARK AS ABSENT
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

// SUBMIT ATTENDANCE
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

  showToast("Attendance saved successfully");
}


// CLEAR MONTH

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


// RESET ATTENDANCE

async function fullResetAttendance() {
  if (!confirm("Delete ALL attendance?")) return;

await API.saveAttendance([]);

  alert("All attendance deleted");

  const date = document.getElementById("datePicker").value;
  await loadAttendanceForDate(date);
};

