console.log("db.js Loaded");

/* =========================
   DATABASE CONFIG
========================= */

const DB_NAME = "attendance_app_db";
const DB_VERSION = 4;

const SYNC_STORE = "syncQueue";
const ATTENDANCE_STORE = "attendance";
const STUDENT_STORE = "students";

/* =========================
   OPEN DATABASE
========================= */

function openDB() {

  return new Promise((resolve, reject) => {

    const request = indexedDB.open(
      DB_NAME,
      DB_VERSION
    );

    request.onupgradeneeded = event => {

      const db = event.target.result;

      /* =========================
         SYNC QUEUE STORE
      ========================= */

      if (
        !db.objectStoreNames.contains(
          SYNC_STORE
        )
      ) {

        const syncStore = db.createObjectStore(SYNC_STORE,
            {
              keyPath: "id"
            }
          );

        syncStore.createIndex(
          "status",
          "status",
          {
            unique: false
          }
        );

      }
      if (  
        !db.objectStoreNames.contains(ATTENDANCE_STORE)
    ) {  
        db.createObjectStore(ATTENDANCE_STORE,    
            {
      keyPath: "date"    
    }  
  );

    } 
      if (  
        !db.objectStoreNames.contains(STUDENT_STORE)
    ) {    
    db.createObjectStore(STUDENT_STORE,  
      { 
        keyPath: "id"
  
      }
    );
  }

    }    
    request.onsuccess = () => {resolve(request.result);};

    request.onerror = () => {reject(request.error);};

  });

}

/* =========================
   ADD TO SYNC QUEUE
========================= */

async function addToSyncQueue(item) {

  const db = await openDB();

  return new Promise((resolve, reject) => {

    const tx = db.transaction(
      SYNC_STORE,
      "readwrite"
    );

    const store = tx.objectStore(SYNC_STORE);

    const request = store.add(item);

    request.onsuccess = () => {resolve(true);};

    request.onerror = () => {
      reject(request.error);
    };

  });

}

/* =========================
   LOAD ATTENDANCE LOCALLY
========================= */
async function getOfflineAttendance() {

  const db = await openDB();

  return new Promise((resolve, reject) => {

    const tx = db.transaction(
      ATTENDANCE_STORE,
      "readonly"
    );

    const store = tx.objectStore(
        ATTENDANCE_STORE
      );

    const request = store.getAll();

    request.onsuccess = () => {resolve(request.result);};

    request.onerror = () => {reject(request.error);};

  });

}

/* =========================
   SAVE ATTENDANCE LOCALLY
========================= */
async function saveAttendanceOffline(day) {

  const db = await openDB();

  return new Promise((resolve, reject) => {

    const tx = db.transaction(
      ATTENDANCE_STORE,
      "readwrite"
    );

    const store = tx.objectStore(ATTENDANCE_STORE);

    const request = store.put(day);

    request.onsuccess = () => {resolve(true);};

    request.onerror = () => {reject(request.error);
    };
  });

}

/* =========================
   LOAD STUDENT LOCALLY
========================= */
async function getOfflineStudents() {

  const db = await openDB();

  return new Promise((resolve, reject) => {

    const tx = db.transaction(
        "students",
        "readonly"
      );

    const store = tx.objectStore("students");

    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);

    request.onerror = () => reject(request.error);
  });

}

/* =========================
   SAVE STUDENT LOCALLY
========================= */
async function saveOfflineStudents(students) {

  const db = await openDB();

  return new Promise((resolve, reject) => {

    const tx = db.transaction(
        STUDENT_STORE,
        "readwrite"
      );

    const store = tx.objectStore(STUDENT_STORE);

    store.clear();

    students.forEach(student => {
      store.put(student);
    });

    tx.oncomplete = () => resolve();

    tx.onerror = () => reject(tx.error);
  });
}


/* =========================
   GET ALL PENDING SYNCS
========================= */

async function getPendingSyncs() {

  const db = await openDB();

  return new Promise((resolve, reject) => {

    const tx = db.transaction(
      SYNC_STORE,
      "readonly"
    );

    const store =
      tx.objectStore(SYNC_STORE);

    const request =
      store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };

  });

}

/* =========================
   SAVE CACHED STUDENTS
========================= */

function saveCachedStudents(students){

  localStorage.setItem(
    "cached_students",
    JSON.stringify(students)
  );

}

/* =========================
   GET CACHED STUDENTS
========================= */

function getCachedStudents(){

  return JSON.parse(
    localStorage.getItem(
      "cached_students"
    ) || "[]"
  );

}

/* =========================
   DELETE SYNC ITEM
========================= */

async function removeSyncItem(id) {

  const db = await openDB();

  return new Promise((resolve, reject) => {

    const tx = db.transaction(
      SYNC_STORE,
      "readwrite"
    );

    const store =
      tx.objectStore(SYNC_STORE);

    const request =
      store.delete(id);

    request.onsuccess = () => {
      resolve(true);
    };

    request.onerror = () => {
      reject(request.error);
    };

  });

}

/* =========================
   SAVE CACHED HOLIDAYS
========================= */

function saveCachedHolidays(holidays){

  localStorage.setItem(
    "cached_holidays",
    JSON.stringify(holidays)
  );

}

/* =========================
   GET CACHED HOLIDAYS
========================= */

function getCachedHolidays(){

  return JSON.parse(
    localStorage.getItem(
      "cached_holidays"
    ) || "[]"
  );
}

async function saveAllOfflineAttendance(data) {

  const db = await openDB();

  return new Promise((resolve, reject) => {

    const tx = db.transaction(
      ATTENDANCE_STORE,
      "readwrite"
    );

    const store = tx.objectStore(ATTENDANCE_STORE);

    const request = store.clear();

    request.onsuccess = () => {

      data.forEach(item => store.put(item));
      
      resolve(true);
    };

    request.onerror = () => reject(request.error);
  });
}

async function testSyncQueue() {

  await addToSyncQueue({
    id: crypto.randomUUID(),
  type: "student_update",
  payload: {
    id: "001",
    name: "Esther",
    active: false
  }
  });

  console.log(
    await getPendingSyncs()
  );

}


window.getOfflineStudents = getOfflineStudents;
window.saveOfflineStudents = saveOfflineStudents;
window.saveAllOfflineAttendance = saveAllOfflineAttendance;
window.saveCachedHolidays = saveCachedHolidays;
window.getCachedHolidays = getCachedHolidays;
window.openDB = openDB;
window.addToSyncQueue = addToSyncQueue;
window.getPendingSyncs = getPendingSyncs;
window.removeSyncItem = removeSyncItem;
window.saveAttendanceOffline = saveAttendanceOffline;
window.getOfflineAttendance = getOfflineAttendance;
window.saveCachedStudents = saveCachedStudents;
window.getCachedStudents = getCachedStudents;