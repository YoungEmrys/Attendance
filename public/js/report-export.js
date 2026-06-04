console.log("report-export.js Loaded")

// EXPORT DATA
async function exportMonthlyReport(){

  // Get date safely (works on all pages)
  const dateInput = document.getElementById("datePicker");
  const selectedDate = dateInput 
    ? dateInput.value 
    : new Date().toISOString().slice(0,10);

  if(!selectedDate){
    showToast("Select a date first", "warning");
    return;
  }

  const month = selectedDate.slice(0,7);

  const attendance = await DataLayer.getAttendance();
let students = [];

try {
  students = await DataLayer.getStudents();
  saveCachedStudents(students);

} catch {
  students = getCachedStudents();
}

  let summary = {};

  // Initialize stats
  students.forEach(s=>{
    summary[s.name] = { ontime:0, late:0, absent:0 };
  });

  // Count attendance
// Count attendance
attendance 
showLoader();
    await new Promise(r => setTimeout(r, 1000));
hideLoader();
const holidays = await getHolidays();

attendance
  .filter(day => {

    if(!day.date.startsWith(month)){
      return false;
    }

    const isHolidayDate =
    holidays.find(h => h.date === day.date);

    return !isHolidayDate;

  })
  
  .forEach(day => {

    if (!day.records) return; // safety

    day.records.forEach(r => {

      const student = students.find(s => s.id === r.studentId);
      if (!student) return;

      if (!summary[student.name]) {
        summary[student.name] = { ontime: 0, late: 0, absent: 0 };
      }

      summary[student.name][r.status]++;

    });

  });
	
	
  // Convert to array + sort
  const ranking = Object.entries(summary)
    .map(([name,stats])=>({ name, ...stats }))
    .sort((a,b)=>b.ontime - a.ontime);

  if(ranking.length === 0){
    showToast("No Records Found", "warning");
    return;
  }

  // TOP STUDENT
  const topScore = ranking[0].ontime;
  const topStudents = ranking.filter(s => s.ontime === topScore);

  let topHTML = `
    <div style="margin-bottom:20px; padding:10px; border:2px solid gold;">
      <h3>?? Top Student (${month})</h3>
  `;

  topStudents.forEach(s=>{
    topHTML += `<p>${s.name} — ${s.ontime} days</p>`;
  });

  topHTML += `</div>`;

  // Build report
  let report = `
  <html>
  <head>
    <title>Report</title>
    <style>
      body{font-family:Arial;padding:20px;}
      table{width:100%;border-collapse:collapse;}
      th,td{border:1px solid #000;padding:8px;text-align:center;}
    </style>
  </head>
  <body>

    <h2>Attendance Report - ${month}</h2>

    ${topHTML}

    <table>
      <tr>
        <th>Student</th>
        <th>On Time</th>
        <th>Late</th>
        <th>Absent</th>
      </tr>
  `;

  ranking.forEach(r=>{
    report += `
      <tr>
        <td>${r.name}</td>
        <td>${r.ontime}</td>
        <td>${r.late}</td>
        <td>${r.absent}</td>
      </tr>
    `;
  });

  report += `
    </table>
  </body>
  </html>
  `;

  const win = window.open("", "_blank");
  win.document.write(report);
  win.document.close();
  win.print();
}
