(function () {
  "use strict";

  var cv = window.Cineverse;

  function hashCode(text) {
    var hash = 2166136261;
    var index;
    for (index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return hash >>> 0;
  }

  function barcodeMarkup(code) {
    var seed = hashCode(code);
    var html = '<div class="ticket-barcode" aria-label="Mã vạch kiểm soát vé">';
    var index;
    for (index = 0; index < 54; index += 1) {
      var width = ((seed >> (index % 16)) & 1) ? 3 : 1;
      var gap = ((seed + index * 7) % 3) + 1;
      html += '<i style="width:' + width + 'px;margin-right:' + gap + 'px"></i>';
    }
    html += '</div>';
    return html;
  }

  function qrMarkup(ticket) {
    return '<img class="ticket-qr-image" src="' + cv.escapeHtml(ticket.qrAsset) + '" alt="Mã QR vé điện tử ' + cv.escapeHtml(ticket.code) + '">';
  }

  function formatIssuedAt(value) {
    var date = new Date(value || Date.now());
    return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
  }

  function getPaymentLabel(ticket, booking) {
    var method = (ticket.payment && ticket.payment.method) || booking.paymentMethod || "card";
    return method === "momo" ? "MoMo" : "Thẻ ngân hàng";
  }

  function renderEmpty(message) {
    document.querySelector("[data-ticket-page]").innerHTML = '<section class="empty-ticket section"><div class="container"><div class="empty-state large"><span>' + cv.icon("ticket", 34) + '</span><h1>Chưa có mã vé hợp lệ</h1><p>' + cv.escapeHtml(message || "Hãy hoàn thành một lượt đặt vé để nhận mã xác nhận CINEVERSE.") + '</p><a class="btn btn-primary" href="movies.html">Chọn phim ngay ' + cv.icon("arrowRight", 18) + '</a></div></div></section>';
  }

  function getTicketContext(ticket) {
    if (!ticket || !ticket.booking || !ticket.code) { return null; }
    var booking = ticket.booking;
    var movie = cv.getMovie(booking.movieId);
    var cinema = cv.getCinema(booking.cinemaId);
    if (!movie || !cinema || !booking.date || !booking.showtime || !booking.hall || !Array.isArray(booking.seats) || booking.seats.length === 0) { return null; }
    booking.customer = booking.customer || { fullName: "Khách CINEVERSE", phone: "", email: "" };
    booking.customer.fullName = booking.customer.fullName || "Khách CINEVERSE";
    return { booking: booking, movie: movie, cinema: cinema, totals: ticket.totals || cv.calculateTotals(booking) };
  }

  function guardianMarkup(ageVerification) {
    var guardian = ageVerification && ageVerification.guardian;
    if (!guardian || !ageVerification.guardianRequired) { return ""; }
    return '<div class="ticket-guardian"><small>NGƯỜI GIÁM HỘ ĐI CÙNG · VÉ ĐÃ XÁC NHẬN</small><strong>' + cv.escapeHtml(guardian.fullName) + '</strong><span>' + cv.escapeHtml(guardian.relationshipLabel || "Người giám hộ") + ' · ' + cv.escapeHtml(guardian.phone) + ' · Ghế ' + cv.escapeHtml(guardian.seatId || "Chưa chỉ định") + '</span></div>';
  }

  function renderTicket(ticket, context) {
    var booking = context.booking;
    var movie = context.movie;
    var cinema = context.cinema;
    var totals = context.totals;
    var comboLines = cv.getSelectedComboLines(booking);
    var policy = cv.getRatingPolicy(movie.rating);
    var ageVerification = ticket.ageVerification || {};
    var verifiedAge = typeof ageVerification.verifiedAge === "number" ? ageVerification.verifiedAge : null;
    var admissionSeats = cv.expandAdmissionSeats(booking.seats);
    var admissionCount = admissionSeats.length;
    var seatLabels = admissionSeats.map(function (seat) { return seat.label; }).join(", ");
    var guardianRequired = Boolean(ageVerification.guardianRequired && ageVerification.guardian);
    var gateNotice = guardianRequired ? "Vé K dành cho người xem dưới 13 tuổi: người giám hộ phải đi cùng và sử dụng ghế " + ageVerification.guardian.seatId + "." : "Xuất trình QR tại cổng kiểm soát vé. Mang giấy tờ tùy thân khi rạp yêu cầu đối chiếu.";
    var membership = ticket.membership || {};
    var paymentLabel = getPaymentLabel(ticket, booking);
    document.querySelector("[data-ticket-page]").innerHTML = '' +
      '<section class="ticket-hero"><div class="container ticket-heading"><p class="hero-kicker">ĐẶT VÉ THÀNH CÔNG</p><h1>Vé điện tử đã sẵn sàng</h1><p>Lưu mã vé hoặc in vé trước khi đến rạp.</p></div></section>' +
      '<section class="section ticket-section"><div class="container ticket-layout">' +
        '<article class="ticket-card cinema-ticket">' +
          '<header class="ticket-brandbar"><div class="ticket-brandmark"><img src="assets/logo.svg" alt="CINEVERSE"><span>CINEMA ADMISSION TICKET</span></div><strong>ADMIT ' + admissionCount + '</strong></header>' +
          '<div class="ticket-card-body">' +
            '<div class="ticket-poster"><img src="' + movie.poster + '" alt="Poster phim ' + cv.escapeHtml(movie.title) + '"></div>' +
            '<div class="ticket-info"><p class="eyebrow">CINEVERSE E-TICKET · ' + cv.escapeHtml(policy.code) + '</p><h2>' + cv.escapeHtml(movie.title) + '</h2>' +
              '<div class="ticket-primary-row"><div><small>NGÀY CHIẾU</small><strong>' + cv.formatDate(booking.date) + '</strong></div><div><small>SUẤT CHIẾU</small><strong>' + cv.escapeHtml(booking.showtime) + '</strong></div><div><small>PHÒNG</small><strong>' + cv.escapeHtml(booking.hall) + '</strong></div><div><small>GHẾ</small><strong>' + cv.escapeHtml(seatLabels) + '</strong></div></div>' +
              '<div class="ticket-meta-grid"><div><small>Rạp chiếu</small><strong>' + cv.escapeHtml(cinema.name) + '</strong></div><div><small>Định dạng</small><strong>' + cv.escapeHtml(booking.format) + '</strong></div><div><small>Khách hàng</small><strong>' + cv.escapeHtml(booking.customer.fullName) + '</strong></div><div><small>Xác thực tuổi</small><strong>' + cv.escapeHtml(policy.code) + (verifiedAge === null ? '' : ' · ' + verifiedAge + ' tuổi') + '</strong></div><div><small>Thanh toán</small><strong>Đã thanh toán · ' + cv.escapeHtml(paymentLabel) + '</strong></div></div>' + guardianMarkup(ageVerification) +
            '</div>' +
            '<aside class="ticket-stub"><small class="ticket-stub-label">SCAN AT GATE</small>' + qrMarkup(ticket) + '<strong>' + cv.escapeHtml(ticket.code) + '</strong><dl><div><dt>GHẾ</dt><dd>' + cv.escapeHtml(seatLabels) + '</dd></div><div><dt>PHÒNG</dt><dd>' + cv.escapeHtml(booking.hall) + '</dd></div><div><dt>GIỜ</dt><dd>' + cv.escapeHtml(booking.showtime) + '</dd></div></dl><span>Giữ vé đến hết suất chiếu</span></aside>' +
          '</div>' +
          '<footer class="ticket-terms"><div><strong>' + cv.escapeHtml(ticket.code) + '</strong><span>Phát hành: ' + cv.escapeHtml(formatIssuedAt(ticket.purchasedAt)) + ' · ' + cv.escapeHtml(gateNotice) + '</span></div>' + barcodeMarkup(ticket.code) + '</footer>' +
        '</article>' +
        '<aside class="ticket-side">' +
          '<div class="ticket-note"><span>' + cv.icon("check", 20) + '</span><div><strong>Đã xác nhận</strong><p>' + cv.escapeHtml(gateNotice) + '</p></div></div>' +
          (guardianRequired ? '<div class="ticket-note guardian-ticket-note"><span>' + cv.icon("shield", 20) + '</span><div><strong>Cần người giám hộ tại cổng</strong><p>' + cv.escapeHtml(ageVerification.guardian.fullName) + ' · ' + cv.escapeHtml(ageVerification.guardian.relationshipLabel || "Người giám hộ") + ' · Ghế ' + cv.escapeHtml(ageVerification.guardian.seatId || "Chưa chỉ định") + ' · ' + cv.escapeHtml(ageVerification.guardian.phone) + '</p></div></div>' : '') +
          '<div class="ticket-side-card"><h3>Chi tiết thanh toán</h3><dl class="summary-list"><div><dt>Tiền vé</dt><dd>' + cv.formatCurrency(totals.seatSubtotal) + '</dd></div><div><dt>Combo</dt><dd>' + cv.formatCurrency(totals.comboSubtotal) + '</dd></div><div><dt>Phí dịch vụ</dt><dd>' + cv.formatCurrency(totals.serviceFee) + '</dd></div><div><dt>Phương thức</dt><dd>' + cv.escapeHtml(paymentLabel) + '</dd></div>' + (totals.voucherDiscount ? '<div class="summary-discount"><dt>Voucher sinh nhật</dt><dd>- ' + cv.formatCurrency(totals.voucherDiscount) + '</dd></div>' : '') + (totals.pointsDiscount ? '<div class="summary-discount"><dt>Điểm CINEVERSE</dt><dd>- ' + cv.formatCurrency(totals.pointsDiscount) + '</dd></div>' : '') + '<div class="summary-total"><dt>Tổng cộng</dt><dd>' + cv.formatCurrency(totals.total) + '</dd></div></dl>' + (comboLines.length ? '<div class="ticket-combos">' + comboLines.map(function (line) { return '<p>' + line.quantity + ' × ' + cv.escapeHtml(line.name) + '</p>'; }).join("") + '</div>' : '') + '</div>' +
          ((membership.earnedPoints || membership.redeemedPoints) ? '<div class="ticket-note rewards-ticket-note"><span>' + cv.icon("star", 20) + '</span><div><strong>CINEVERSE Rewards</strong><p>' + (membership.earnedPoints ? '+' + membership.earnedPoints + ' điểm tích lũy' : '') + (membership.earnedPoints && membership.redeemedPoints ? ' · ' : '') + (membership.redeemedPoints ? '-' + membership.redeemedPoints + ' điểm đã sử dụng' : '') + ' · Hạng ' + cv.escapeHtml(membership.tierLabel || 'Member') + '</p></div></div>' : '') +
          '<div class="ticket-actions"><button class="btn btn-ghost btn-block" type="button" data-print-ticket>' + cv.icon("print", 18) + ' In vé xem phim</button><a class="btn btn-primary btn-block" href="index.html">' + cv.icon("home", 18) + ' Về trang chủ</a></div>' +
        '</aside>' +
      '</div></section>';
    document.querySelector("[data-print-ticket]").addEventListener("click", function () { window.print(); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var query = cv.parseQuery();
    var ticket;
    var context;
    cv.renderSteps(5);
    ticket = query.code ? cv.getUserTicketByCode(query.code) : cv.getActiveTicket();
    if (ticket && (!ticket.qrId || !ticket.qrAsset)) { ticket = cv.setActiveTicket(ticket); }
    context = getTicketContext(ticket);
    if (!context) { renderEmpty(ticket ? "Không thể hiển thị vé này. Vui lòng liên hệ quầy dịch vụ CINEVERSE để được hỗ trợ." : "Hãy hoàn thành một lượt đặt vé để nhận mã xác nhận CINEVERSE."); return; }
    renderTicket(ticket, context);
  });
}());
