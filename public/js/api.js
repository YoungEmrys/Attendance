console.log("API.js Loaded");

const API = {

  async request(url, options = {}) {

    const res = await fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      ...options
    });

    let data;

    try {
      data = await res.json();
    } catch {
      data = {
        success: false,
        message: "Invalid server response"
      };
    }

    if (!res.ok) {
      throw new Error(
        data.message || "Request failed"
      );
    }

    return data.data;
  },

  /* =========================
     STUDENTS
  ========================= */

  getStudents() {
    return this.request("/api/students");
  },

  addStudent(student) {
    return this.request("/api/students", {
      method: "POST",
      body: JSON.stringify(student)
    });
  },

  updateStudent(id, student) {
    return this.request(`/api/students/${id}`, {
      method: "PUT",
      body: JSON.stringify(student)
    });
  },

  deleteStudent(id) {
    return this.request(`/api/students/${id}`, {
      method: "DELETE"
    });
  },

  /* =========================
     ATTENDANCE
  ========================= */

  getAttendance() {
    return this.request("/api/attendance");
  },

  saveAttendance(attendance) {
    return this.request("/api/attendance", {
      method: "POST",
      body: JSON.stringify({attendance})
  });
  },

  /* =========================
     USERS
  ========================= */

  getUsers() {
    return this.request("/api/users");
  },

  createUser(user) {
    return this.request("/api/users", {
      method: "POST",
      body: JSON.stringify(user)
    });
  },

  updateUser(username, updates) {
    return this.request(`/api/users/${username}`, {
      method: "PUT",
      body: JSON.stringify(updates)
    });
  },

  deleteUser(username) {
    return this.request(`/api/users/${username}`, {
      method: "DELETE"
    });
  },

  /* =========================
     AUTH
  ========================= */

  login(credentials) {
    return this.request("/api/login", {
      method: "POST",
      body: JSON.stringify(credentials)
    });
  },

  logout() {
    return this.request("/api/logout", {
      method: "POST"
    });
  },

  getSession() {
    return this.request("/api/session");
  },

  signup(data) {
    return this.request("/api/signup", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  /* =========================
     HOLIDAYS
  ========================= */

  getHolidays() {
    return this.request("/api/holidays");
  },

  createHoliday(holiday) {
    return this.request("/api/holidays", {
      method: "POST",
      body: JSON.stringify(holiday)
    });
  },

  deleteHoliday(date) {
    return this.request(`/api/holidays/${date}`, {
      method: "DELETE"
    });
  }

};