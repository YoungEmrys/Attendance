console.log("dom-init.js Loaded")

// INIT

document.addEventListener("DOMContentLoaded", init);

async function init() {
  try {
    console.log("INIT START");

    // STUDENTS PAGE
    if (document.getElementById("studentCards")) {
      loadStudents();

      const input = document.getElementById("searchStudent");
      if (input) {
        input.addEventListener("input", (e) => {
          loadStudents(e.target.value);
        });
      }
    }

    // ATTENDANCE PAGE
    if (document.getElementById("datePicker")) {
      const datePicker = document.getElementById("datePicker");

      datePicker.value = todayString();

      await loadAttendanceForDate(datePicker.value);

      datePicker.addEventListener("change", onDateChange);
    }

    if (document.getElementById("editStudentForm")) {
  loadEditStudent();
}

    // SAVE BUTTON
const saveBtn = document.getElementById("saveAttendanceBtn");
if (saveBtn) {
  saveBtn.addEventListener("click", async() => {
    showLoader();
    disableButton(saveBtn, "Saving...");

    try{
      await submitAttendance();

    } catch(err){
      console.error(err);
      showToast("Save Failed", "error");

    } finally {
      hideLoader();
      enableButton(saveBtn);
    }
  });
}

// MARK ABSENT
const markAbsentBtn = document.getElementById("markAbsentBtn");
if (markAbsentBtn) {
  markAbsentBtn.addEventListener("click", async() => {
    showLoader();
    disableButton(markAbsentBtn);

    try{
      await markAbsentBtn();
      
    } finally {
      hideLoader();
      enableButton(markAbsentBtn);
    }
  });
}

// CLEAR MONTH
const clearBtn = document.getElementById("clearMonthBtn");
if (clearBtn) {
  clearBtn.addEventListener("click", async() => {
    showLoader();
    disableButton(clearBtn);

    try{
      await clearMonthAttendance();
      
    } finally {
      hideLoader();
      enableButton(clearBtn);
    }
  });
}

// RESET
const resetBtn = document.getElementById("resetAttendanceBtn");
if (resetBtn) {
  resetBtn.addEventListener("click", async() => {
    showLoader();
    disableButton(resetBtn);

    try{
      await fullResetAttendance();
      
    } finally {
      hideLoader();
      enableButton(resetBtn);
    }
  });
}
    // ADD STUDENT BUTTON
    const btn = document.getElementById("addStudentBtn");
    if (btn) {
      btn.addEventListener("click", addStudent);
    }

    // COURSE BUTTON
    const courseBtn = document.getElementById("addCourseBtn");
    if (courseBtn) {
      courseBtn.addEventListener("click", () => {
        const input = document.getElementById("studentCourseInput");
        const value = input.value.trim();
        if (!value) return;

        const tag = document.createElement("span");
        tag.textContent = value;

        document.getElementById("courseTags").appendChild(tag);
        input.value = "";
      });
    }

    const imageInput = document.getElementById("studentImage");
if (imageInput) {
  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById("imagePreview").src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

    console.log("INIT DONE");

  } catch (err) {
    console.error("INIT ERROR:", err);
  }
}


// DASHBOARD INIT
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

// USERS INIT
async function initUsersPage(){

  await checkAuth();
  await checkAdmin();
  await loadUsers();
}
initUsersPage();

