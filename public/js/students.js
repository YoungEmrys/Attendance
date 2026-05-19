// GLOBAL ACTIONS

console.log("students.js Loaded");

// STUDENTS DETAILS
window.openStudentDetails = async function(id) {
  const students = await API.getStudents();
  const student = students.find(s => String(s.id) === String(id));

  if (!student) {
    alert("Student not found");
    return;
  }

window.location.href = `student-details.html?id=${id}`;
};


// EDIT STUDENTS
window.editStudent = async function(id) {
const students = await API.getStudents();

  const student = students.find(s => String(s.id) === String(id));

  if (!student) {
    alert("Student not found");
    return;
  }

window.location.href = `edit-student.html?id=${id}`;
};

window.deleteStudent = async function(id) {
  if (!confirm("Delete this student?")) return;

  try {
    await API.deleteStudent(id);
    alert("Deleted successfully");
    loadStudents();

  } catch (err) {
    console.error(err);
    alert("Delete failed");
  }
};

window.toggleStudentStatus = async function(id, currentState) {
  try {

const students = await API.getStudents();

    const student = students.find(s => String(s.id) === String(id));

    if (!student) return alert("Student not found");

    await API.updateStudent(id, {
      ...student,
      active: !currentState
    });

    loadStudents();

  } catch (err) {
    console.error(err);
    alert("Failed to update status");
  }
};

window.toggleMenu = function(){
  const nav = document.getElementById("navbar");
  nav.classList.toggle("show");
	
	if(document.getElementById("userProfile")){
  window.addEventListener("DOMContentLoaded", loadUserProfile);
}
}

/* =========================
   LOAD STUDENTS
========================= */

async function loadStudents(search = "") {
  const container = document.getElementById("studentCards");
  if (!container) return;

  try {
const students = await API.getStudents();

    let filtered = students;
    filtered = getVisibleStudents(filtered);

    if (search && search.trim() !== "") {
      const q = search.toLowerCase();
      filtered = students.filter(s =>
        (s.name || "").toLowerCase().includes(q)
      );
    }

    if (filtered.length === 0) {
      container.innerHTML = "<p>No students found</p>";
      return;
    }

    container.innerHTML = filtered.map(s => `
      <div class="student-card ${s.active === false ? 'inactive-card' : ''}" onclick="openStudentDetails('${s.id}')">

        <div class="student-header">
          <div class="student-img">
            ${
              s.image
                ? `<img src="${s.image}" class="student-img">`
                : getInitials(s.name)
            }
          </div>

          <div>
            <strong>${s.name}</strong><br>
            <small>ID: ${s.id}</small><br>
            <small>${(s.courses || []).join(", ")}</small>
          </div>
        </div>

        <div class="student-actions">

  <button class="edit-btn" onclick="event.stopPropagation(); editStudent('${s.id}')">
    Edit
  </button>

  <button class="delete-btn"
    onclick="event.stopPropagation(); deleteStudent('${s.id}')"> Delete
  </button>

  <button class="status-btn ${s.active === false ? 'inactive' : 'active'}"
    onclick="event.stopPropagation(); toggleStudentStatus('${s.id}', ${s.active !== false})">
    ${s.active === false ? 'Reactivate' : 'Deactivate'}
  </button>

</div>
    </div>
    `).join("");

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p style='color:red'>Failed to load students</p>";
  }
}

/* =========================
   ADD STUDENT
========================= */

async function addStudent() {
  try {
    const name = document.getElementById("studentName").value.trim();
    const id = document.getElementById("studentId").value.trim();

    if (!name || !id) {
      alert("Student name and ID are required");
      return;
    }

    if (!/^\d+$/.test(id)) {
  alert("Student ID must contain numbers only");
  return;
}

const students = await API.getStudents();

if (students.some(s => normalizeId(s.id) === normalizeId(id))) {
  alert("Student ID already exists");
  return;
}

    const courseTags = document.querySelectorAll("#courseTags span");
    const courses = Array.from(courseTags).map(tag => tag.textContent);

    
    let image = "";

    const MAX_IMAGE_SIZE_MB = 1;

    const imageInput = document.getElementById("studentImage");

    if (imageInput && imageInput.files.length > 0) {
      const file = imageInput.files[0];

      const sizeMB = file.size / (1024 * 1024);

      if (sizeMB > MAX_IMAGE_SIZE_MB) {
    alert(`Image too large. Max allowed is ${MAX_IMAGE_SIZE_MB}MB`);
    return;
  }
      const reader = new FileReader();

      image = await new Promise(resolve => {
        reader.onload = e => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    }

    await API.addStudent({ name, id, courses, image, active: true });

    alert("Student Added Successfully");

    // clear form
    document.getElementById("studentName").value = "";
    document.getElementById("studentId").value = "";
    document.getElementById("courseTags").innerHTML = "";
    document.getElementById("studentImage").value = "";
    document.getElementById("imagePreview").src = "";
loadStudents();

  } catch (err) {
    console.error(err);
    alert("Failed to add student");
  }
}

window.loadStudents = loadStudents;
window.addStudent = addStudent;