(function () {
  "use strict";

  var cv = window.Cineverse;
  var holder;
  var query;
  var redirectUrl;

  function getInitials(name) {
    return String(name || "CV").trim().split(/\s+/).slice(0, 2).map(function (part) {
      return part.charAt(0).toUpperCase();
    }).join("") || "CV";
  }

  function getTodayInputValue() {
    var today = new Date();
    return today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
  }

  function noticeMarkup() {
    if (query.notice === "login-required") {
      return '<div class="auth-notice"><span>' + cv.icon("lock", 19) + '</span><p>Vui lòng xác thực tài khoản trước khi thanh toán.</p></div>';
    }
    return "";
  }

  function formField(label, name, type, placeholder, options) {
    var settings = options || {};
    return '<label class="field' + (settings.wide ? ' field-wide' : '') + '"><span>' + label + '</span><input type="' + type + '" name="' + name + '" placeholder="' + placeholder + '"' + (settings.autocomplete ? ' autocomplete="' + settings.autocomplete + '"' : '') + (settings.required === false ? '' : ' required') + (settings.min ? ' min="' + settings.min + '"' : '') + (settings.max ? ' max="' + settings.max + '"' : '') + '>' + (settings.help ? '<small>' + settings.help + '</small>' : '') + '</label>';
  }

  function renderGuest(activeTab) {
    var tab = activeTab === "register" ? "register" : "login";
    holder.innerHTML = '' +
      '<div class="auth-layout">' +
        '<aside class="auth-benefits">' +
          '<p class="eyebrow">MEMBER EXPERIENCE</p><h2>Điện ảnh.<br>Đúng chất riêng.</h2>' +
          '<div class="auth-benefit-list">' +
            '<div><span>' + cv.icon("ticket", 20) + '</span><p><strong>Vé điện tử</strong><small>Truy cập mã vé gần nhất ngay trong tài khoản hội viên.</small></p></div>' +
            '<div><span>' + cv.icon("star", 20) + '</span><p><strong>Quyền lợi hội viên</strong><small>Nhận thông tin về suất chiếu đặc biệt và các chương trình ưu đãi.</small></p></div>' +
            '<div><span>' + cv.icon("shield", 20) + '</span><p><strong>Hồ sơ cá nhân</strong><small>Quản lý thông tin liên hệ và ảnh đại diện của bạn.</small></p></div>' +
          '</div>' +
        '</aside>' +
        '<section class="auth-card">' + noticeMarkup() +
          '<div class="auth-tabs" role="tablist" aria-label="Chọn hình thức xác thực">' +
            '<button class="auth-tab' + (tab === "login" ? ' is-active' : '') + '" type="button" data-auth-tab="login" role="tab" aria-selected="' + String(tab === "login") + '">Đăng nhập</button>' +
            '<button class="auth-tab' + (tab === "register" ? ' is-active' : '') + '" type="button" data-auth-tab="register" role="tab" aria-selected="' + String(tab === "register") + '">Đăng ký</button>' +
          '</div>' +
          '<div data-auth-form></div>' +
        '</section>' +
      '</div>';
    holder.querySelectorAll("[data-auth-tab]").forEach(function (button) {
      button.addEventListener("click", function () {
        renderGuest(button.getAttribute("data-auth-tab"));
      });
    });
    renderAuthForm(tab);
  }

  function renderAuthForm(tab) {
    var formHolder = holder.querySelector("[data-auth-form]");
    if (tab === "register") {
      formHolder.innerHTML = '' +
        '<form class="auth-form" data-register-form novalidate>' +
          '<div class="auth-form-heading"><h2>Tạo tài khoản</h2><p>Đăng ký hội viên CINEVERSE để bắt đầu.</p></div>' +
          '<div class="form-grid">' +
            formField("Họ và tên", "fullName", "text", "Nguyễn Văn An", { wide: true, autocomplete: "name" }) +
            formField("Email", "email", "email", "an@example.com", { autocomplete: "email" }) +
            formField("Số điện thoại", "phone", "tel", "0912345678", { autocomplete: "tel" }) +
            formField("Ngày sinh", "dateOfBirth", "date", "", { autocomplete: "bday", min: "1900-01-01", max: getTodayInputValue()}) +
            formField("Mật khẩu", "password", "password", "Tối thiểu 6 ký tự", { autocomplete: "new-password" }) +
            formField("Xác nhận mật khẩu", "confirmPassword", "password", "Nhập lại mật khẩu", { autocomplete: "new-password" }) +
          '</div>' +
          '<label class="terms-check"><input type="checkbox" name="remember" checked><span>Duy trì trạng thái đăng nhập trên thiết bị này.</span></label>' +
          '<label class="terms-check"><input type="checkbox" name="terms" required><span>Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật của CINEVERSE.</span></label>' +
          '<button class="btn btn-primary btn-block" type="submit">Tạo tài khoản ' + cv.icon("arrowRight", 18) + '</button>' +
        '</form>';
      formHolder.querySelector("[data-register-form]").addEventListener("submit", handleRegister);
    } else {
      formHolder.innerHTML = '' +
        '<form class="auth-form" data-login-form novalidate>' +
          '<div class="auth-form-heading"><h2>Chào mừng trở lại</h2><p>Đăng nhập tài khoản CINEVERSE của bạn.</p></div>' +
          '<div class="form-grid auth-login-grid">' +
            formField("Email", "email", "email", "an@example.com", { wide: true, autocomplete: "email" }) +
            formField("Mật khẩu", "password", "password", "Nhập mật khẩu", { wide: true, autocomplete: "current-password" }) +
          '</div>' +
          '<label class="terms-check"><input type="checkbox" name="remember"><span>Duy trì trạng thái đăng nhập trên thiết bị này.</span></label>' +
          '<button class="btn btn-primary btn-block" type="submit">Đăng nhập ' + cv.icon("arrowRight", 18) + '</button>' +
          '<p class="auth-helper">Chưa có tài khoản? <button type="button" data-open-register>Đăng ký ngay</button></p>' +
        '</form>';
      formHolder.querySelector("[data-login-form]").addEventListener("submit", handleLogin);
      formHolder.querySelector("[data-open-register]").addEventListener("click", function () {
        renderGuest("register");
      });
    }
  }

  function handleRegister(event) {
    event.preventDefault();
    var form = event.currentTarget;
    if (!form.terms.checked) {
      cv.showToast("Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật.", "error");
      return;
    }
    var result = cv.registerUser({
      fullName: form.fullName.value,
      email: form.email.value,
      phone: form.phone.value,
      dateOfBirth: form.dateOfBirth.value,
      password: form.password.value,
      confirmPassword: form.confirmPassword.value
    }, form.remember.checked);
    if (!result.ok) {
      cv.showToast(result.error, "error");
      return;
    }
    cv.showToast("Tạo tài khoản thành công.", "success");
    window.setTimeout(function () {
      window.location.href = redirectUrl;
    }, 420);
  }

  function handleLogin(event) {
    event.preventDefault();
    var form = event.currentTarget;
    var result = cv.loginUser(form.email.value, form.password.value, form.remember.checked);
    if (!result.ok) {
      cv.showToast(result.error, "error");
      return;
    }
    cv.showToast("Đăng nhập thành công.", "success");
    window.setTimeout(function () {
      window.location.href = redirectUrl;
    }, 360);
  }

  function resizeAvatar(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type)) {
        reject(new Error("Vui lòng chọn một tệp hình ảnh hợp lệ."));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        reject(new Error("Ảnh đại diện không được vượt quá 5 MB."));
        return;
      }
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error("Không thể đọc tệp hình ảnh đã chọn.")); };
      reader.onload = function () {
        var image = new Image();
        image.onerror = function () { reject(new Error("Không thể xử lý tệp hình ảnh đã chọn.")); };
        image.onload = function () {
          var maxSize = 420;
          var scale = Math.min(1, maxSize / Math.max(image.width, image.height));
          var width = Math.max(1, Math.round(image.width * scale));
          var height = Math.max(1, Math.round(image.height * scale));
          var canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          var context = canvas.getContext("2d");
          context.fillStyle = "#101522";
          context.fillRect(0, 0, width, height);
          context.drawImage(image, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.84));
        };
        image.src = String(reader.result || "");
      };
      reader.readAsDataURL(file);
    });
  }

  function bindAvatarActions() {
    var input = holder.querySelector("[data-avatar-input]");
    var removeButton = holder.querySelector("[data-avatar-remove]");
    if (input) {
      input.addEventListener("change", function () {
        var file = input.files && input.files[0];
        if (!file) {
          return;
        }
        resizeAvatar(file).then(function (dataUrl) {
          var result = cv.updateCurrentUserAvatar(dataUrl);
          if (!result.ok) {
            cv.showToast(result.error, "error");
            return;
          }
          cv.showToast("Ảnh đại diện đã được cập nhật.", "success");
          renderProfile();
        }).catch(function (error) {
          cv.showToast(error.message, "error");
        });
      });
    }
    if (removeButton) {
      removeButton.addEventListener("click", function () {
        var result = cv.updateCurrentUserAvatar("");
        if (!result.ok) {
          cv.showToast(result.error, "error");
          return;
        }
        cv.showToast("Ảnh đại diện đã được xóa.", "success");
        renderProfile();
      });
    }
  }

  function renderProfile() {
    var user = cv.getCurrentUser();
    var ticket = cv.getActiveTicket();
    var wallet = cv.getMemberWallet(user.id);
    var vouchers = cv.getAvailableBirthdayVouchers(user.id);
    var age = cv.calculateAge(user.dateOfBirth);
    var fallback = '<span>' + cv.escapeHtml(getInitials(user.fullName)) + '</span>';
    var recentTransactions = wallet.transactions.slice(0, 5);
    holder.innerHTML = '' +
      '<div class="profile-layout">' +
        '<aside class="profile-card">' +
          '<div class="profile-avatar">' + cv.getAvatarMarkup(user, fallback, "profile-avatar-image") + '</div>' +
          '<div class="profile-avatar-actions"><label class="btn btn-ghost btn-small" for="avatar-upload">' + cv.icon("camera", 16) + ' Đổi ảnh<input id="avatar-upload" type="file" accept="image/png,image/jpeg,image/webp" data-avatar-input hidden></label>' +
          (user.avatarDataUrl ? '<button class="btn btn-text btn-small" type="button" data-avatar-remove>' + cv.icon("trash", 15) + ' Xóa ảnh</button>' : '') + '</div>' +
          '<h2>' + cv.escapeHtml(user.fullName) + '</h2><p>' + cv.escapeHtml(user.email) + '</p>' +
          '<dl class="profile-mini-list"><div><dt>Hạng hội viên</dt><dd>' + cv.escapeHtml(wallet.tierLabel) + '</dd></div><div><dt>Điểm khả dụng</dt><dd>' + wallet.pointsAvailable + ' điểm</dd></div><div><dt>Tuổi hiện tại</dt><dd>' + (age === null ? "Chưa xác định" : age + " tuổi") + '</dd></div><div><dt>Ngày sinh</dt><dd>' + cv.formatDateOfBirth(user.dateOfBirth) + '</dd></div><div><dt>Vé gần nhất</dt><dd>' + (ticket && ticket.code ? cv.escapeHtml(ticket.code) : "Chưa có") + '</dd></div></dl>' +
          '<button class="btn btn-ghost btn-block" type="button" data-logout>' + cv.icon("logout", 18) + ' Đăng xuất</button>' +
        '</aside>' +
        '<section class="profile-content">' +
          '<div class="profile-heading"><div><p class="eyebrow">HỒ SƠ HỘI VIÊN</p><h1>Thông tin tài khoản</h1></div><span>' + cv.icon("shield", 20) + ' Đã xác minh</span></div>' +
          '<div class="member-wallet-panel" tabindex="0" aria-describedby="member-wallet-tooltip">' +
          '<div class="member-wallet-head">' +
            '<span>' + cv.icon("crown", 24) + '</span>' +
            '<div>' +
              '<p class="eyebrow">CINEVERSE REWARDS</p>' +
              '<h3>' + cv.escapeHtml(wallet.tierLabel) + '</h3>' +
            '</div>' +
          '</div>' +

          '<div class="member-wallet-stats">' +
            '<div>' +
              '<small>ĐIỂM KHẢ DỤNG</small>' +
              '<strong>' + wallet.pointsAvailable + '</strong>' +
            '</div>' +
            '<div>' +
              '<small>TỔNG ĐIỂM TÍCH LŨY</small>' +
              '<strong>' + wallet.lifetimePoints + '</strong>' +
            '</div>' +
            '<div>' +
              '<small>VOUCHER KHẢ DỤNG</small>' +
              '<strong>' + vouchers.length + '</strong>' +
            '</div>' +
          '</div>' +

            '<p class="member-wallet-tooltip" id="member-wallet-tooltip" role="tooltip">' +
              'Điểm CINEVERSE được sử dụng để quy đổi vé và sản phẩm đang bán trong hệ thống. Điểm không có giá trị quy đổi thành tiền mặt.' +
            '</p>' +
          '</div>' +
          (vouchers.length ? '<div class="profile-voucher-list"><h3>Voucher của bạn</h3>' + vouchers.map(function (voucher) { return '<article><span>' + cv.icon("gift", 18) + '</span><div><strong>' + cv.escapeHtml(voucher.label) + '</strong><small>Miễn phí 01 vé xem phim · Sử dụng 01 lần</small></div></article>'; }).join("") + '</div>' : '') +
          
          '<form class="profile-form" data-profile-form novalidate>' +
            '<div class="form-grid">' +
              '<label class="field field-wide"><span>Email</span><input type="email" value="' + cv.escapeHtml(user.email) + '" disabled></label>' +
              '<label class="field field-wide"><span>Họ và tên</span><input type="text" name="fullName" value="' + cv.escapeHtml(user.fullName) + '" autocomplete="name" required></label>' +
              '<label class="field"><span>Số điện thoại</span><input type="tel" name="phone" value="' + cv.escapeHtml(user.phone) + '" autocomplete="tel" required></label>' +
              '<label class="field profile-locked-field birthday-field" tabindex="0">' +
                '<span>Ngày sinh</span>' +
                '<div class="locked-input">' +
                  '<input type="text" value="' + cv.escapeHtml(cv.formatDateOfBirth(user.dateOfBirth)) + '" disabled>' +
                  '<i>' + cv.icon("lock", 16) + '</i>' +
                '</div>' +
                '<div class="profile-status birthday-tooltip" role="tooltip">' +
                  '<span>' + cv.icon("birthday", 22) + '</span>' +
                  '<div>' +
                    '<strong>Thông tin cá nhân đã xác thực</strong>' +
                    '<p>Ngày sinh được khóa sau khi đăng ký. Liên hệ quầy dịch vụ khi cần điều chỉnh thông tin.</p>' +
                  '</div>' +
                '</div>' +
              '</label>' +
            '</div>' +
            '<button class="btn btn-primary" type="submit">' + cv.icon("edit", 18) + ' Lưu thay đổi</button>' +
          '</form>' +
          (recentTransactions.length ? '<div class="member-history"><h3>Lịch sử quyền lợi</h3>' + recentTransactions.map(function (entry) { return '<div><span>' + cv.icon(entry.type === "birthday-voucher-issued" ? "gift" : "star", 16) + '</span><p><strong>' + cv.escapeHtml(entry.label || "Cập nhật hội viên") + '</strong><small>' + new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(entry.createdAt)) + (entry.earnedPoints ? ' · +' + entry.earnedPoints + ' điểm' : '') + (entry.redeemedPoints ? ' · -' + entry.redeemedPoints + ' điểm' : '') + '</small></p></div>'; }).join("") + '</div>' : '') +
          '<div class="profile-actions">' +
            (ticket && ticket.code ? '<a class="btn btn-ghost" href="ticket.html">' + cv.icon("ticket", 18) + ' Mở vé gần nhất</a>' : '<a class="btn btn-ghost" href="showtimes.html">' + cv.icon("ticket", 18) + ' Đặt vé ngay</a>') +
            (redirectUrl !== "index.html" && redirectUrl !== "auth.html" ? '<a class="btn btn-primary" href="' + cv.escapeHtml(redirectUrl) + '">Tiếp tục thanh toán ' + cv.icon("arrowRight", 18) + '</a>' : '') +
          '</div>' +
        '</section>' +
      '</div>';
    bindAvatarActions();
    holder.querySelector("[data-logout]").addEventListener("click", function () {
      cv.logoutUser();
      cv.showToast("Bạn đã đăng xuất.", "success");
      renderGuest("login");
    });
    holder.querySelector("[data-profile-form]").addEventListener("submit", function (event) {
      event.preventDefault();
      var form = event.currentTarget;
      var result = cv.updateCurrentUserProfile({ fullName: form.fullName.value, phone: form.phone.value });
      if (!result.ok) { cv.showToast(result.error, "error"); return; }
      cv.showToast("Đã cập nhật hồ sơ tài khoản.", "success");
      renderProfile();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    holder = document.querySelector("[data-auth-page]");
    query = cv.parseQuery();
    redirectUrl = cv.getSafeRedirect(query.redirect, "index.html");
    document.querySelector("[data-auth-shield]").innerHTML = cv.icon("shield", 24);
    if (cv.getCurrentUser()) {
      renderProfile();
    } else {
      renderGuest(query.tab === "register" ? "register" : "login");
    }
  });
}());
