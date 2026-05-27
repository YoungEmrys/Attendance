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

      try {
        const students = await API.getStudents();
        saveCachedStudents(students);

        return students;

      } catch {
        console.warn(
          "Using Cached Students"
        );

        return getCachedStudents();

      }

    }

    // SERVER FIRST
    else {

      try {
        const students = await API.getStudents();
        saveCachedStudents(students);

        return students;

      } catch (err) {
        console.warn(
          "Server Failed, Using Cache"
        );

        return getCachedStudents();

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
  }
};

/* =========================
   EXPORTS
========================= */

window.DataLayer = DataLayer;
window.STORAGE_MODE = STORAGE_MODE;
window.getStorageMode = getStorageMode;
window.setStorageMode = setStorageMode;