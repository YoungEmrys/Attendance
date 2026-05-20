console.log("ui.js Loaded")

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

// CONFIRM MESSAGE
function showConfirm(message) {

  return new Promise((resolve) => {

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    overlay.innerHTML = `
      <div class="confirm-modal">

        <h3>Confirmation</h3>

        <p>${message}</p>

        <div class="modal-actions">

          <button class="cancel-btn">
            Cancel
          </button>

          <button class="confirm-btn">
            Confirm
          </button>

        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const cancelBtn =
      overlay.querySelector(".cancel-btn");

    const confirmBtn =
      overlay.querySelector(".confirm-btn");

    cancelBtn.addEventListener("click", () => {
      overlay.remove();
      resolve(false);
    });

    confirmBtn.addEventListener("click", () => {
      overlay.remove();
      resolve(true);
    });

  });
}

// SHOW LOADING
function showLoader() {
  let loader = document.getElementById("globalLoader");

  if (!loader) {
    loader = document.createElement("div");

    loader.id = "globalLoader";

    loader.innerHTML = `
      <div class="loader-spinner"></div>
    `;

    document.body.appendChild(loader);
  }

  loader.style.display = "flex";
}

//HIDE LOADER
function hideLoader() {
  const loader = document.getElementById("globalLoader");

  if (loader) {
    loader.style.display = "none";
  }
}

// BUTTON STATE
function disableButton(btn, text = "Processing...") {
  if (!btn) return;

  btn.dataset.originalText = btn.innerHTML;

  btn.disabled = true;
  btn.innerHTML = text;
}

function enableButton(btn) {
  if (!btn) return;

  btn.disabled = false;

  if (btn.dataset.originalText) {
    btn.innerHTML = btn.dataset.originalText;
  }
}

window.showConfirm = showConfirm;
window.showToast = showToast;