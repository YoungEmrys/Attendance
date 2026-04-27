console.log("Attendance script loaded");

let editCourses = [];

/* =========================
   DATE UTILITIES
========================= */

function todayString() {
  return new Date().toISOString().split("T")[0];
}

function isWeekend(dateStr) {
  const d = new Date(dateStr);
  return d.getDay() === 0 || d.getDay() === 6;
}

async function checkSession() {
  const res = await fetch("/api/session", {
    credentials: "include"
  });

  if (!res.ok) {
    window.location.href = "index.html";
    return false;
  }

  return true;
}
/* =========================
   GLOBAL STATE
========================= */

let studentCourses = [];

/* =========================
   INIT (SAFE FOR ALL PAGES)
========================= */


 
window.addEventListener("DOMContentLoaded", async () => {
  try {
    console.log("INIT RUNNING"); 
	  await migrateStudents();
	  console.log("Migrated students:", await getStudents());
	  
	  await loadStudents();

    const students = await getStudents();
    console.log("Students:", students);
	  
	  initStudentForm();
    loadStudents();  
    loadStudentDetails();
	  
	   const datePicker = document.getElementById("datePicker");
  if (datePicker) {
    datePicker.value = todayString();
    loadSelectedDate();
  }
	  
	console.log("INIT DONE");

  } catch (err) {
    console.error("INIT ERROR:", err);
  }
  
 
let currentSearch = "";

const searchInput = document.getElementById("searchStudent");

if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    currentSearch = e.target.value;
    loadStudents(currentSearch);
  });
}

document.getElementById("courseFilter")?.addEventListener("change", () => {
  loadStudents(currentSearch);
});

document.getElementById("sortOption")?.addEventListener("change", () => {
  loadStudents(currentSearch);
});
  
  
});

// migrate student (upgrade)

async function migrateStudents() {
  const students = await getStudents();

  let changed = false;

  const updated = students.map((s, index) => {
    if (!s.id) {
      s.id = "STD" + Date.now() + index;
      changed = true;
    }

    if (!Array.isArray(s.courses)) {
      s.courses = [];
      changed = true;
    }

    if (!s.image) {
      s.image = "";
      changed = true;
    }

    return s;
  });

  if (!changed) {
    console.log("No migration needed");
    return;
  }

  console.log("Saving FULL migrated dataset...");

  const res = await fetch("/api/students", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      students: updated,
      mode: "bulk"  
    })
  });

  const data = await res.json();

  if (!res.ok) {
    console.error(data);
    alert("Migration failed");
    return;
  }

  console.log("Migration SUCCESS");
}


/* =========================
   STUDENT FORM LOGIC
========================= */

function initStudentForm() {
  const studentNameInput = document.getElementById("studentName");
  const studentIdInput = document.getElementById("studentId");
  const courseInput = document.getElementById("studentCourseInput");
  const addCourseBtn = document.getElementById("addCourseBtn");
  const courseTags = document.getElementById("courseTags");
  const imageInput = document.getElementById("studentImage");
  const imagePreview = document.getElementById("imagePreview");
  const addStudentBtn = document.getElementById("addStudentBtn");

  if (!addStudentBtn) return; // Not on this page

  /* Image Preview */
  if (imageInput) {
    imageInput.addEventListener("change", () => {
      if (imageInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = () => (imagePreview.src = reader.result);
        reader.readAsDataURL(imageInput.files[0]);
      }
    });
  }

  /* Add Course */
  if (addCourseBtn) {
    addCourseBtn.addEventListener("click", () => {
      const course = courseInput.value.trim();
      if (!course || studentCourses.includes(course)) return;

      studentCourses.push(course);

      const tag = document.createElement("span");
      tag.className = "course-tag";
      tag.textContent = course;

      tag.onclick = () => {
        studentCourses = studentCourses.filter(c => c !== course);
        tag.remove();
      };

      courseTags.appendChild(tag);
      courseInput.value = "";
    });
  }

  /* Add Student */
  addStudentBtn.addEventListener("click", async () => {
   
	  const name = studentNameInput.value.trim();
	  
const rawId = studentIdInput.value;
const id = rawId.trim();

// block spaces inside ID
if (/\s/.test(id)) {
  return alert("Student ID cannot contain spaces");
}

// allow only letters + numbers
if (!/^[a-zA-Z0-9]+$/.test(id)) {
  return alert("Student ID must contain only letters and numbers (no symbols)");
}

// optional: enforce length
if (id.length < 2) {
  return alert("Student ID is too short");
}

    if (!name || !id) return alert("Enter name and ID");
    if (studentCourses.length === 0) return alert("Add at least one course");

    let imageBase64 = "";

if (imageInput && imageInput.files && imageInput.files.length > 0) {
  const file = imageInput.files[0];
	
const MAX_SIZE = 1.5 * 1024 * 1024; // 1.5MB

if (file.size > MAX_SIZE) {
  return alert("Image must be under 1.5MB");
}
  imageBase64 = await compressImage(file);
	
}
	  
	  
    const studentData = {
      name,
      id,
      courses: [...studentCourses],
      image: imageBase64,
      status: "active"
    };

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(studentData)
      });

const data = await res.json();

if (!res.ok) {
  return alert(data.message || "Failed to save student");
}


      alert("Student added!");

      studentNameInput.value = "";
      studentIdInput.value = "";
      courseInput.value = "";
      studentCourses = [];
      courseTags.innerHTML = "";
      imageInput.value = "";
      imagePreview.src = "";

      renderStudentCards();
      loadStudents();

    } catch (err) {
      console.error(err);
      alert("Error adding student");
    }
  });
}

async function deleteStudent(id) {
  if (!confirm("Delete this student?")) return;

  try {
    const res = await fetch(`/api/students/${id}`, {
      method: "DELETE",
      credentials: "include"
    });

const text = await res.text();

let data;
try {
  data = JSON.parse(text);
} catch {
  console.error("Server returned HTML:", text);
  alert("Server error (check backend)");
  return;
}

    if (!res.ok) {
      return alert(data.message || "Delete failed");
    }

    alert("Student deleted");
    loadStudents();

  } catch (err) {
    console.error(err);
    alert("Error deleting student");
  }
}

/* =========================
   UTIL
========================= */

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = e => {
      img.src = e.target.result;
    };

    img.onload = () => {
      const canvas = document.createElement("canvas");

      const MAX_WIDTH = 300;
      const scale = MAX_WIDTH / img.width;

      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // compress quality (0.7 = good balance)
      const compressed = canvas.toDataURL("image/jpeg", 0.7);

      resolve(compressed);
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


searchInput.addEventListener("input", (e) => {
  currentSearch = e.target.value;
  loadStudents(currentSearch);
});

document.getElementById("courseFilter")?.addEventListener("change", () => {
  loadStudents(currentSearch);
});

document.getElementById("sortOption")?.addEventListener("change", () => {
  loadStudents(currentSearch);
});

studentIdInput.addEventListener("input", () => {
  // remove spaces automatically
  studentIdInput.value = studentIdInput.value.replace(/\s/g, "");
});


/* =========================
   STUDENT CARDS
========================= */

async function renderStudentCards() {
  const container = 
		document.getElementById("studentCards");
	
  if (!container) return;

  const students = await getStudents();

  container.innerHTML = students.map((s, i) => `
    <div class="student-card" 
data-id="${s.id}"
onclick="handleStudentClick(this)" style="flex-direction:column; align-items:flex-start; cursor:pointer;">
      <strong>${s.name}</strong><br>
      ID: ${s.id || "N/A"}
  ${!s.courses.length ? "<small style='color:red'>No courses</small>" : ""}
    </div>

  `).join("");
}

function handleStudentClick(el) {
  const id = el.getAttribute("data-id");
  openStudentDetails(id);
}


/* =========================
   STUDENT RECORD VIEW
========================= */

async function viewAllStudentRecords() {
  const container = document.getElementById("studentRecord");
  if (!container) return;

  const students = await getStudents();
  const attendance = await getAttendance();

  let html = "";

  students.forEach(student => {
    let recordsHTML = "";

    attendance.forEach(a => {
      if (a.name === student.name) {
        recordsHTML += `${a.date} - ${a.status}<br>`;
      }
    });

    const imageBlock = student.image
      ? `<img src="${student.image}" 
              style="width:80px; height:100px; object-fit:cover; border-radius:12px;margin-right:10px;">`

      : `<div style="width:80px; height:100px; object-fit:cover; border radius:12px;background:#ccc; display:flex;align-items:center;justify-content:center;margin-right:10px;">
		  
          ${getInitials(student.name)}
        </div>`;

    html += `
    <div class="student-card" 
     onclick="openStudentDetails('${s.id}')" 
     style="flex-direction:column; align-items:flex-start; cursor:pointer;">
        
        <div style="display:flex; align-items:center; margin-bottom:8px;">
          ${imageBlock}
          <strong>${s.name}</strong>
        </div>

        <div style="font-size:14px;">
          ${recordsHTML || "No records found"}
        </div>

      </div>
    `;
  });

  container.innerHTML = html;
}



function markUnmarkedAsAbsent() {
  const students = document.querySelectorAll("#attendanceTable tr td:first-child");

  students.forEach(td => {
    const name = td.textContent.trim();
    const radios = document.querySelectorAll(`input[name="${name}"]`);
    const selected = document.querySelector(`input[name="${name}"]:checked`);
    
    if (!selected) {
      // mark the "Absent" radio
      const absentRadio = Array.from(radios).find(r => r.value === "absent");
      if (absentRadio) absentRadio.checked = true;
    }
  });

  alert("All unmarked students have been marked as Absent");
}

const markBtn = document.getElementById("markAbsentBtn");
if (markBtn) {
  markBtn.addEventListener("click", markUnmarkedAsAbsent);
}


async function clearMonthAttendance() {
  const datePicker = document.getElementById("datePicker");
  if (!datePicker || !datePicker.value) {
    alert("Select a date first");
    return;
  }

  // Get the selected month in YYYY-MM format
  const selectedMonth = datePicker.value.slice(0, 7); // "2026-04" for example

  // Confirm action
  if (!confirm(`Are you sure you want to delete ALL attendance for ${selectedMonth}? This cannot be undone.`)) {
    return;
  }

  // Fetch existing attendance
  let attendance = await getAttendance();

  // Filter out records NOT in the selected month
  attendance = attendance.filter(a => !a.date.startsWith(selectedMonth));

  // Save updated attendance
  await saveAttendance(attendance);

  alert(`All attendance for ${selectedMonth} has been cleared`);

  // Re-render table
  await renderAttendanceTable(datePicker.value);
}

const clearBtn = document.getElementById("clearMonthBtn");
if (clearBtn) {
  clearBtn.addEventListener("click", clearMonthAttendance);
}


async function fullResetAttendance() {
  if (!confirm("Are you sure you want to delete ALL attendance records? This cannot be undone.")) {
    return;
  }

  // Fetch current attendance
  let attendance = await getAttendance();

  // Clear all records
  attendance = [];

  // Save empty attendance
  await saveAttendance(attendance);

  alert("All attendance records have been cleared.");

  // Re-render table
  const datePicker = document.getElementById("datePicker");
  if (datePicker) {
    await renderAttendanceTable(datePicker.value || todayString());
  }
}

const fullResetBtn = document.getElementById("fullResetBtn");
if (fullResetBtn) {
  fullResetBtn.addEventListener("click", fullResetAttendance);
}

async function loadStudents(search = "") {
  const container =
    document.getElementById("studentCards") ||
    document.getElementById("studentList");

  if (!container) return;

  let students = await getStudents();
  const attendance = await getAttendance();

  const courseFilter = document.getElementById("courseFilter")?.value;
  const sortOption = document.getElementById("sortOption")?.value;

  // 🔍 SEARCH
  students = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  // 🎓 FILTER BY COURSE
  if (courseFilter) {
    students = students.filter(s =>
      s.courses?.includes(courseFilter)
    );
  }

  // 🏆 PERFORMANCE SCORE
  const scores = {};
  attendance.forEach(a => {
    if (!scores[a.name]) scores[a.name] = 0;
    if (a.status === "ontime") scores[a.name] += 2;
    if (a.status === "late") scores[a.name] += 1;
  });

  // 🔃 SORT

  const sort = sortOption || "az";

  if (sortOption === "az") {
    students.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (sortOption === "za") {
    students.sort((a, b) => b.name.localeCompare(a.name));
  }

  if (sortOption === "top") {
    students.sort((a, b) =>
      (scores[b.name] || 0) - (scores[a.name] || 0)
    );
  }

  container.innerHTML = students.map((s) => `
<div class="student-card" 
     onclick="openStudentDetails('${s.id}')"
     style="cursor:pointer;">

  <div style="display:flex; align-items:center; gap:10px;">
    
    ${
      s.image
        ? `<img src="${s.image}" style="width:60px; height:80px; object-fit:cover; border-radius:10px;">`
        : `<div style="width:60px; height:80px; object-fit:cover; border-radius:10px;background:#ccc;
            display:flex;align-items:center;justify-content:center;">
            ${getInitials(s.name)}
          </div>`
    }

    <div>
      <strong>${s.name}</strong><br>
     <strong>ID: ${s.id || "N/A"}</strong><br>
    <strong><small>${(s.courses || []).join(", ")}</small></strong>
    </div>

  </div>

  
  <div style="display:flex;">
    <button onclick="event.stopPropagation(); goToEdit('${s.id}')">✏️ Edit </button> 

    <button onclick="event.stopPropagation(); deleteStudent('${s.id}')">
      🗑️ Delete
    </button>
  </div>

</div>
  `).join("") || "<p>No students found</p>";
}


const studentContainer = document.getElementById("studentCards");
if (studentContainer) {
  loadStudents();
}

async function goToEdit(id) {
  const students = await getStudents();
  const student = students.find(s => s.id === id);

  if (!student){
    alert("Student not found");
    return;
  
  }

  localStorage.setItem("editStudent", JSON.stringify(student));
  window.location.href = "edit-student.html";
}


async function loadEditStudent() {
  const stored = JSON.parse(localStorage.getItem("editStudent"));
  if (!stored) return;

  const students = await getStudents();
  const student = students.find(s => s.id === stored.id);

  if (!student) {
    alert("Student not found");
    return;
  }

  document.getElementById("editName").value = student.name || "";
  document.getElementById("editId").value = student.id || "";

  editCourses = [...(student.courses || [])];

  renderEditCourses();

  // ✅ Bind button AFTER page loads
  const btn = document.getElementById("addCourseBtnEdit");
  if (btn) {
    btn.addEventListener("click", addEditCourse);
  }

  // Optional: press ENTER to add
  const input = document.getElementById("editCourseInput");
  if (input) {
    input.addEventListener("keypress", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        addEditCourse();
      }
    });
  }

const imageInput = document.getElementById("editImage");
const preview = document.getElementById("editImagePreview");

// show existing image
if (preview) {
  preview.src = student.image || "";
}

// live preview when user selects new image
if (imageInput) {
  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      preview.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
}

function addEditCourse() {
  const input = document.getElementById("editCourseInput");
  if (!input) return;

  const value = input.value.trim();

  if (!value) return;

  if (editCourses.includes(value)) {
    alert("Course already added");
    return;
  }

  editCourses.push(value);
  input.value = "";

  renderEditCourses();
}

function renderEditCourses() {
  const container = document.getElementById("editCourses");
  if (!container) return;

  container.innerHTML = editCourses.map(c => `
    <span style="
      display:inline-block;
      margin:5px;
      padding:5px 10px;
      background:#667eea;
      color:white;
      border-radius:6px;
      cursor:pointer;
    " onclick="removeEditCourse('${c}')">
      ${c} ❌
    </span>
  `).join("");
}

function removeEditCourse(course) {
  editCourses = editCourses.filter(c => c !== course);
  renderEditCourses();
}


async function saveEdit() {
  try {
    const student = JSON.parse(localStorage.getItem("editStudent"));
    if (!student) return alert("No student loaded");

    const name = document.getElementById("editName").value.trim();
const newId = document.getElementById("editId").value.trim();

if (/\s/.test(newId)) {
  return alert("Student ID cannot contain spaces");
}

if (!/^[a-zA-Z0-9]+$/.test(newId)) {
  return alert("Student ID must contain only letters and numbers");
}

    if (!name || !newId) {
      return alert("Name and ID required");
    }

    const imageInput = document.getElementById("editImage");

    let image = student.image;

if (imageInput && imageInput.files.length > 0) {
  const file = imageInput.files[0];

  const MAX_SIZE = 1.5 * 1024 * 1024;

  if (file.size > MAX_SIZE) {
    return alert("Image must be under 1.5MB");
  }

  image = await compressImage(file);
}


    console.log("SENDING DATA:", {
      name,
      newId,
      courses: editCourses
    });

    const res = await fetch(`/api/students/${student.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name,
        newId,
        courses: editCourses,
        image
      })
    });

    const text = await res.text();
    console.log("SERVER RAW RESPONSE:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      alert("Server returned invalid JSON");
      return;
    }

    if (!res.ok) {
      alert(data.message || "Update failed");
      return;
    }

    alert("Student updated successfully");
    window.location.href = "students.html";

  } catch (err) {
    console.error("SAVE ERROR:", err);
    alert("Error saving student (check console)");
  }
}

async function editStudent(id) {
  const students = await getStudents();
  const student = students.find(s => s.id === id);

  if (!student) return;

  const newName = prompt("Edit name:", student.name);
  if (!newName) return;

  const newId = prompt("Edit ID:", student.id);
  if (!newId) return;

  const newCourses = prompt(
    "Edit courses (comma separated):",
    (student.courses || []).join(",")
  );

  const coursesArray = newCourses
    ? newCourses.split(",").map(c => c.trim())
    : [];

  try {
    const res = await fetch(`/api/students/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: newName,
        newId: newId,
        courses: coursesArray,
        image: student.image
      })
    });

    const data = await res.json();

    if (!res.ok) {
      return alert(data.message || "Update failed");
    }

    alert("Student updated");

    loadStudents();

  } catch (err) {
    console.error(err);
const text = await res.text();
console.log("Server response:", text);

let data;
try {
  data = JSON.parse(text);
} catch {
  return alert("Invalid server response");
}

if (!res.ok) {
  return alert(data.message || "Update failed");
}  }
}


function getInitials(name) {
  if (!name) return "??";

  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase();
}

function loadStudentDetails() {

  const container = document.getElementById("studentProfile");

  //  STOP if not on student-details page
  if (!container) return;

  const student = JSON.parse(localStorage.getItem("selectedStudent"));

  if (!student) {
    container.innerHTML = "<h2>No student selected</h2>";
    return;
  }

  let imageBlock = "";

  if (student.image && student.image.trim() !== "") {
    imageBlock = `<img src="${student.image || 'default.png'}" class="profile-img">`;
  } else {
    imageBlock = `
      <div class="profile-initials">
        ${getInitials(student.name)}
      </div>
    `;
  }
  container.innerHTML = `
    <div class="profile-card">

      ${imageBlock}

      <h2>${student.name}</h2>

      <p><strong>ID:</strong> ${student.id || "N/A"}</p>

      <p><strong>Status:</strong> ${student.status || "active"}</p>

      <div class="course-section">
        <h3>Courses</h3>
        ${
          student.courses && student.courses.length
            ? student.courses.map(c => `<span class="course-tag">${c}</span>`).join("")
            : "No courses"
        }
      </div>

    </div>
  `;
}


async function openStudentDetails(id) {
  const students = await getStudents();

  const cleanId = String(id).trim();

  console.log("CLICKED ID:", `"${cleanId}"`);
  console.log("ALL IDS:", students.map(s => `"${String(s.id).trim()}"`));

  const student = students.find(
    s => String(s.id).trim() === cleanId
  );

  if (!student) {
    alert("Student not found");
    return;
  }

  localStorage.setItem("selectedStudent", JSON.stringify(student));
  window.location.href = "student-details.html";
}
