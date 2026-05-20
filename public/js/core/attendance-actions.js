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
  if (!date) return alert("Select Date First");
const selectedDate = document.getElementById("datePicker").value;

const holiday = await isHoliday(selectedDate);

if(holiday){
  alert(
    `Attendance disabled.\n${holiday.name} is a Holiday.`
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

  showToast("Attendance Saved successfully");
}


// CLEAR MONTH

async function clearMonthAttendance() {
 const confirmed = await showConfirm("Delete Attendance for This Month?");
  if (!confirmed) return;

  const date = document.getElementById("datePicker").value;
  if (!date) return;

  const month = date.slice(0, 7);

  let attendance = await API.getAttendance();

  attendance = attendance.filter(day => !day.date.startsWith(month));

  await API.saveAttendance(attendance);

  showToast("Month Attendance Deleted");

  await loadAttendanceForDate(date);
}


// RESET ATTENDANCE

async function fullResetAttendance() {
  const confirmed = await showConfirm("Delete Attendance for all the Months?");
  if (!confirmed) return;

await API.saveAttendance([]);

  showToast("All Attendance Cleared");

  const date = document.getElementById("datePicker").value;
  await loadAttendanceForDate(date);
};

