const API = {

  async request(url, options = {}) {
    const res = await fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      ...options
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  },

  async getStudents() {
    const res = await this.request("/api/students");

    // IMPORTANT: return ONLY data array
    return res.data || res;
  },

  async addStudent(student) {
    return this.request("/api/students", {
      method: "POST",
      body: JSON.stringify(student)
    });
  },

  async updateStudent(id, data) {
    return this.request(`/api/students/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  },

  async deleteStudent(id) {
    return this.request(`/api/students/${id}`, {
      method: "DELETE"
    });
  },

  async getAttendance() {
    return this.request("/api/attendance");
  },

  async saveAttendance(attendance) {
    return this.request("/api/attendance", {
      method: "POST",
      body: JSON.stringify({ attendance })
    });
  },

  async getUsers() {
    return this.request("/api/users");
  },

  async saveUsers(users) {
    return this.request("/api/users", {
      method: "POST",
      body: JSON.stringify(users)
    });
  }
};