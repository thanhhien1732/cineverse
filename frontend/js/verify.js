(function () {
  "use strict";

  var cv = window.Cineverse;
  var staff = window.CineverseStaff;
  var detector = null;
  var stream = null;
  var scanFrame = null;
  var video = null;
  var statusHolder = null;
  var verifySection = null;
  var ticketInput = null;
  var qrUpload = null;
  var scannerSupport = null;

  function setStatus(message, type) {
    if (!statusHolder) { return; }
    statusHolder.textContent = message || "";
    statusHolder.className = "scanner-status" + (type ? " is-" + type : "");
    statusHolder.hidden = !message;
  }

  function setScannerAlert(message, type) {
    var holder = document.querySelector("[data-secure-context-note]");
    if (!holder || !scannerSupport) { return; }
    scannerSupport.hidden = !message;
    if (!message) {
      holder.innerHTML = "";
      holder.className = "secure-context-note";
      return;
    }
    holder.className = "secure-context-note " + (type === "warning" ? "is-insecure" : "is-secure");
    holder.innerHTML = '<span>' + cv.icon(type === "warning" ? "lock" : "shield", 18) + '</span><p><strong>' + (type === "warning" ? "Trình quét tự động chưa sẵn sàng" : "Trạng thái hệ thống") + '</strong><small>' + cv.escapeHtml(message) + '</small></p>';
  }


  function setAutomaticScannerEnabled(enabled) {
    var startButton = document.querySelector("[data-start-camera]");
    var stopButton = document.querySelector("[data-stop-camera]");
    var uploadLabel = document.querySelector("label[for=qr-image-upload]");
    var manualDisclosure = document.querySelector(".verify-manual-disclosure");
    if (startButton) { startButton.disabled = !enabled; }
    if (stopButton) { stopButton.disabled = !enabled; }
    if (qrUpload) { qrUpload.disabled = !enabled; }
    if (uploadLabel) {
      uploadLabel.classList.toggle("is-disabled", !enabled);
      uploadLabel.setAttribute("aria-disabled", String(!enabled));
    }
    if (!enabled && manualDisclosure) { manualDisclosure.open = true; }
  }

  function stopCamera() {
    var viewport = document.querySelector("[data-scanner-viewport]");
    if (scanFrame) {
      window.cancelAnimationFrame(scanFrame);
      scanFrame = null;
    }
    if (stream) {
      stream.getTracks().forEach(function (track) { track.stop(); });
      stream = null;
    }
    if (video) {
      video.srcObject = null;
    }
    if (viewport) {
      viewport.classList.remove("is-live");
    }
  }

  function setVerifiedMode(enabled) {
    if (verifySection) {
      verifySection.classList.toggle("has-verified-ticket", Boolean(enabled));
    }
  }

  function setResultMode(enabled) {
    if (verifySection) {
      verifySection.classList.toggle("has-validation-result", Boolean(enabled));
    }
  }

  function scrollResultIntoView() {
    var result = document.querySelector("[data-verify-result]");
    if (!result || typeof result.scrollIntoView !== "function") { return; }
    window.setTimeout(function () {
      result.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function renderEmpty() {
    document.querySelector("[data-verify-result]").innerHTML = '' +
      '<div class="verify-empty"><span>' + cv.icon("qr", 30) + '</span><h2>Sẵn sàng kiểm soát vé</h2><p>Thông tin vé sẽ hiển thị sau khi xác minh.</p></div>';
  }

  function resetScannerWorkspace(autoStart) {
    stopCamera();
    setVerifiedMode(false);
    setResultMode(false);
    renderEmpty();
    if (ticketInput) { ticketInput.value = ""; }
    if (qrUpload) { qrUpload.value = ""; }
    if (!window.isSecureContext) {
      setAutomaticScannerEnabled(false);
      setScannerAlert("Không thể khởi tạo camera trên kết nối hiện tại. Vui lòng nhập mã vé hoặc liên hệ quản trị hệ thống.", "warning");
      setStatus("Vui lòng nhập mã vé để tiếp tục.", "info");
      return;
    }
    if (!detector) {
      setAutomaticScannerEnabled(false);
      setScannerAlert("Tính năng quét tự động chưa khả dụng trên thiết bị này. Vui lòng nhập mã vé để tiếp tục.", "warning");
      setStatus("Sẵn sàng kiểm tra mã vé thủ công.", "info");
      return;
    }
    setAutomaticScannerEnabled(true);
    setScannerAlert("", "info");
    setStatus("", "");
    if (autoStart) {
      window.setTimeout(startCamera, 120);
    }
  }

  function getPaymentLabel(payment, booking) {
    var method = (payment && payment.method) || booking.paymentMethod || "card";
    return method === "momo" ? "MoMo" : "Thẻ ngân hàng";
  }

  function renderInvalid(query) {
    setVerifiedMode(false);
    setResultMode(true);
    document.querySelector("[data-verify-result]").innerHTML = '' +
      '<article class="verify-result-card is-invalid"><div class="verify-result-head"><span>' + cv.icon("lock", 24) + '</span><div><p class="eyebrow">KHÔNG TÌM THẤY VÉ</p><h2>Mã vé không hợp lệ</h2></div></div><p>Không tìm thấy vé tương ứng với mã <strong>' + cv.escapeHtml(query) + '</strong>. Vui lòng kiểm tra và thử lại.</p><div class="verify-result-actions"><button class="btn btn-ghost" type="button" data-clear-result>' + cv.icon("scan", 17) + ' Tiếp tục kiểm soát vé</button></div></article>';
    document.querySelector("[data-clear-result]").addEventListener("click", function () { resetScannerWorkspace(false); });
    scrollResultIntoView();
  }

  function renderRejected(ticket) {
    var booking = ticket.booking || {};
    setVerifiedMode(true);
    setResultMode(true);
    document.querySelector("[data-verify-result]").innerHTML = '' +
      '<article class="verify-result-card is-invalid"><div class="verify-result-head"><span>' + cv.icon("lock", 24) + '</span><div><p class="eyebrow">VÉ KHÔNG CÒN HIỆU LỰC</p><h2>Từ chối vào rạp</h2></div><b class="verification-status-badge is-rejected">TỪ CHỐI</b></div>' +
        '<div class="verified-ticket-code"><small>MÃ VÉ</small><strong>' + cv.escapeHtml(ticket.code || "") + '</strong></div>' +
        '<dl class="verify-ticket-grid"><div><dt>Trạng thái</dt><dd>Không hợp lệ</dd></div><div><dt>Lý do</dt><dd>' + cv.escapeHtml(ticket.verificationStatus || "invalid") + '</dd></div><div><dt>Ngày chiếu</dt><dd>' + cv.formatDate(booking.date) + '</dd></div><div><dt>Suất chiếu</dt><dd>' + cv.escapeHtml(booking.showtime || "") + '</dd></div></dl>' +
        '<div class="verify-result-actions"><button class="btn btn-primary" type="button" data-next-scan>' + cv.icon("scan", 17) + ' Kiểm soát vé tiếp theo</button></div>' +
      '</article>';
    document.querySelector("[data-next-scan]").addEventListener("click", function () { resetScannerWorkspace(true); });
    scrollResultIntoView();
  }

  function renderTicket(ticket) {
    var booking = ticket.booking || {};
    var movie = cv.getMovie(booking.movieId);
    var cinema = cv.getCinema(booking.cinemaId);
    var seats = cv.expandAdmissionSeats(booking.seats || []).map(function (seat) { return seat.label; }).join(", ");
    var age = ticket.ageVerification || {};
    var guardian = age.guardian;
    var totals = ticket.totals || {};
    var payment = ticket.payment || {};
    var status = ticket.verificationStatus || "valid";
    if (status !== "valid") {
      renderRejected(ticket);
      return;
    }
    setVerifiedMode(true);
    setResultMode(true);
    document.querySelector("[data-verify-result]").innerHTML = '' +
      '<article class="verify-result-card is-valid">' +
        '<div class="verify-result-head"><span>' + cv.icon("check", 24) + '</span><div><p class="eyebrow">VÉ HỢP LỆ</p><h2>Cho phép vào rạp</h2></div><b class="verification-status-badge">ĐÃ XÁC MINH</b></div>' +
        '<div class="verified-ticket-code"><small>MÃ VÉ</small><strong>' + cv.escapeHtml(ticket.code) + '</strong></div>' +
        '<dl class="verify-ticket-grid">' +
          '<div><dt>Phim</dt><dd>' + cv.escapeHtml(movie ? movie.title : booking.movieId) + '</dd></div>' +
          '<div><dt>Rạp</dt><dd>' + cv.escapeHtml(cinema ? cinema.name : booking.cinemaId) + '</dd></div>' +
          '<div><dt>Ngày chiếu</dt><dd>' + cv.formatDate(booking.date) + '</dd></div>' +
          '<div><dt>Suất chiếu</dt><dd>' + cv.escapeHtml(booking.showtime || "") + '</dd></div>' +
          '<div><dt>Phòng</dt><dd>' + cv.escapeHtml(booking.hall || "") + '</dd></div>' +
          '<div><dt>Ghế</dt><dd>' + cv.escapeHtml(seats) + '</dd></div>' +
          '<div><dt>Phân loại</dt><dd>' + cv.escapeHtml(age.rating || (movie && movie.rating) || "") + '</dd></div>' +
          '<div><dt>Số lượng vé</dt><dd>' + cv.getAdmissionCount(booking) + '</dd></div>' +
          '<div><dt>Thanh toán</dt><dd>Đã thanh toán · ' + cv.escapeHtml(getPaymentLabel(payment, booking)) + '</dd></div>' +
          '<div><dt>Mã giao dịch</dt><dd>' + cv.escapeHtml(payment.transactionId || "Đã ghi nhận") + '</dd></div>' +
        '</dl>' +
        (guardian ? '<div class="verify-guardian-note"><span>' + cv.icon("shield", 18) + '</span><p><strong>Kiểm tra người giám hộ tại cổng</strong><small>' + cv.escapeHtml(guardian.fullName) + ' · ' + cv.escapeHtml(guardian.relationshipLabel || "Người giám hộ") + ' · Ghế ' + cv.escapeHtml(guardian.seatId || "") + '</small></p></div>' : '') +
        '<footer><span>' + cv.icon("ticket", 17) + ' Tổng thanh toán: ' + cv.formatCurrency(totals.total || 0) + '</span><small>Phát hành: ' + new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(ticket.registeredAt || ticket.purchasedAt || Date.now())) + '</small></footer>' +
        '<div class="verify-result-actions"><button class="btn btn-primary" type="button" data-next-scan>' + cv.icon("scan", 17) + ' Kiểm soát vé tiếp theo</button></div>' +
      '</article>';
    document.querySelector("[data-next-scan]").addEventListener("click", function () { resetScannerWorkspace(true); });
    scrollResultIntoView();
  }

  function verifyValue(value) {
    var text = String(value || "").trim();
    var refresh = window.CineverseSync ? window.CineverseSync.refresh() : Promise.resolve(false);
    if (!text) {
      setStatus("Vui lòng nhập hoặc quét mã vé.", "error");
      return;
    }
    setStatus("Đang đối chiếu thông tin vé...", "info");
    refresh.then(function () {
      var ticket = cv.findTicketForVerification(text);
      if (!ticket) {
        renderInvalid(text);
        setStatus("Không tìm thấy vé tương ứng.", "error");
        return;
      }
      stopCamera();
      renderTicket(ticket);
      setStatus(ticket.verificationStatus && ticket.verificationStatus !== "valid" ? "Vé không còn hiệu lực." : "Đã xác minh vé thành công.", ticket.verificationStatus && ticket.verificationStatus !== "valid" ? "error" : "success");
    });
  }

  function createDetector() {
    if (!window.isSecureContext || !("BarcodeDetector" in window)) {
      return Promise.resolve(null);
    }
    if (typeof window.BarcodeDetector.getSupportedFormats === "function") {
      return window.BarcodeDetector.getSupportedFormats().then(function (formats) {
        return formats.indexOf("qr_code") !== -1 ? new window.BarcodeDetector({ formats: ["qr_code"] }) : null;
      }).catch(function () { return null; });
    }
    try {
      return Promise.resolve(new window.BarcodeDetector({ formats: ["qr_code"] }));
    } catch (error) {
      return Promise.resolve(null);
    }
  }

  function scanVideoFrame() {
    if (!stream || !detector || !video || video.readyState < 2) {
      if (stream) { scanFrame = window.requestAnimationFrame(scanVideoFrame); }
      return;
    }
    detector.detect(video).then(function (codes) {
      if (codes && codes[0] && codes[0].rawValue) {
        stopCamera();
        verifyValue(codes[0].rawValue);
        return;
      }
      if (stream) { scanFrame = window.requestAnimationFrame(scanVideoFrame); }
    }).catch(function () {
      if (stream) { scanFrame = window.requestAnimationFrame(scanVideoFrame); }
    });
  }

  function startCamera() {
    if (!window.isSecureContext || !detector) {
      setStatus("Trình quét tự động chưa sẵn sàng. Vui lòng nhập mã vé để tiếp tục.", "error");
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus("Không thể truy cập camera trên thiết bị này. Vui lòng nhập mã vé để tiếp tục.", "error");
      return;
    }
    stopCamera();
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false }).then(function (cameraStream) {
      stream = cameraStream;
      video.srcObject = stream;
      document.querySelector("[data-scanner-viewport]").classList.add("is-live");
      return video.play();
    }).then(function () {
      setStatus("Camera đang hoạt động. Căn mã QR vào giữa khung hình.", "success");
      scanVideoFrame();
    }).catch(function () {
      stopCamera();
      setStatus("Không thể mở camera. Vui lòng kiểm tra quyền camera và thử lại.", "error");
    });
  }

  function scanImage(file) {
    if (!file) { return; }
    if (!window.isSecureContext || !detector) {
      setStatus("Không thể đọc ảnh QR trên thiết bị này. Vui lòng nhập mã vé để tiếp tục.", "error");
      return;
    }
    createImageBitmap(file).then(function (bitmap) {
      return detector.detect(bitmap);
    }).then(function (codes) {
      if (!codes || !codes[0] || !codes[0].rawValue) {
        setStatus("Không tìm thấy mã QR trong ảnh đã chọn.", "error");
        return;
      }
      verifyValue(codes[0].rawValue);
    }).catch(function () {
      setStatus("Không thể đọc ảnh QR đã chọn.", "error");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var admin = staff.requireAdmin("verify.html" + window.location.search);
    var query;
    var initials;
    if (!admin) {
      return;
    }
    query = cv.parseQuery();
    video = document.querySelector("[data-scanner-video]");
    statusHolder = document.querySelector("[data-scanner-status]");
    verifySection = document.querySelector("[data-verify-section]");
    ticketInput = document.querySelector("[name=ticketCode]");
    qrUpload = document.querySelector("[data-qr-upload]");
    scannerSupport = document.querySelector("[data-scanner-support]");
    initials = String(admin.fullName || "CV").split(/\s+/).map(function (part) { return part.charAt(0); }).join("").slice(0, 2).toUpperCase();
    document.querySelector("[data-gate-operator]").textContent = admin.fullName;
    document.querySelector("[data-gate-operator-avatar]").textContent = initials || "CV";
    document.querySelector("[data-gate-logout]").addEventListener("click", function () {
      stopCamera();
      staff.logout();
      window.location.replace("admin.html");
    });
    document.querySelector("[data-verify-icon]").innerHTML = cv.icon("scan", 23);
    document.querySelector("[data-verify-empty-icon]").innerHTML = cv.icon("qr", 30);
    createDetector().then(function (instance) {
      detector = instance;
      resetScannerWorkspace(false);
    });
    document.querySelector("[data-start-camera]").addEventListener("click", startCamera);
    document.querySelector("[data-stop-camera]").addEventListener("click", function () { stopCamera(); setStatus("Camera đã dừng.", "info"); });
    qrUpload.addEventListener("change", function (event) { scanImage(event.target.files && event.target.files[0]); });
    document.querySelector("[data-verify-form]").addEventListener("submit", function (event) { event.preventDefault(); verifyValue(event.currentTarget.ticketCode.value); });
    if (query.ticket) {
      ticketInput.value = query.ticket;
      verifyValue(query.ticket);
    }
    window.addEventListener("beforeunload", stopCamera);
  });
}());
