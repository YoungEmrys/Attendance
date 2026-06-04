console.log("attendance-actions.js Loaded")

// MARK AS ABSENT
async function markUnmarkedAsAbsent() {

  showLoader();
  await new Promise(r => setTimeout(r, 500));
  hideLoader();

const students = getActiveStudents(await API.getStudents());

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

  renderAttendanceTable(students);
 
}

// SUBMIT ATTENDANCE
async function submitAttendance() {

  const date = document.getElementById("datePicker").value;
  if (!date) return showToast("Select Date First", "warning");

const selectedDate = document.getElementById("datePicker").value;

const holiday = await isHoliday(selectedDate);

if(holiday){
  showToast(
    `Attendance Disabled.\n${holiday.name} is a Holiday.`, 
    "warning"
  );

  return;
}

let attendance = [];

try{
  attendance = await DataLayer.getAttendance();

} catch {

  attendance = await getOfflineAttendance();
}

  // Fill unmarked as absent
const settings = getSettings();
let students = [];

try {
  students = await DataLayer.getStudents();
  saveCachedStudents(students);

} catch {
  students = getCachedStudents();
}

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

const attendanceDay = {

  date,
  records: activeStudents.map(s => {
    const id = normalizeId(s.id);

    return {
      studentId: id,
      
      status: attendanceData[id]?.status || "absent",
      time: attendanceData[id]?.time || null
    };
  }),

  updatedAt: new Date().toISOString(),

  updatedBy: localStorage.getItem("username")
    || "unknown",

  version: Date.now()
};

// remove existing same date
const updatedAttendance = [
  ...attendance.filter(a => a.date !== date),
  attendanceDay
];

showLoader();

try {
  await new Promise(
    r => setTimeout(r, 2000)
  );

console.log("FINAL PAYLOAD:", attendance);

   //ONLINE SAVE
  try {
    await API.saveAttendance(updatedAttendance); 

    showToast(
      "Attendance Saved Successfully",
      "success"
    );

  } catch (err) {
    console.error(err);

    if (err.message === "Offline") {
      
/* =========================
   OFFLINE SAVE
========================= */

    try {

      await saveAttendanceOffline({
        date,
        records: attendanceDay.records
      });

      await addToSyncQueue({
        
        id:
          "attendance_" +
          Date.now(),

        type: "attendance_save",

        payload: attendanceDay,

        status: "pending",

        createdAt: new Date().toISOString()
      });

    showToast(
        "Saved Offline • Pending Sync",
        "warning"
      );

    } catch (offlineErr) {

      console.error(offlineErr);

    showToast(
      "Server Save Failed",
      "error"
    );
  }
} else {

    console.error(err);

    showToast(
      "Server Save Failed",
      "error"
    );
  }
}

} finally {
  hideLoader();
}

renderAttendanceTable(activeStudents);
AppState.notify();
}

// CLEAR MONTH

async function clearMonthAttendance() {
 const confirmed = await showConfirm("Delete Attendance for This Month?");
  if (!confirmed) return;

  const date = document.getElementById("datePicker").value;
  if (!date) return;

  const month = date.slice(0, 7);

  let attendance = await DataLayer.getAttendance();
 
  attendance = attendance.filter(day => !day.date.startsWith(month));

  showLoader();
await new Promise(r => setTimeout(r, 2000));
hideLoader();
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

