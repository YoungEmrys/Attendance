// GLOBAL ACTIONS

console.log("students.js Loaded");

// STUDENTS DETAILS
window.openStudentDetails = async function(id) {
  const students = await API.getStudents();
  const student = students.find(s => String(s.id) === String(id));

  if (!student) {
    alert("Student Not Found");
    return;
  }

window.location.href = `student-details.html?id=${id}`;
};


// EDIT STUDENT
window.editStudent = async function(id) {
const students = await API.getStudents();

  const student = students.find(s => String(s.id) === String(id));

  if (!student) {
    showToast("Student not found");
    return;
  }

window.location.href = `edit-student.html?id=${id}`;
};


//DELETE STUDENT
window.deleteStudent = async function(id) {
  
  const confirmed = await showConfirm("Delete this student?");

if (!confirmed) return;

  try {
    await API.deleteStudent(id);
    showToast("Student Deleted Successfully");
    loadStudents();

  } catch (err) {
    console.error(err);
    showToast("Delete Failed");
  }
};

window.toggleStudentStatus = async function(id, currentState) {
  try {

const students = await API.getStudents();

    const student = students.find(s => String(s.id) === String(id));

    if (!student) return alert("Student Not Found");

    await API.updateStudent(id, {
      ...student,
      active: !currentState
    });

    loadStudents();

  } catch (err) {
    console.error(err);
    showToast("Failed to update status");
  }
};

window.toggleMenu = function(){
  const nav = document.getElementById("navbar");
  nav.classList.toggle("show");
	
	if(document.getElementById("userProfile")){
  window.addEventListener("DOMContentLoaded", loadUserProfile);
}
}

// LOAD STUDENT
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

// AD STUDENT
async function addStudent() {
  try {
    const name = document.getElementById("studentName").value.trim();
    const id = document.getElementById("studentId").value.trim();

    if (!name || !id) {
      alert("Student Name and ID  Required");
      return;
    }

    if (!/^\d+$/.test(id)) {
  alert("Student ID Must Contain Numbers Only");
  return;
}

const students = await API.getStudents();

if (students.some(s => normalizeId(s.id) === normalizeId(id))) {
  alert("Student ID Already Exists");
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
    alert(`Image Too large. Max Allowed is ${MAX_IMAGE_SIZE_MB}MB`);
    return;
  }
      const reader = new FileReader();

      image = await new Promise(resolve => {
        reader.onload = e => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    }

    await API.addStudent({ name, id, courses, image, active: true });

    showToast("Student Added Successfully");

    // clear form
    document.getElementById("studentName").value = "";
    document.getElementById("studentId").value = "";
    document.getElementById("courseTags").innerHTML = "";
    document.getElementById("studentImage").value = "";
    document.getElementById("imagePreview").src = "";
loadStudents();

  } catch (err) {
    console.error(err);
    alert("Failed To Add Student");
  }
}

window.loadStudents = loadStudents;
window.addStudent = addStudent;