// ADD USER
async function getUsers(){

  const res = await fetch("/api/users",{
    credentials:"include"
  });

  return await res.json();
}

//SAVE USERS
async function saveUsers(users){

  await fetch("/api/users",{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    credentials:"include",
    body:JSON.stringify(users)
  });

}

// LOGIN
async function login() {

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

  const data = await res.json();

  console.log("Login data:", data);  // DEBUG

  sessionStorage.setItem("username", data.username);
  sessionStorage.setItem("role", data.role);

  window.location.href = "index.html";

}
// LOGOUT
async function logout(){

  await fetch("/api/logout", { 
    method: "POST", 
    credentials: "include"
  });

  window.location.replace ("login.html");

}

//
// ADMIN USER MANAGEMENT
//

// Load Users
async function loadUsers() {

  const users = await getUsers();

  renderUsers(users);

}

// Add User
async function addUser() {

  const username = document.getElementById("newUsername").value;
  const password = document.getElementById("newPassword").value;
  const role = document.getElementById("newRole").value;

	if (!username || !password) {
  alert("Please enter username and password");
  return;
}
  const users = await getUsers();

  if (users.some(u => u.username === username)) {
    alert("Username already exists");
    return;
  }

  users.push({ username, password, role });

  await saveUsers(users);

  loadUsers();

}

// Delete User
async function deleteUser(username) {

  let users = await getUsers();

  users = users.filter(u => u.username !== username);
 
  await saveUsers(users);

  loadUsers();

}

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

// Reset Password
async function resetPassword(username) {

  const newPassword = prompt("Enter new password:");

  if (!newPassword) return;

  const users = await getUsers();

  const user = users.find(u => u.username === username);

  if (user) {
    user.password = newPassword;
    await saveUsers(users);
    alert("Password reset successfully");
  }

}

// DISPLAY LOGGED USER
function displayUser() {

  const username = sessionStorage.getItem("username");

  const el = document.getElementById("currentUser");

  if (el) el.textContent = username;
}

function checkAdmin() {
  const role = sessionStorage.getItem("role");

  if (role !== "admin") {
    alert("Access restricted to admin");
    window.location.href = "index.html";
  }
}

async function searchUsers() {

  const search = document.getElementById("userSearch").value.toLowerCase();

  const users = await getUsers();

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search)
  );

  renderUsers(filtered);

}

async function editUser(username){

const users = await getUsers();

const user = users.find(u => u.username === username);

if(!user) return;

const newRole = prompt("Enter role (admin or user):", user.role);

if(!newRole) return;

const roleLower = newRole.toLowerCase();
	
if(newRole !== "admin" && newRole !== "user"){
alert("Invalid role");
return;
}

user.role = roleLower;

saveUsers(users);

loadUsers();

}

async function signup(){

const username = document.getElementById("signupUsername").value.trim();
const password = document.getElementById("signupPassword").value;
  
if(!username || !password){
alert("Please fill all fields");
return;
}

const users = await getUsers();

if(users.some(u => u.username === username)){
alert("Username already exists");
return;
}
  users.push({
    username: username,
    password: password,
    role: "user"
  });

saveUsers(users);

alert("Account created successfully!");

window.location.href = "login.html";

}

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

user.password = await hashPassword(newPass);

saveUsers(users);

alert("Password reset successfully");
}

async function checkSession(){

  const res = await fetch("/api/students", {
    credentials: "include"
  });

  if(res.status === 401){
    window.location.href = "login.html";
  }

}

/* ===========================
   AUTO LOGOUT SYSTEM
=========================== */

const SESSION_TIMEOUT = 15 * 60 * 1000; // 5s

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

function startSessionMonitor() {

  resetSessionTimer();

  document.addEventListener("click", resetSessionTimer);
  document.addEventListener("keypress", resetSessionTimer);
  document.addEventListener("mousemove", resetSessionTimer);

  setInterval(checkSessionTimeout, 10 * 1000); // check every 10 seconds
}

async function checkAuth(){

  try{

    const res = await fetch("/api/session", {
      credentials: "include"
    });

    if(!res.ok){
      window.location.replace("login.html");
    }

  }catch(err){

    window.location.replace("login.html");

  }

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

	