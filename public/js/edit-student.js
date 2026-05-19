// EDIT STUDENT

console.log("edit-student.js Loaded")

let editCourses = [];

async function loadEditStudent() {
const params = new URLSearchParams(window.location.search);

const studentId = params.get("id");

if (!studentId) {
  alert("No student selected");
  return;
}

const students = await API.getStudents();

const student = students.find(
  s => String(s.id) === String(studentId)
);

if (!student) {
  alert("Student not found");
  return;
} 

  document.getElementById("editName").value = student.name || "";
  document.getElementById("editId").value = student.id || "";
  document.getElementById("editActive").checked =
  student.active !== false;

  // Load courses
  editCourses = [...(student.courses || [])];
  renderEditCourses();

  // Image preview
  const preview = document.getElementById("editImagePreview");
  if (preview) {
    preview.src = student.image || "";
  }

  // Realtime image preview
  const imageInput = document.getElementById("editImage");
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

  // Add course button
  const btn = document.getElementById("addCourseBtnEdit");
  if (btn) {
    btn.addEventListener("click", addEditCourse);
  }
}

// SAVE EDIT
async function saveEdit() {
const params = new URLSearchParams(window.location.search);

const studentId = params.get("id");

if (!studentId) {
  alert("No student selected");
  return;
}

const students = await API.getStudents();

const student = students.find(
  s => String(s.id) === String(studentId)
);

if (!student) {
  alert("Student not found");
  return;
} 

  const name = document.getElementById("editName").value.trim();
  const id = document.getElementById("editId").value.trim();

  if (!name || !id) return alert("Student Name and ID required");

  if (!/^\d+$/.test(id)) {
  alert("Student ID must contain numbers only");
  return;
}

  let image = student.image;

  const MAX_IMAGE_SIZE_MB = 1;
  const imageInput = document.getElementById("editImage");

  if (imageInput && imageInput.files.length > 0) {

    const file = imageInput.files[0];
    const sizeMB = file.size / (1024 * 1024);
    const reader = new FileReader();

    if (sizeMB > MAX_IMAGE_SIZE_MB) {
    alert(`Image too large. Max allowed is ${MAX_IMAGE_SIZE_MB}MB`);
    return;
  }
    image = await new Promise(resolve => {
      reader.onload = e => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }

  const active =
  document.getElementById("editActive").checked;

  await API.updateStudent(student.id, {
    name,
    id,
    active,
    courses: editCourses,
    image
  });
  
  console.log("UPDATED STUDENT ACTIVE:", active);

  alert("Student updated");
  window.location.href = "registered-students.html";
}

/* =========================
   UPDATE COURSE IN EDIT PAGE
========================= */

function addEditCourse() {
  const input = document.getElementById("editCourseInput");
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


// EDIT COURSE
function renderEditCourses() {
  const container = document.getElementById("editCourses");

  container.innerHTML = editCourses.map(c => `
    <span onclick="removeEditCourse('${c}')">
      ${c} ❌
    </span>
  `).join("");
}

function removeEditCourse(course) {
  editCourses = editCourses.filter(c => c !== course);
  renderEditCourses();
}

function goBack() {
  window.location.href = "registered-students.html";
}

// LOAD STUDENT DETAILS
async function loadStudentDetails() {
const profileBar = document.getElementById("profileBar");
const coursesContainer = document.getElementById("coursesContainer");
const params = new URLSearchParams(window.location.search);

const studentId = params.get("id");

if (!studentId) {
  profileBar.innerHTML =
    "<p style='color:red'>No student selected</p>";
  return;
}
const students = await API.getStudents();

const student = students.find(
  s => String(s.id) === String(studentId)
);

  

  if (!profileBar) return;

  if (!student) {
    profileBar.innerHTML = "<p style='color:red'>Student not found</p>";
    return;
  }

  /* PROFILE BAR*/
  profileBar.innerHTML = `
    <div class="profile-bar">
    ${
    student.image
      ? `<img 
        src="${student.image || ''}" 
        class="profile-img"/>`
      : getInitials(student.name)
        }
      

      <div class="profile-info">
        <h3>${student.name}</h3>
        <p><strong>ID:</strong> ${student.id}</p>
        <p><strong>Courses:</strong> ${(student.courses || []).join(", ")}</p>      </div>
     </div>
  `;

  /* COURSES */
if (coursesContainer) {
    if (!student.courses || student.courses.length === 0) {
      coursesContainer.innerHTML = `<p class="empty">No courses assigned</p>`;
    }  
  }

}

window.saveEdit = saveEdit;
window.removeEditCourse = removeEditCourse;
window.goBack = goBack;