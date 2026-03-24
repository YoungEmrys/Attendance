
function formatFullDate(dateString) {

  const date = new Date(dateString);

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

  function goBack() {
    window.location.href = "attendance.html";
  }

async function renderDashboard() {

	const monthInput = document.getElementById("monthPicker");
  if (!monthInput) return;

  const month = monthInput.value;
  if (!month) return;

  const [year, monthIndex] = month.split("-");
  const allWeekdays = getWeekdaysInMonth(
    parseInt(year),
    parseInt(monthIndex) - 1
  );


    const attendance = await getAttendance();
    const students = await getStudents();

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

    attendance
      .filter(a => a.date.startsWith(month))
      .forEach(day => {
        totalDays++;
        day.records.forEach(r => {
          if (summary[r.student]) {
            summary[r.student][r.status]++;
          }
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
  .map(([name, stats]) => ({
    name,
    ...stats
  }))
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
        </tr>
      `;
    });

    html += "</table>";

    document.getElementById("summaryTable").innerHTML = html;
  }

	
	function getWeekdaysInMonth(year, month) {

  let weekdays = [];

  let date = new Date(year, month, 1);

  while (date.getMonth() === month) {

    const day = date.getDay();

    if (day !== 0 && day !== 6) {
      weekdays.push(date.toISOString().split("T")[0]);
    }

    date.setDate(date.getDate() + 1);
  }

  return weekdays;
}


document.addEventListener("DOMContentLoaded", function () {

const now = new Date();

const currentMonth =
  now.getFullYear() + "-" +
  String(now.getMonth()+1).padStart(2,"0");

const monthInput = document.getElementById("monthPicker");

if(monthInput){
monthInput.value = currentMonth;
renderDashboard();
}

})
