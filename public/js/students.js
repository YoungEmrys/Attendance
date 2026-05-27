// GLOBAL ACTIONS

console.log("students.js Loaded");

// STUDENTS DETAILS
window.openStudentDetails = async function(id) {
let students = [];

try {
  students = await API.getStudents();
  saveCachedStudents(students);

} catch {
  students = getCachedStudents();
}
  const student = students.find(s => String(s.id) === String(id));

  if (!student) {
    showToast("Student Not Found", "info");
    return;
  }

window.location.href = `student-details.html?id=${id}`;
};


// EDIT STUDENT
window.editStudent = async function(id) {
let students = [];

try {
  students = await API.getStudents();
  saveCachedStudents(students);

} catch {
  students = getCachedStudents();
}
  const student = students.find(s => String(s.id) === String(id));

  if (!student) {
    showToast("Student Not Found", "info" );
    return;
  }

window.location.href = `edit-student.html?id=${id}`;
};


//DELETE STUDENT
window.deleteStudent = async function(id) {
  
  const confirmed = await showConfirm("Delete Student?");

if (!confirmed) return;

  try {
    await API.deleteStudent(id);
    showToast("Student Deleted Successfully", "success");
    loadStudents();

  } catch (err) {
    console.error(err);
    showToast("Delete Failed", "error");
  }
};

window.toggleStudentStatus = async function(id, currentState) {
  try {

let students = [];

try {
  students = await API.getStudents();
  saveCachedStudents(students);

} catch {
  students = getCachedStudents();
}
    const student = students.find(s => String(s.id) === String(id));

    if (!student) return showToast("Student Not Found", "info");

    await API.updateStudent(id, {
      ...student,
      active: !currentState
    });

    loadStudents();

  } catch (err) {
    console.error(err);
    showToast("Failed to update status", "error");
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
let students = [];

try {
  students = await API.getStudents();
  saveCachedStudents(students);

} catch {
  students = getCachedStudents();
}
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
      showToast("Student Name and ID  Required", "warning");
      return;
    }

    if (!/^\d+$/.test(id)) {
  showToast("Student ID Must Contain Numbers Only");
  return;
}

let students = [];

try {
  students = await API.getStudents();
  saveCachedStudents(students);

} catch {
  students = getCachedStudents();
}

if (students.some(s => normalizeId(s.id) === normalizeId(id))) {
  showToast("Student ID Already Exists", "warning");
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
    showToast(`Image Too large. Max Allowed is ${MAX_IMAGE_SIZE_MB}MB`, "warning");
    return;
  }
      const reader = new FileReader();

      image = await new Promise(resolve => {
        reader.onload = e => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    }

    await API.addStudent({ name, id, courses, image, active: true });

    showToast("Student Added Successfully", "success");

    // clear form
    document.getElementById("studentName").value = "";
    document.getElementById("studentId").value = "";
    document.getElementById("courseTags").innerHTML = "";
    document.getElementById("studentImage").value = "";
    document.getElementById("imagePreview").src = "";
loadStudents();

  } catch (err) {
    console.error(err);
    showToast("Failed To Add Student", "error");
  }
}

window.loadStudents = loadStudents;
window.addStudent = addStudent;