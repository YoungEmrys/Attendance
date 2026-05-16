const CURRENT_DB_VERSION = 3;

function migrateDatabase(db) {

  /* =========================
     VERSION 1
  ========================= */

  if (!db.version) {
    db.version = 1;
  }


    // VERSION 2
    // ADD ACTIVE STATUS TO STUDENT 
 
  if (db.version === 1) {

    db.students = (db.students || []).map(student => ({
      active: true,
      ...student
    }));

    db.version = 2;
  }
  
// VERSION 3
// ADD HOLIDAYS
if(db._version < 3){

  if(!db.holidays){
    db.holidays = [];
  }

  db._version = 3;
}

  return db;
}


module.exports = {
  CURRENT_DB_VERSION,
  migrateDatabase
};