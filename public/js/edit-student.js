// EDIT STUDENT

console.log("edit-student.js Loaded")

let editCourses = [];

async function loadEditStudent() {
const params = new URLSearchParams(window.location.search);

const studentId = params.get("id");

if (!studentId) {
  showToast("No Student Selected", "warning");
  return;
}

let students = [];

try {
students = await DataLayer.getStudents();  
saveCachedStudents(students);

} catch {
  students = getCachedStudents();
}

const student = students.find(s => String(s.id) === String(studentId));

if (!student) {
  showToast("Student Not Found", "info");
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
  showToast("No Student Selected", "warning");
  return;
}

let students = [];

try {
students = await DataLayer.getStudents();  
saveCachedStudents(students);

} catch {
  students = getCachedStudents();
}

const student = students.find(
  s => String(s.id) === String(studentId)
);

if (!student) {
  showToast("Student Not Found", "info");
  return;
} 

  const name = document.getElementById("editName").value.trim();
  const id = document.getElementById("editId").value.trim();

  if (!name || !id) return showToast("Student Name and ID Required", "warning");

  if (!/^\d+$/.test(id)) {
  showToast("Student ID Must Contain Numbers Only", "warning");
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
    showToast(`Image too large. Max allowed is ${MAX_IMAGE_SIZE_MB}MB`, "warning");
    return;
  }
    image = await new Promise(resolve => {
      reader.onload = e => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }

  const active = document.getElementById("editActive").checked;

  const localStudents = await getOfflineStudents();

  const updatedStudent = {
  name,
  id,
  courses: editCourses,
  image,
  active,
  originalId: studentId
};

const originalId = studentId;

const index = localStudents.findIndex(s => s.id === originalId);

localStudents[index] = updatedStudent;

await saveOfflineStudents(localStudents);

await addToSyncQueue({
  id: crypto.randomUUID(),
  type: "student_update",
  payload: updatedStudent
});
  
  console.log("UPDATED STUDENT ACTIVE:", active);

  showToast("Student Updated");

  window.location.href = "registered-Students.html"; 
}

// UPDATE COURSE
function addEditCourse() {
  const input = document.getElementById("editCourseInput");
  const value = input.value.trim();

  if (!value) return;

  if (editCourses.includes(value)) {
    showToast("Course Already Added", "warning");
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
if (!profileBar) return;

const coursesContainer = document.getElementById("coursesContainer");
const params = new URLSearchParams(window.location.search);

const studentId = params.get("id");

if (!studentId) {
  profileBar.innerHTML =
    "<p style='color:red'>No student selected</p>";
  return;
}
let students = [];

try {
  students = await DataLayer.getStudents();
  saveCachedStudents(students);

} catch {
  students = getCachedStudents();
}

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

window.loadStudentDetails = loadStudentDetails;
window.saveEdit = saveEdit;
window.removeEditCourse = removeEditCourse;
window.goBack = goBack;