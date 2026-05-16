//SETTINGS
console.log("settings.js loaded");

function getSettings() {
  const saved = localStorage.getItem("settings");

  const DEFAULT_SETTINGS = {
    lateTime: "08:30",
    graceEnabled: false,
    graceTime: "08:40",
    compareMode: "strict",
    autoAbsent: true,
    displayMode: "friendly",
    timeFormat: "12h",
    idPadding: 3,
  };

return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;}

window.getSettings = getSettings;
