console.log("attendance-render.js Loaded")

// FORMAT TIME
function formatTime(t) {
  const settings = getSettings();

  if (!t || t === "--:--") return "--:--";

  if (settings.timeFormat === "24h") {
    return t;
  }

  const [h, m] = t.split(":");
  let hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";

  if (hour > 12) hour -= 12;
  if (hour === 0) hour = 12;

  return `${hour}:${m} ${ampm}`;
}


//  SET STATUS
function setStatus(id, status, btn) {
  id = normalizeId(id);

  if (!attendanceData[id]) {
    attendanceData[id] = { time: null };
  }

  attendanceData[id].status = status;

  const parent = btn.parentElement;

  parent.querySelectorAll("button").forEach(b => {
    b.classList.remove("active-status");
  });

  btn.classList.add("active-status");

  // update color on time display
  const card = btn.closest(".card");
  const timeDiv = card.querySelector(".time-display");

  timeDiv.className = "time-display " + status;
}


// SAVE ATTENDANCE
async function renderAttendanceTable(students) {
  const container = document.getElementById("attendanceTable");
  if (!container) return;

  container.innerHTML = "";
students = getActiveStudents(students);

  students.forEach(s => {
    const record = attendanceData[normalizeId(s.id)] || {};    
    const status = record.status || "";
    const time = record.time || "--:--";

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h3>${s.name}</h3>

      <div class="time-display ${status}">
        ${formatTime(time)}
      </div>

      <div class="status-buttons">

        <button class="btn-ontime ${status === "ontime" ? "active-status" : ""}"
          onclick="setStatus('${s.id}','ontime',this)">
          On Time
        </button>

        <button class="btn-late ${status === "late" ? "active-status" : ""}"
          onclick="setStatus('${s.id}','late',this)">
          Late
        </button>

        <button class="btn-absent ${status === "absent" ? "active-status" : ""}"
          onclick="setStatus('${s.id}','absent',this)">
          Absent
        </button>

      </div>
    `;

    container.appendChild(card);
  });
}

window.formatTime = formatTime;
