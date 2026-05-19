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
  saveBtn.addEventListener("click", submitAttendance);
}

// MARK ABSENT
const markAbsentBtn = document.getElementById("markAbsentBtn");
if (markAbsentBtn) {
  markAbsentBtn.addEventListener("click", markUnmarkedAsAbsent);
}

// CLEAR MONTH
const clearBtn = document.getElementById("clearMonthBtn");
if (clearBtn) {
  clearBtn.addEventListener("click", clearMonthAttendance);
}

// RESET
const resetBtn = document.getElementById("resetAttendanceBtn");
if (resetBtn) {
  resetBtn.addEventListener("click", fullResetAttendance);
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

