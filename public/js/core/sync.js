console.log("sync.js Loaded");


/* =========================
   PROCESS SYNC QUEUE
========================= */

async function processSyncQueue() {
 
  // MUST BE ONLINE
  if (!navigator.onLine) {
    return;
  }

  try {

    let attendanceChanged = false;

    const pending = await getPendingSyncs();

    if (!pending.length) {
      return;
    }

    console.log(
      "Processing sync queue:",
      pending.length
    );

    // LOAD CURRENT SERVER DATA
    let attendance = await DataLayer.getAttendance();
    const syncedIds = [];

    for (const item of pending) {

      // UPDATE STUDENT
      if (item.type === "student_update") {
  
        await API.updateStudent(  
         item.payload.originalId || item.payload.id,  
          item.payload  
        );
  
        await removeSyncItem(item.id);  
        continue;
      }

      // STUDENT SAVE
        if (item.type === "student_create") {     
          await API.addStudent(item.payload);  
    
          await removeSyncItem(item.id); 
        }

      //DELETE STUDENT
        if (item.type === "student_delete") {
 
          await API.deleteStudent(item.payload.id);
 
          await removeSyncItem(item.id);
 
          continue;
        }

      // ATTENDANCE SAVE
      if (
        item.type === "attendance_save"
      ) {

                    console.log(
  "Syncing attendance:",
  item.payload.date
);

        attendanceChanged = true;

        // REMOVE OLD SAME DATE
        attendance = attendance.filter(a => a.date !== item.payload.date);

        // ADD LOCAL VERSION
        attendance.push(item.payload);

        const existing = attendance.find(a => a.date === item.payload.date);
        
if (!existing) {
  attendance.push(item.payload);
  
} else {
  // LAST WRITE WINS
  if (item.payload.version > existing.version){

    attendance = attendance.filter(
        a => a.date !== item.payload.date
      );

    // REMOVE FROM QUEUE
    attendance.push(item.payload);
  }

    console.log(
      "Conflict resolved:",
      item.payload.date
    );
  }
}
 }
    // PUSH FINAL MERGED DATA
    if (attendanceChanged) {  
      await API.saveAttendance(attendance);
    }

    for (const id of syncedIds) {
       await removeSyncItem(id);
}

    console.log(
  "Sending attendance to server",
  attendance
);

    showToast(
      "Sync Complete",
      "success"
    );

    console.log(
      "Sync complete"
    );

  } catch (err) {
  
    console.error(
      "SYNC FAILED:",
      err
    );

  }

}

// NETWORK RESTORE
window.addEventListener("online",() => {

  console.log("Network restored");

  showToast(
    "Network Restored",
    "success"
  );   

    processSyncQueue();
  }
);

// INITIAL CHECK
document.addEventListener("DOMContentLoaded",() => {

    if (navigator.onLine) {
      processSyncQueue();
    }
  }
);