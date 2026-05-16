window.addEventListener("error", (e) => {
  console.error("GLOBAL ERROR:", e.message);
});

console.log("auth.js Loaded");

// ADD USER
async function getUsers(){

  const res = await fetch("/api/users",{
    credentials:"include"
  });

const data = await res.json();

if(!res.ok){
  throw new Error(
    data.message || "Failed to fetch users"
  );
}

return data.data;
}

// CREATE USER
async function createUser(user){

  const res = await fetch("/api/users",{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    credentials:"include",
    body:JSON.stringify(user)
  });

  const result = await res.json();

  if(!res.ok){
    throw new Error(data.message || "Failed to create user");
  }

  return result.data;
}

// DELETE USER
async function removeUser(username){

  const res = await fetch(`/api/users/${username}`,{
    method:"DELETE",
    credentials:"include"
  });

  const result = await res.json();

  if(!res.ok){
    throw new Error(data.message || "Failed to delete user");
  }

  return result.data;
}

/* ===========================
   RESTORE BACKUP
=========================== */

async function restoreBackup(){

  const fileInput =
    document.getElementById("restoreFile");

  const file = fileInput.files[0];

  if(!file){
    alert("Select backup file");
    return;
  }

  const confirmRestore = confirm(
    "This will replace ALL current data. Continue?"
  );

  if(!confirmRestore) return;

  try{
    const text = await file.text();

    const backupData = JSON.parse(text);

    const res = await fetch("/api/restore",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      credentials:"include",
      body:JSON.stringify(backupData)
    });

    const data = await res.json();

    if(!res.ok){
      alert(data.message);
      return;
    }

    alert("Database restored successfully");

    location.reload();

  }catch(err){
    console.error(err);

    alert("Invalid backup file");
  }
}


// UPDATE USER
async function updateUser(username, updates){

  const res = await fetch(`/api/users/${username}`,{
    method:"PUT",
    headers:{
      "Content-Type":"application/json"
    },
    credentials:"include",
    body:JSON.stringify(updates)
  });

  const result = await res.json();

  if(!res.ok){
    throw new Error(data.message || "Failed to update user");
  }

  return result.data;
}


// LOGIN
window.login = async function login() {

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify({ username, password })
  });

  console.log("Login status:", res.status);   // DEBUG

  if (!res.ok) {
    alert("Invalid login");
    return;
  }

const result = await res.json();
const user = result.data;

sessionStorage.setItem("username", user.username);
sessionStorage.setItem("role", user.role);

  window.location.href = "index.html";

}
// LOGOUT
window.logout = async function logout(){

  await fetch("/api/logout", { 
    method: "POST", 
    credentials: "include"
  });

  sessionStorage.clear();

  window.location.replace ("login.html");

}


/* ===========================
 ADMIN USER MANAGEMENT
=========================== */

// Load Users
async function loadUsers() {

  const users = await getUsers();

  renderUsers(users);

}

//USER PROFILE

async function loadUserProfile() {
  try {
    const res = await fetch("/api/session", {
      credentials: "include"
    });

    if (!res.ok) return;

    const result = await res.json();
    const user = result.data;
    const box = document.getElementById("userProfile");

if(box){
  box.textContent = `👤 ${user.username}`;
}
  } catch (err) {
    console.error(err);
  }
}

if(document.getElementById("userProfile")){
  window.addEventListener("DOMContentLoaded", loadUserProfile);
}


/* ===========================
   ADD USER
=========================== */

async function addUser() {

  const username = document.getElementById("newUsername").value;
  const password = document.getElementById("newPassword").value;
  const role = document.getElementById("newRole").value;

	if (!username || !password) {
  alert("Please enter username and password");
  return;
}
try{

    await createUser({
      username, password, role
    });

    alert("User created");

    loadUsers();

  }catch(err){

    alert(err.message);

  }
}

/* ===========================
   DELETE USER
=========================== */

async function deleteUser(username) {

  if(!confirm(`Delete ${username}?`)){
    return;
  }

  try{
    await removeUser(username);

    alert("User deleted");

    loadUsers();

  }catch(err){
    alert(err.message);
  }
}


/* ===========================
   USERS RENDER
=========================== */

function renderUsers(users) {

  const table = document.getElementById("usersTable");

  if (!table) return;

  table.innerHTML = "";

  users.forEach(user => {

    const row = `
      <tr>
        <td>${user.username}</td>
<td>
${user.role === "admin"
 ? '<span class="badge admin-badge">Admin</span>'
 : '<span class="badge user-badge">User</span>'}
</td>

	<td>
		<button onclick="editUser('${user.username}')"><span class="badge user-badge">Edit User</span></button>

	    <button onclick="resetPassword('${user.username}')"><span class="badge admin-badge">Reset Password</span></button>

		<button onclick="deleteUser('${user.username}')"><span class="badge admin-badge">Delete</span></button>
   </td>
      </tr>
    `;

    table.innerHTML += row;

  });

}

/* ===========================
  RESET PASSWORD
=========================== */

async function resetPassword(username) {

  const newPassword = prompt("Enter new password:");

  if (!newPassword) return;

  try{
    await updateUser(username,{
      password:newPassword
    });

    alert("Password reset successfully");

  }catch(err){
    alert(err.message);
  }
}


// DISPLAY LOGGED USER
function displayUser() {

  const username = sessionStorage.getItem("username");

  const el = document.getElementById("currentUser");

  if (el) el.textContent = username;
}

/* ===========================
   ADMIN CHECK
=========================== */

async function checkAdmin(){

  try{
    const res = await fetch("/api/session",{
      credentials:"include"
    });

    if(!res.ok){
      window.location.href = "login.html";
      return;
    }

const result = await res.json();
const user = result.data;

    if(user.role !== "admin"){
      alert("Access restricted to admin");
      window.location.href = "index.html";
    }

  }catch(err){
    window.location.href = "login.html";
  }
}


/* ===========================
   SEARCH USER
=========================== */

async function searchUsers() {

  const search = document.getElementById("userSearch").value.toLowerCase();

  const users = await getUsers();

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search)
  );

  renderUsers(filtered);

}

/* ===========================
   EDIT USER
=========================== */

async function editUser(username){

  const newRole = prompt(
    "Enter role (admin or user):"
  );

  if(!newRole) return;

  const roleLower = newRole.toLowerCase();

  if(roleLower !== "admin" && roleLower !== "user"){
    alert("Invalid role");
    return;
  }

  try{
    await updateUser(username,{
      role:roleLower
    });

    alert("Role updated");

    loadUsers();

  }catch(err){
    alert(err.message);
  }
}


/* ===========================
   SIGN UP
=========================== */

async function signup() {
  const username = document.getElementById("signupUsername").value.trim();
  const password = document.getElementById("signupPassword").value.trim();

  if (!username || !password) {
    return alert("Enter username and password");
  }

  try {
const res = await fetch("/api/signup",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        username,
        password
      })
    });

    const data = await res.json();

    if(!res.ok){
      alert(data.message);
      return;
    }
    
    alert("Account created successfully!");
    window.location.href = "login.html";

  } catch (err) {
    console.error(err);
    alert("Signup failed");
  }
}

/* ===========================
   FORGOT PASSWORD
=========================== */

async function forgotPassword(){

const username = prompt("Enter your username");

const users = await getUsers();

const user = users.find(u => u.username === username);

if(!user){
alert("User not found");
return;
}

const newPass = prompt("Enter new password");

if(!newPass) return;

await updateUser(username,{
  password:newPass
});

alert("Password reset successfully");
}

/* ===========================
   CHECK SESSION
=========================== */

async function checkSession(){

  try{
    const res = await fetch("/api/session",{
      credentials:"include"
    });

    if(!res.ok){
      window.location.href = "login.html";
    }

  }catch(err){
    window.location.href = "login.html";
  }
}


/* ===========================
   AUTO LOGOUT SYSTEM
=========================== */

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 mins

function resetSessionTimer() {
  sessionStorage.setItem("lastActivity", Date.now());
}

function checkSessionTimeout() {

  const lastActivity = sessionStorage.getItem("lastActivity");

  if (!lastActivity) return;

  const now = Date.now();
  const timePassed = now - lastActivity;

  if (timePassed > SESSION_TIMEOUT) {

    alert("Session expired. Please login again.");

    logout();
  }
}

//START SESSION

function startSessionMonitor() {

  resetSessionTimer();

  document.addEventListener("click", resetSessionTimer);
  document.addEventListener("keypress", resetSessionTimer);
  document.addEventListener("mousemove", resetSessionTimer);

  setInterval(checkSessionTimeout, 10 * 1000); // check every 10 seconds
}

// CHECK AUTH

async function checkAuth(){

  try{

    const res = await fetch("/api/session", {
      credentials: "include"
    });

    if(!res.ok){
          sessionStorage.clear();
      window.location.replace("login.html");
      
      return false;
    }

    return true;

  }catch(err){
        sessionStorage.clear();
    window.location.replace("login.html");
    return false;
  }
}


// INIT USERS

async function initUsersPage(){

  await checkAuth();
  await checkAdmin();
  await loadUsers();
}

document.addEventListener("keydown", function(e){
  if(e.key === "Enter"){ 
    const loginForm = document.getElementById("loginform");
    if(loginForm){
      e.preventDefault();
      login();
    }
  }
});

const protectedPages = [
  "index.html",
  "students.html",
  "settings.html",
  "registered-students.html",
  "Holidays.html",
  "attendance.html",
  "users.html"
];

const currentPage =
  window.location.pathname.split("/").pop();


document.addEventListener(
  "DOMContentLoaded",
  async () => {

    // ONLY protect secured pages
    if(!protectedPages.includes(currentPage)){
      return;
    }

    const ok = await checkAuth();

    if(!ok){
      return;
    }

    startSessionMonitor();

    // Load profile
    if(typeof loadUserProfile === "function"){
      loadUserProfile();
    }

    // Dashboard
    if(typeof renderDashboard === "function"){
      renderDashboard();
    }

    // Attendance
    if(typeof loadAttendance === "function"){
      loadAttendance();
    }

    // Holiday checker
    const dateInput =
      document.getElementById("datePicker");

    if(dateInput){

      dateInput.addEventListener(
        "change",
        checkHolidayWarning
      );

      checkHolidayWarning();
    }
  }
);

//INIT HOLIDAY PAGE
async function initHolidayPage(){
  await checkAuth();
  await loadHolidays();
}