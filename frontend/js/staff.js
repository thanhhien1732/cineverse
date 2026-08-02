(function () {
  "use strict";

  var STAFF_USERS_KEY = "cineverse.staff-users.v1";
  var STAFF_SESSION_KEY = "cineverse.staff-session.v1";
  var ROLE_GATE_CONTROL_ADMIN = "GATE_CONTROL_ADMIN";

  function readJson(key, fallback, storage) {
    try {
      var target = storage || window.localStorage;
      var raw = target.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value, storage) {
    var target = storage || window.localStorage;
    var raw = JSON.stringify(value);
    target.setItem(key, raw);
    if (target === window.localStorage && window.CineverseSync) {
      window.CineverseSync.persist(key, raw);
    }
  }

  function removeItem(key, storage) {
    var target = storage || window.localStorage;
    try {
      target.removeItem(key);
      if (target === window.localStorage && window.CineverseSync) {
        window.CineverseSync.persist(key, null);
      }
    } catch (error) {
      return false;
    }
    return true;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function deriveHash(value) {
    var text = "cineverse::staff-auth::v1::" + String(value || "");
    var hash = 2166136261;
    var index;
    for (index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return "cv-staff-" + (hash >>> 0).toString(16).padStart(8, "0");
  }

  function getStaffUsers() {
    var users = readJson(STAFF_USERS_KEY, []);
    return Array.isArray(users) ? users : [];
  }

  function saveStaffUsers(users) {
    writeJson(STAFF_USERS_KEY, users || []);
  }

  function hasAdmin() {
    return getStaffUsers().some(function (user) {
      return user.role === ROLE_GATE_CONTROL_ADMIN && user.status === "active";
    });
  }

  function generateId() {
    return "cv-staff-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function validateAdminValues(values) {
    var fullName = String(values.fullName || "").trim();
    var email = normalizeEmail(values.email);
    var password = String(values.password || "");
    if (fullName.length < 2) {
      return "Vui lòng nhập họ và tên nhân viên hợp lệ.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Vui lòng nhập email nhân viên hợp lệ.";
    }
    if (password.length < 10) {
      return "Mật khẩu nhân viên phải có ít nhất 10 ký tự.";
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return "Mật khẩu nhân viên cần có chữ hoa, chữ thường và chữ số.";
    }
    if (password !== values.confirmPassword) {
      return "Mật khẩu xác nhận chưa trùng khớp.";
    }
    return "";
  }

  function createInitialAdmin(values) {
    var error;
    var users;
    var admin;
    if (hasAdmin()) {
      return { ok: false, error: "Tài khoản quản trị ban đầu đã được thiết lập." };
    }
    error = validateAdminValues(values || {});
    if (error) {
      return { ok: false, error: error };
    }
    users = getStaffUsers();
    admin = {
      id: generateId(),
      fullName: String(values.fullName || "").trim(),
      email: normalizeEmail(values.email),
      passwordHash: deriveHash(values.password),
      role: ROLE_GATE_CONTROL_ADMIN,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    users.push(admin);
    saveStaffUsers(users);
    setSession(admin.id);
    return { ok: true, user: admin };
  }

  function setSession(userId) {
    var session = {
      userId: userId,
      signedInAt: new Date().toISOString()
    };
    writeJson(STAFF_SESSION_KEY, session, window.sessionStorage);
    return session;
  }

  function getSession() {
    return readJson(STAFF_SESSION_KEY, null, window.sessionStorage);
  }

  function getCurrentAdmin() {
    var session = getSession();
    if (!session || !session.userId) {
      return null;
    }
    return getStaffUsers().find(function (user) {
      return user.id === session.userId && user.role === ROLE_GATE_CONTROL_ADMIN && user.status === "active";
    }) || null;
  }

  function login(email, password) {
    var normalizedEmail = normalizeEmail(email);
    var admin = getStaffUsers().find(function (user) {
      return normalizeEmail(user.email) === normalizedEmail && user.role === ROLE_GATE_CONTROL_ADMIN && user.status === "active";
    }) || null;
    if (!admin || admin.passwordHash !== deriveHash(password)) {
      return { ok: false, error: "Email hoặc mật khẩu nhân viên chưa chính xác." };
    }
    setSession(admin.id);
    return { ok: true, user: admin };
  }

  function logout() {
    removeItem(STAFF_SESSION_KEY, window.sessionStorage);
  }

  function getSafeRedirect(value, fallback) {
    var candidate = String(value || "").trim();
    var page = candidate.split("?")[0].split("#")[0];
    if (["verify.html", "admin.html"].indexOf(page) === -1) {
      return fallback || "verify.html";
    }
    return candidate;
  }

  function requireAdmin(redirectUrl) {
    var admin = getCurrentAdmin();
    if (admin) {
      return admin;
    }
    var target = getSafeRedirect(redirectUrl || "verify.html", "verify.html");
    window.location.replace("admin.html?redirect=" + encodeURIComponent(target));
    return null;
  }

  window.CineverseStaff = {
    STAFF_USERS_KEY: STAFF_USERS_KEY,
    STAFF_SESSION_KEY: STAFF_SESSION_KEY,
    ROLE_GATE_CONTROL_ADMIN: ROLE_GATE_CONTROL_ADMIN,
    escapeHtml: escapeHtml,
    hasAdmin: hasAdmin,
    createInitialAdmin: createInitialAdmin,
    login: login,
    logout: logout,
    getCurrentAdmin: getCurrentAdmin,
    getSafeRedirect: getSafeRedirect,
    requireAdmin: requireAdmin
  };
}());
