console.log("dashboard-render.js Loaded")

//RENDER DASHBOARD
async function renderDashboard() {
  const today = new Date()
  .toISOString()
  .split("T")[0];

	const monthInput = document.getElementById("monthPicker");
  if (!monthInput) return;

  const month = monthInput.value;
  if (!month) return;

  const [year, monthIndex] = month.split("-");
  const allWeekdays = getWeekdaysInMonth(
    parseInt(year),
    parseInt(monthIndex) - 1
  );

let students = [];

try {
  students = await DataLayer.getStudents();
  saveCachedStudents(students);

} catch {
  students = getCachedStudents();
}

  const attendance = await DataLayer.getAttendance();

    let summary = {};
    
    students.forEach(s => {
      console.log(s);

      summary[s.name] = {
        ontime: 0,
        late: 0,
        absent: 0
      };
    });

    let totalDays = 0;

    const excludeDates = [];

    attendance
      .filter(a => a.date.startsWith(month))
      .forEach(day => {

        if (day.type === "holiday") return;

        totalDays++;
        
        day.records.forEach(r => {
          const student = students.find(
            s => s.id === r.studentId
          );
          
          if (!student) return;
          
          summary[student.name][r.status]++;
        });
      });
	  
	  	  const recordedDates = attendance
  .filter(a => a.date.startsWith(month))
  .map(a => a.date);

const missingDays = allWeekdays.filter(d => !recordedDates.includes(d));

  if (totalDays === 0) {
  document.getElementById("summaryTable").innerHTML =
    "No records for this month.";
  document.getElementById("topStudent").innerHTML = "";
  document.getElementById("monthlyTotal").innerHTML = "";
  return;
}

let totalText = `🗓️ Total Recorded Days This Month: ${totalDays}`;

if (missingDays.length > 0) {

  totalText += `<br><span style="color:red;">
    Missing Days:
  </span><br>`;

  missingDays.forEach(day => {
    totalText += `
      <a href="attendance.html?date=${day}"
         style="color:red; text-decoration:underline;">
         ${day}
      </a><br>
    `;
  });
}
document.getElementById("monthlyTotal").innerHTML = totalText;
  const ranking = Object.entries(summary)
.map(([name, stats]) => {
  const present = stats.ontime + stats.late;

  const percentage = totalDays > 0
    ? Math.round((present / totalDays) * 100)
    : 0;

  return {
    name,
    ...stats,
    percentage
  };
})

.sort((a, b) => b.ontime - a.ontime);
	  
	  if (ranking.length === 0) return;

const highest = ranking[0].ontime;
const topStudents = ranking.filter(r => r.ontime === highest);

    // 🏆 Top Student
 const formattedMonth = new Date(month + "-01").toLocaleDateString("en-US", {
  month: "long",
  year: "numeric"
});

let highlightHTML = `
  <div class="highlight">
    <h3>🏆 Top Student of ${formattedMonth}</h3>
`;
    topStudents.forEach(t => {
      highlightHTML += `
        <p><strong>${t.name}</strong> – ${t.ontime} On-Time Days</p>
      `;
    });

    highlightHTML += `</div>`;

    document.getElementById("topStudent").innerHTML = highlightHTML;

    // Summary Table
    let html = `
      <table>
        <tr>
          <th>Rank</th>
          <th>Student</th>
          <th>On Time</th>
          <th>Late</th>
          <th>Absent</th>
          <th>Attendance%</th>
        </tr>
    `;

    ranking.forEach((r, index) => {
      html += `
        <tr>
          <td>${index + 1}</td>
          <td>${r.name}</td>
          <td>${r.ontime}</td>
          <td>${r.late}</td>
          <td>${r.absent}</td>
          <td>${r.percentage}%</td>
        </tr>
      `;
    });

    html += "</table>";

    document.getElementById("summaryTable").innerHTML = html;
	
	// ===== WEEKLY RENDER =====
const selectedDate =
  document.getElementById("datePicker")?.value ||
  new Date().toISOString().slice(0,10);

const weeklyData = await generateWeeklyReport(today);

let weeklyHTML = `
  <table>
    <tr>
      <th>Student</th>
      <th>On Time</th>
      <th>Late</th>
      <th>Absent</th>
    </tr>
`;

weeklyData.forEach(w => {
  weeklyHTML += `
    <tr>
      <td>${w.name}</td>
      <td>${w.ontime}</td>
      <td>${w.late}</td>
      <td>${w.absent}</td>
    </tr>
  `;
});

weeklyHTML += "</table>";

document.getElementById("weeklySummary").innerHTML = weeklyHTML;
  }

  
 window.renderDashboard = renderDashboard; 
