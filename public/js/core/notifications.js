console.log("notifications.js Loaded")

// NOTIFICATION
function showToast(message, type = "success") {

  const toast = document.createElement("div");

  toast.className = `toast toast-${type}`;

  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 50);

  setTimeout(() => {
    toast.classList.remove("show");

    setTimeout(() => {
      toast.remove();
    }, 300);

  }, 3000);
}

window.showToast = showToast;