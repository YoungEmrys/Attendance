console.log("Settings script loaded");

/* =========================
   DEFAULT SETTINGS
========================= */

const DEFAULT_SETTINGS = {
  lateTime: "08:30",
  graceEnabled: false,
  graceTime: "08:40",
  compareMode: "strict",
  defaultStatus: "absent",
  importMode: "merge",
  autoDetectMonth: true,
  unknownMode: "warn",
  autoPad: true,
  matchMode: "id",
  displayMode: "friendly",
  timeFormat: "12h",
  autoAbsent: true,
  lockSettings: false,
  showInactiveStudents: true
};

let currentSettings = {};

/* =========================
   INIT
========================= */

document.addEventListener("DOMContentLoaded", init);

async function init() {
  await loadSettings();
  applySettingsToUI();
  setupEvents();
  updateSummary();
}

/* =========================
   LOAD / SAVE (TEMP LOCAL)
========================= */

async function loadSettings() {
  const saved = localStorage.getItem("settings");
  currentSettings = saved ? JSON.parse(saved) : { ...DEFAULT_SETTINGS };
}

function saveSettings() {
  localStorage.setItem("settings", JSON.stringify(currentSettings));
}

/* =========================
   APPLY TO UI
========================= */

function applySettingsToUI() {
  document.getElementById("lateTime").value = 
  currentSettings.lateTime;

  document.getElementById("graceEnabled").checked = 
  currentSettings.graceEnabled;
  
  document.getElementById("graceTime").value = 
  currentSettings.graceTime;

  document.querySelector(`[name="compareMode"][value=
    "${currentSettings.compareMode}"]`).checked = true;

  document.getElementById("defaultStatus").value = 
  currentSettings.defaultStatus;

  document.querySelector(`[name="importMode"][value=
    "${currentSettings.importMode}"]`).checked = true;

  document.getElementById("autoDetectMonth").checked = 
  currentSettings.autoDetectMonth;

  document.querySelector(`[name="unknownMode"][value=
    "${currentSettings.unknownMode}"]`).checked = true;

  document.getElementById("autoPad").checked = 
  currentSettings.autoPad;

  document.querySelector(`[name="matchMode"][value=
    "${currentSettings.matchMode}"]`).checked = true;

  document.querySelector(`[name="displayMode"][value=
    "${currentSettings.displayMode}"]`).checked = true;

  document.querySelector(`[name="timeFormat"][value=
    "${currentSettings.timeFormat}"]`).checked = true;

  document.getElementById("autoAbsent").checked = 
  currentSettings.autoAbsent;

  const locked = currentSettings.lockSettings;

  document.querySelectorAll("input, select, button").forEach(el => {
  if (![
    "lockSettings", 
    "saveSettingsBtn", 
    "cancelSettingsBtn", 
    "resetSettingsBtn"
  ].includes(el.id)) {
    el.disabled = locked;
  }
});

  document.getElementById("lockMessage").style.display = locked ? "block" : "none";
  
document.getElementById("lockSettings").addEventListener("change", () => {
  currentSettings.lockSettings = 
  document.getElementById("lockSettings").checked;
  applySettingsToUI();
});

  document.getElementById("manualMonth").value = 
  currentSettings.manualMonth || "";

  document.getElementById("manualYear").value = 
  currentSettings.manualYear || "";

  document.getElementById
  ("showInactiveStudents").checked = 
  currentSettings.showInactiveStudents;
}

/* =========================
   READ FROM UI
========================= */

function readSettingsFromUI() {
  currentSettings.lateTime = 
  document.getElementById("lateTime").value;
 
  currentSettings.graceEnabled = 
  document.getElementById("graceEnabled").checked;
 
  currentSettings.graceTime = 
  document.getElementById("graceTime").value;
 
  currentSettings.compareMode =   
  document.querySelector(`[name="compareMode"]:checked`).value;
 
  currentSettings.defaultStatus = 
  document.getElementById("defaultStatus").value;
 
  currentSettings.importMode = 
  document.querySelector(`[name="importMode"]:checked`).value;
 
  currentSettings.autoDetectMonth = 
  document.getElementById("autoDetectMonth").checked;
 
  currentSettings.unknownMode = 
  document.querySelector(`[name="unknownMode"]:checked`).value;
 
  currentSettings.autoPad = 
  document.getElementById("autoPad").checked;

  currentSettings.matchMode = 
  document.querySelector(`[name="matchMode"]:checked`).value;

  currentSettings.displayMode = 
  document.querySelector(`[name="displayMode"]:checked`).value;

  currentSettings.timeFormat =   
  document.querySelector(`[name="timeFormat"]:checked`).value;

  currentSettings.autoAbsent = 
  document.getElementById("autoAbsent").checked;

  currentSettings.lockSettings = 
  document.getElementById("lockSettings").checked;

  currentSettings.manualMonth = 
  document.getElementById("manualMonth").value;
  
  currentSettings.manualYear = 
  document.getElementById("manualYear").value;

  currentSettings.showInactiveStudents =
  document.getElementById("showInactiveStudents").checked;
}

/* =========================
   EVENTS
========================= */

function setupEvents() {
  document.getElementById("saveSettingsBtn")
    .addEventListener("click", confirmSave);

  document.getElementById("resetSettingsBtn")
    .addEventListener("click", confirmReset);

  document.getElementById("cancelSettingsBtn")
    .addEventListener("click", cancelChanges);

      document.querySelectorAll("input, select").forEach(el => {
  el.addEventListener("change", () => {
    readSettingsFromUI();
    updateSummary();
  });
});

}

/* =========================
   CONFIRMATIONS
========================= */

async function confirmSave() {

   const confirmed = await showConfirm("Save Changes to Settings?");
  if (!confirmed) return;

  readSettingsFromUI();
  saveSettings();

  showToast("Settings Saved");

    applySettingsToUI();
  updateSummary();
}

async function confirmReset() {
  const confirmed = await showConfirm("Reset All Settings to Default?");
  if (!confirmed) return;

  currentSettings = { ...DEFAULT_SETTINGS };
  currentSettings.lockSettings = false;

  saveSettings();
  applySettingsToUI();

  showToast("Settings Reset");
  updateSummary();
}

async function cancelChanges() {
  
  const confirmed = await showConfirm("Discard Unsaved Changes?");
    if (!confirmed) return;

  loadSettings(); 
  applySettingsToUI();
  updateSummary();
}

function shouldShowInactive() {
  const settings = getSettings();
  return settings.showInactiveStudents === true;
}

/* =========================
   SUMMARY
========================= */

function updateSummary() {
  const el = document.getElementById("settingsSummary");

  el.textContent = `
Late after ${currentSettings.lateTime} | 
Import: ${currentSettings.importMode} | 
Display: ${currentSettings.displayMode} | 
Time: ${currentSettings.timeFormat}
  `;
}