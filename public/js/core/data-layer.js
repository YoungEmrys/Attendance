console.log("data-layer.js Loaded");

/* =========================
   STORAGE MODES
========================= */

const STORAGE_MODE = {

  LOCAL_FIRST: "local-first",

  SERVER_FIRST: "server-first"

};

/* =========================
   GET CURRENT MODE
========================= */

function getStorageMode() {

  return localStorage.getItem(
    "storageMode"
  ) || STORAGE_MODE.LOCAL_FIRST;

}

/* =========================
   SET STORAGE MODE
========================= */

function setStorageMode(mode) {

  localStorage.setItem(
    "storageMode",
    mode
  );

}


/* =========================
   DATA LAYER
========================= */

const DataLayer = {

// STUDENTS
async getStudents() {

  const mode = getStorageMode();

  // LOCAL FIRST
  if (mode === STORAGE_MODE.LOCAL_FIRST) {

    let local = await getOfflineStudents();

    if (local.length === 0) {

      const students = await API.getStudents();

      await saveOfflineStudents(students);

      return students;

    }

    return local;

  }

  // SERVER FIRST
  else {

    try {

      const students = await API.getStudents();

      await saveOfflineStudents(students);

      return students;

    } catch {

      return await getOfflineStudents();

    }

  }

},

  /* =========================
     HOLIDAYS
  ========================= */

  async getHolidays() {

    try {
      const holidays = await API.getHolidays();

      localStorage.setItem(
        "cached_holidays",
        JSON.stringify(holidays)
      );

      return holidays;

    } catch {

      console.warn(
        "Using Cached Holidays"
      );
      
      return JSON.parse(
        localStorage.getItem(
          "cached_holidays"
        ) || "[]"
      );
    }
  },

/* ==============================
   ATTENDANCE (LOCAL FIRST CORE)
================================= */

async getAttendance() {

  const mode = getStorageMode();


  try {

    const attendance = await API.getAttendance();

    await saveAllOfflineAttendance(attendance || []);

    return attendance || [];

  } catch {

    return await getOfflineAttendance();

  }

},

// WRITE FLOW
async saveAttendance(day) {

  // 1. ALWAYS SAVE LOCALLY FIRST
  await saveAttendanceOffline(day);

  // 2. UPDATE LOCAL INDEX (overwrite same date)
  const all = await getOfflineAttendance();

  const updated = [
    ...all.filter(a => a.date !== day.date),
    day
  ];

  await saveAllOfflineAttendance(updated);

}
};


window.DataLayer = DataLayer;
window.STORAGE_MODE = STORAGE_MODE;
window.getStorageMode = getStorageMode;
window.setStorageMode = setStorageMode;