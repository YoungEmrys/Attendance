// FILE HANDLER
console.log("importer.js Loaded")

async function handleFile() {
  const input = document.getElementById("file");
  const file = input.files[0];

  if (!file) {
    showToast("Please Select Exported Attendance File", "Warning");
    return;
  }

  // CLEAR OLD DATA
  window.previewData = null;
  document.getElementById("previewContainer").innerHTML = "";

  const data = await file.arrayBuffer();

  const workbook = XLSX.read(data, { type: "array" });

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json(sheet);

  console.log("RAW ROWS:", rows);

  processRows(rows);
}

function detectIdColumn(rows) {
  const counts = {};

  rows.forEach(row => {
    Object.entries(row).forEach(([key, value]) => {
      if (!value) return;

      const v = String(value).trim();

      // numeric ID check
      if (/^\d+$/.test(v)) {
        counts[key] = (counts[key] || 0) + 1;
      }
    });
  });

  let bestKey = null;
  let max = 0;

  Object.entries(counts).forEach(([key, count]) => {
    if (count > max) {
      max = count;
      bestKey = key;
    }
  });

  return bestKey;
}

/* =========================
   PROCESSOR FOR ROWS
========================= */

function processRows(rows) {
  const grouped = {};
  const seen = {};

  if (!rows || rows.length < 2) {
    console.error("Invalid file");
    return;
  }

  /* =========================
     1. FIND HEADER ROW (DATES)
  ========================= */
  const headerIndex = rows.findIndex(row =>
    Object.values(row).some(v => typeof v === "number" && v >= 1 && v <= 31)
  );

  if (headerIndex === -1) {
    console.error("No header row found");
    return;
  }

  const headerRow = rows[headerIndex];

  // 2. BUILD DAY MAP
 
  const dayMap = {};

  Object.entries(headerRow).forEach(([key, value]) => {
    if (typeof value === "number" && value >= 1 && value <= 31) {
      dayMap[key] = value;
    }
  });

  console.log("DAY MAP:", dayMap);

  // 3. DETECT YEAR + MONTH FROM FILE NAME (AUTO)
  
const settings = getSettings();

let today = new Date();
let year = today.getFullYear();
let month = today.getMonth() + 1;

// 1. Try filename/header detection first
const firstRow = rows[0];
const titleText = Object.values(firstRow).join(" ");

const match = titleText.match(/(\d{4})-(\d{2})/);
if (match) {
  year = parseInt(match[1]);
  month = parseInt(match[2]);
}

// 2. If auto-detect OFF → use manual settings
if (!settings.autoDetectMonth) {
  if (settings.manualMonth) month = parseInt(settings.manualMonth);
  if (settings.manualYear) year = parseInt(settings.manualYear);
}

// REMOVE the "day <= 3" logic entirely

  console.log("Detected:", { year, month });

  /* =========================
     4. PROCESS DATA ROWS
  ========================= */
  const dataRows = rows.slice(headerIndex + 1);
  const idColumn = detectIdColumn(dataRows);

if (!idColumn) {
  console.error("Could not detect ID column");
  return;
}

console.log("Detected ID Column:", idColumn);

  dataRows.forEach(row => {
    // Find ID dynamically
let rawId = row[idColumn];
// normalize early
if (rawId !== undefined && rawId !== null) {
  rawId = String(rawId).trim();
}

    if (!rawId) return;
    const id = normalizeId(rawId);

    Object.keys(dayMap).forEach(colKey => {
      let time = row[colKey];

      if (!time) return;

      // Handle Excel numeric time
if (typeof time === "number") {
  time = XLSX.SSF.format("hh:mm", time);
}

if (typeof time === "string") {
  time = time.trim();

  // remove seconds if present
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(time)) {
    time = time.slice(0, 5);
  }

  // convert AM/PM to 24h
  const ampmMatch = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1]);
    const m = ampmMatch[2];
    const ampm = ampmMatch[3].toUpperCase();

    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;

    time = `${String(h).padStart(2, "0")}:${m}`;
  }
}

// final validation
if (!/^\d{2}:\d{2}$/.test(time)) return;

      const day = dayMap[colKey];

      const maxDays = new Date(year, month, 0).getDate();
      if (day < 1 || day > maxDays) return;

      const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      const uniqueKey = id + "_" + date;
      if (seen[uniqueKey]) return;

      seen[uniqueKey] = true;

      if (!grouped[date]) grouped[date] = {};
      grouped[date][id] = time;
    });
  });

  console.log("GROUPED:", grouped);

  buildPreview(grouped);
}


/* =================================
   MATCHING STUDENT WITH TIME RULE
====================================*/

async function buildPreview(grouped) {
let students = [];

try {
  students = await API.getStudents();
  saveCachedStudents(students);

} catch {
  students = getCachedStudents();
}

  const studentMap = {};
  students.forEach(s => {
    studentMap[normalizeId(s.id)] = s;
  });

const settings = getSettings();
  const previewData = [];

  Object.keys(grouped).forEach(date => {
    const records = [];

    const dayData = grouped[date];

students.forEach(s => {
  const id = normalizeId(s.id);

const rawId = String(parseInt(id)); // remove padding
let time = null;

// try all possible matches
const variants = [
  id,
  String(parseInt(id)),      // remove padding
  id.padStart(3, "0"),      // force pad
];

for (let v of variants) {
  if (dayData[v]) {
    time = dayData[v];
    break;
  }
}

let status = "absent";

const lateTime = settings.lateTime;

if (time) {
  if (settings.compareMode === "strict") {
    status = time > lateTime ? "late" : "ontime";
  }
}  

  records.push({
    studentId: id,
    name: s.name,
    time: time || "--:--",
    status,
    matched: true
  });
});


    // detect unmatched IDs
    Object.keys(dayData).forEach(rawId => {
      const id = normalizeId(rawId);

      if (!studentMap[id]) {
        records.push({
          studentId: id,
          name: "Unknown",
          time: dayData[id],
          status: dayData[id] > settings.lateTime ? "late" : "ontime",
          matched: false
        });
      }
    });

    previewData.push({ date, records });
  });

  console.log("PREVIEW DATA:", previewData);

  renderPreview(previewData);
}

/* =========================
  ATTENDANCE PREVIEW FILTER
============================ */

async function applyPreviewFilter() {
    showLoader();
  await new Promise(r => setTimeout(r, 1000));
  hideLoader();

  if (!window.previewData) return;

  const start = document.getElementById("previewStart").value;
  const end = document.getElementById("previewEnd").value;

  if (!start || !end) {
    renderPreview(window.previewData);
    return;
  }

  const filtered = window.previewData.filter(day => {
    return day.date >= start && day.date <= end;
  });

  renderPreview(filtered);
}


/* =========================
   ATTENDANCE PREVIEW
========================= */

async function renderPreview(data) {

    showLoader();
  await new Promise(r => setTimeout(r, 1000));
  hideLoader();

  const container = document.getElementById("previewContainer");
  if (!container) return;

  container.innerHTML = "";

  data.forEach(day => {
    const section = document.createElement("div");

    section.innerHTML = `
      <h3>${formatDate(day.date)} (${getDayName(day.date)})</h3>
      ${day.records.map(r => `
  <div class="preview-row ${r.matched ? "" : "unmatched"}">
    <span>${r.studentId}</span>
    <span>${r.name}</span>
    <span>${r.time}</span>
    <span>${r.status}</span>
  </div>
`).join("")}
    `;

    container.appendChild(section);
  });

  window.previewData = data; // store globally for confirm
}


/* =========================
   CONFIRM IMPORT
========================= */

async function confirmImport() {
  if (!window.previewData) return;

let attendance = await API.getAttendance() || [];

window.previewData.forEach(day => {
  let existing = attendance.find(a => a.date === day.date);

  const newRecords = day.records
    .filter(r => r.matched)
    .map(r => ({
      studentId: r.studentId,
      status: r.status,
      time: r.time
    }));

  if (!existing) {
    attendance.push({
      date: day.date,
      records: newRecords
    });
  } else {
    // merge per student (overwrite only those present)
    newRecords.forEach(newRec => {
      const index = existing.records.findIndex(
        r => r.studentId === newRec.studentId
      );

      if (index >= 0) {
        existing.records[index] = newRec; // overwrite
      } else {
        existing.records.push(newRec);
      }
    });
  }
});
  await API.saveAttendance(attendance);

await loadAttendanceForDate(
  document.getElementById("datePicker").value
);

  showToast("Import Successful");
}


/* =========================
   CANCEL IMPORT
========================= */

function cancelImport() {
  document.getElementById("previewContainer").innerHTML = "";
  window.previewData = null;
}

window.handleFile = handleFile;
window.confirmImport = confirmImport;
window.cancelImport = cancelImport;
window.applyPreviewFilter = applyPreviewFilter;