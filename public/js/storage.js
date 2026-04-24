// STUDENTS

async function getStudents() {
  const res = await fetch("/api/students", {
    credentials: "include"
  });
  return await res.json();
}

async function saveStudents(students) {
  await fetch("/api/students", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify(students)
  });
}

// ATTENDANCE

async function getAttendance() {
  const res = await fetch("/api/attendance", {
    credentials: "include"
  });
  return await res.json();
}

async function saveAttendance(attendance) {
  await fetch("/api/attendance", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify(attendance)
  });
}

// USERS

async function getUsers() {
  const res = await fetch("/api/users", {
    credentials: "include"
  });
  return await res.json();
}

async function saveUsers(users) {
  await fetch("/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify(users)
  });
}

// EXPORT DATA

async function exportMonthlyReport(){

  // Get date safely (works on all pages)
  const dateInput = document.getElementById("datePicker");
  const selectedDate = dateInput 
    ? dateInput.value 
    : new Date().toISOString().slice(0,10);

  if(!selectedDate){
    alert("Select a date first");
    return;
  }

  const month = selectedDate.slice(0,7);

  const attendance = await getAttendance();
  const students = await getStudents();

  let summary = {};

  // Initialize stats
  students.forEach(s=>{
    summary[s.name] = { ontime:0, late:0, absent:0 };
  });

  // Count attendance
  attendance
    .filter(a => a.date.startsWith(month))
    .forEach(day=>{
      day.records.forEach(r=>{
        if(summary[r.student]){
          summary[r.student][r.status]++;
        }
      });
    });

  // Convert to array + sort
  const ranking = Object.entries(summary)
    .map(([name,stats])=>({ name, ...stats }))
    .sort((a,b)=>b.ontime - a.ontime);

  if(ranking.length === 0){
    alert("No records found");
    return;
  }

  // 🏆 TOP STUDENT
  const topScore = ranking[0].ontime;
  const topStudents = ranking.filter(s => s.ontime === topScore);

  let topHTML = `
    <div style="margin-bottom:20px; padding:10px; border:2px solid gold;">
      <h3>🏆 Top Student (${month})</h3>
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

// JSON BACKUP
function backupData(){
  window.open("/api/backup", "_blank");
}

function toggleMenu(){
  const nav = document.getElementById("navbar");
  nav.classList.toggle("show");
	
	window.addEventListener("DOMContentLoaded", loadUserProfile);
}