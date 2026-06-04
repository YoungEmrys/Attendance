console.log("dashboard-reports Loaded")

// MONTHLY REPORT
async function generateMonthlyReport() {
  const date = document.getElementById("datePicker").value;
  const month = getMonth(date);

const attendance = await DataLayer.getAttendance();

let students = [];

try {
  students = await DataLayer.getStudents();
  saveCachedStudents(students);

} catch {
  students = getCachedStudents();
}

  const summary = {};

  students.forEach(s => {
    summary[s.id] = { ontime: 0, late: 0, absent: 0 };
  });

  attendance
    .filter(a => a.date.startsWith(month))
    .forEach(day => {
      day.records.forEach(r => {
        if (!summary[r.studentId]) return;
        summary[r.studentId][r.status]++;
      });
    });

  console.log("MONTHLY REPORT:", summary);

  return summary;
}


// WEEKLY REPORTS
async function generateWeeklyReport(date) {
  const { start, end } = getWeekRange(date);

const attendance = await DataLayer.getAttendance();

let students = [];

try {
  students = await DataLayer.getStudents();
  saveCachedStudents(students);

} catch {
  students = getCachedStudents();
}

  const summary = {};

  students.forEach(s => {
    summary[s.id] = {
      name: s.name,
      ontime: 0,
      late: 0,
      absent: 0
    };
  });

  attendance
    .filter(a => a.date >= start && a.date <= end)
    .forEach(day => {
      day.records.forEach(r => {

		  const student = students.find(s => s.id === r.studentId);
		  if (!student) return;
		  summary[student.id][r.status]++;      
	  });
    });

  return Object.values(summary);
}


window.generateWeeklyReport = generateWeeklyReport;
window.generateMonthlyReport = generateMonthlyReport;