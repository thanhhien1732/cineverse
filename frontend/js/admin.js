(function () {
  "use strict";

  var staff = window.CineverseStaff;
  var holder;
  var redirectUrl;

  function showMessage(message, type) {
    var element = holder.querySelector("[data-staff-message]");
    if (!element) {
      return;
    }
    element.textContent = message || "";
    element.className = "staff-form-message" + (type ? " is-" + type : "");
  }

  function getQuery() {
    var query = new URLSearchParams(window.location.search);
    return { redirect: query.get("redirect") || "" };
  }

  function renderAuthenticated(admin) {
    holder.innerHTML = '' +
      '<div class="staff-card-heading"><p class="eyebrow">CINEVERSE OPERATIONS</p><h1>Cổng kiểm soát vé</h1><p>Phiên làm việc đã sẵn sàng.</p></div>' +
      '<div class="staff-admin-profile"><span>' + staff.escapeHtml(String(admin.fullName || "CV").charAt(0).toUpperCase()) + '</span><div><strong>' + staff.escapeHtml(admin.fullName) + '</strong><small>' + staff.escapeHtml(admin.email) + '</small></div></div>' +
      '<div class="staff-form-actions"><a class="btn btn-primary btn-block" href="' + staff.escapeHtml(redirectUrl) + '">Mở màn hình kiểm soát vé</a><button class="btn btn-ghost btn-block" type="button" data-staff-logout>Đăng xuất</button></div>';
    holder.querySelector("[data-staff-logout]").addEventListener("click", function () {
      staff.logout();
      render();
    });
  }

  function renderCreateAdmin() {
    holder.innerHTML = '' +
      '<div class="staff-card-heading"><p class="eyebrow">CINEVERSE OPERATIONS</p><h1>Khởi tạo tài khoản quản trị</h1><p>Thiết lập tài khoản vận hành đầu tiên cho cổng kiểm soát vé.</p></div>' +
      '<form class="staff-form" data-staff-create novalidate>' +
        '<label class="field"><span>Họ và tên nhân viên</span><input type="text" name="fullName" autocomplete="name" required></label>' +
        '<label class="field"><span>Email nhân viên</span><input type="email" name="email" autocomplete="username" required></label>' +
        '<label class="field"><span>Mật khẩu</span><input type="password" name="password" autocomplete="new-password" required></label>' +
        '<label class="field"><span>Xác nhận mật khẩu</span><input type="password" name="confirmPassword" autocomplete="new-password" required></label>' +
        '<p class="staff-form-message" data-staff-message></p>' +
        '<button class="btn btn-primary btn-block" type="submit">Tạo tài khoản quản trị</button>' +
      '</form>';
    holder.querySelector("[data-staff-create]").addEventListener("submit", function (event) {
      var form = event.currentTarget;
      var result;
      event.preventDefault();
      result = staff.createInitialAdmin({
        fullName: form.fullName.value,
        email: form.email.value,
        password: form.password.value,
        confirmPassword: form.confirmPassword.value
      });
      if (!result.ok) {
        showMessage(result.error, "error");
        return;
      }
      window.location.replace(redirectUrl);
    });
  }

  function renderLogin() {
    holder.innerHTML = '' +
      '<div class="staff-card-heading"><p class="eyebrow">CINEVERSE OPERATIONS</p><h1>Đăng nhập nhân viên</h1><p>Xác thực tài khoản để truy cập cổng kiểm soát vé.</p></div>' +
      '<form class="staff-form" data-staff-login-form novalidate>' +
        '<label class="field"><span>Email nhân viên</span><input type="email" name="email" autocomplete="username" required></label>' +
        '<label class="field"><span>Mật khẩu</span><input type="password" name="password" autocomplete="current-password" required></label>' +
        '<p class="staff-form-message" data-staff-message></p>' +
        '<button class="btn btn-primary btn-block" type="submit">Đăng nhập</button>' +
      '</form>';
    holder.querySelector("[data-staff-login-form]").addEventListener("submit", function (event) {
      var form = event.currentTarget;
      var result;
      event.preventDefault();
      result = staff.login(form.email.value, form.password.value);
      if (!result.ok) {
        showMessage(result.error, "error");
        return;
      }
      window.location.replace(redirectUrl);
    });
  }

  function render() {
    var admin = staff.getCurrentAdmin();
    if (admin) {
      renderAuthenticated(admin);
      return;
    }
    if (!staff.hasAdmin()) {
      renderCreateAdmin();
      return;
    }
    renderLogin();
  }

  document.addEventListener("DOMContentLoaded", function () {
    var query = getQuery();
    holder = document.querySelector("[data-staff-login]");
    redirectUrl = staff.getSafeRedirect(query.redirect, "verify.html");
    render();
  });
}());
