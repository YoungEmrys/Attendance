console.log("Attendance script loaded");

/* =========================
   DATE UTILITIES
========================= */

function todayString(){
  return new Date().toISOString().split("T")[0];
}

function isWeekend(dateStr){
  const d = new Date(dateStr);
  return d.getDay() === 0 || d.getDay() === 6;
}

/* =========================
   STUDENT MANAGEMENT
========================= */

async function addStudent(){

  const input = document.getElementById("studentName");
  const name = input.value.trim();

  if(!name){
    alert("Enter student name");
    return;
  }

  const res = await fetch("/api/students",{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    credentials:"include",
    body:JSON.stringify({
      name:name,
      status:"active"
    })
  });

  if(!res.ok){
    alert("Student already exists");
    return;
  }

  input.value = "";
  input.focus();

  const date = document.getElementById("datePicker").value;

  await renderAttendanceTable(date);
  await populateRecordDropdown();

}

/* =========================
   DELETE / INACTIVE STUDENT
========================= */

async function deleteStudent(name){

  if(!confirm("Delete this student permanently?")) return;

  try{

    const res = await fetch(`/api/students/${encodeURIComponent(name)}`,{
      method:"DELETE",
      credentials:"include"
    });

    const text = await res.text();

    console.log("Server response:", res.status, text);

    if(!res.ok){
      alert("Delete failed. Check console.");
      return;
    }

    alert("Student deleted");

    location.reload();

  }catch(err){
    console.error(err);
    alert("Delete request failed");
  }

}

/*=========================
   ATTENDANCE TABLE
========================= */

async function renderAttendanceTable(date) {
  const students = await getStudents();
  const attendance = await getAttendance();

  // If no students are present
if (!students || students.filter(s => s.status === "active").length === 0) {    document.getElementById("attendanceTable").innerHTML =
      "<p>No students yet. Add students to start attendance.</p>";
    return;
  }

  const record = attendance.find(a => a.date === date);

  let html = `
  <table>
  <tr>
  <th>Student</th>
  <th>On Time</th>
  <th>Late</th>
  <th>Absent</th>
  <th>Delete</th>
  </tr>
  `;

  students
    .filter(s => s.status === "active")
    .forEach(student => {
      let status = "";

      if (record) {
        const found = record.records.find(r => r.student === student.name);
        if (found) status = found.status;
      }

      html += `
    <tr>
      <td>${student.name}</td>
      <td><input type="radio" name="${student.name}" value="ontime" ${status === "ontime" ? "checked" : ""}></td>
      <td><input type="radio" name="${student.name}" value="late" ${status === "late" ? "checked" : ""}></td>
      <td><input type="radio" name="${student.name}" value="absent" ${status === "absent" ? "checked" : ""}></td>
      <td><button class="delete-btn" onclick="deleteStudent('${student.name}')">X</button></td>
    </tr>
  `;
    });

  html += "</table>";

  document.getElementById("attendanceTable").innerHTML = html;
}

/* =========================
   LOAD DATE
========================= */

async function loadSelectedDate(){

  const date =
  document.getElementById("datePicker").value;

  const lockStatus =
  document.getElementById("lockStatus");

  if(!date) return;

  if(date > todayString()){
    alert("Future dates not allowed");
    return;
  }

  if(isWeekend(date)){
    alert("Weekend selected");
    return;
  }

  lockStatus.innerHTML="(Editable)";
  lockStatus.className="";

  await renderAttendanceTable(date);

}

/* =========================
   SAVE ATTENDANCE
========================= */

async function submitAttendance(){

  const date =
  document.getElementById("datePicker").value;

  if(!date){
    alert("Select a date first");
    return;
  }

  const students =
  (await getStudents())
  .filter(s=>s.status==="active");

  let records = [];

  for(let student of students){

    const selected =
    document.querySelector(
      `input[name="${student.name}"]:checked`
    );

    if(!selected){
      alert("Please mark all students");
      return;
    }

    records.push({
      student:student.name,
      status:selected.value
    });

  }

  let attendance = await getAttendance();

  let record =
  attendance.find(a=>a.date===date);

  if(record){

    record.records = records;

  }else{

    attendance.push({
      date:date,
      records:records
    });

  }

  await saveAttendance(attendance);

  alert("Attendance saved");

  await loadSelectedDate();

}

/* =========================
   STUDENT RECORD VIEW
========================= */

async function viewStudentRecord(){

  const selected =
  document.getElementById("recordStudent").value;

  const attendance =
  await getAttendance();

  const box =
  document.getElementById("studentRecord");

  if(!selected){
    box.innerHTML="";
    return;
  }

  let output="";

  attendance.forEach(day=>{

    const found =
    day.records.find(
      r=>r.student===selected
    );

    if(found){

      output +=
      `${day.date} - ${found.status}<br>`;

    }

  });

  if(!output){
    output="No records found";
  }

  box.innerHTML=output;

}

/* =========================
   DROPDOWN POPULATION
========================= */

async function populateRecordDropdown(){

  const students = await getStudents();

  const select =
  document.getElementById("recordStudent");

  if(!select) return;

  select.innerHTML =
  "<option value=''>Select Student</option>";

  select.innerHTML +=
  "<option value='all'>All Students</option>";

  students.forEach(s=>{

    const label =
    s.status==="inactive"
    ? `${s.name} (Inactive)`
    : s.name;

    select.innerHTML +=
    `<option value="${s.name}">${label}</option>`;

  });

}

/* =========================
   INITIAL LOAD
========================= */

window.addEventListener("DOMContentLoaded", async () => {

// Run only if datePicker exists (attendance page)

const datePicker = document.getElementById("datePicker");

if(datePicker){

  datePicker.value = todayString();

 
  loadSelectedDate();

}
})

async function loadStudents(){

  const students = await getStudents();

  let html = "";

  students.forEach(s => {

    html += ` 

    <div class="student-card">

      <span>${s.name}</span>

      <button class="delete-btn"
      onclick="deleteStudent('${s.name}')">
      Delete
      </button>

    </div>
    `;

  });

  document.getElementById("studentList").innerHTML = html;

}

loadStudents();
