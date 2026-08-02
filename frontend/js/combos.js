(function () {
  "use strict";

  var cv = window.Cineverse;
  var data = window.CINEVERSE_DATA;
  var booking = cv.getBooking();

  function getQuantity(comboId) {
    return Number(booking.combos[comboId] || 0);
  }

  function setQuantity(comboId, quantity) {
    var combos = Object.assign({}, booking.combos);
    if (quantity <= 0) {
      delete combos[comboId];
    } else {
      combos[comboId] = Math.min(quantity, 9);
    }
    booking = cv.saveBooking({ combos: combos });
    renderCombos();
    renderSummary();
  }

  function renderCombos() {
    var holder = document.querySelector("[data-combo-grid]");
    holder.innerHTML = data.combos.map(function (combo) {
      var quantity = getQuantity(combo.id);
      return '' +
        '<article class="combo-card' + (quantity > 0 ? ' is-selected' : '') + '">' +
          '<div class="combo-image"><img src="' + combo.image + '" alt="Combo ' + cv.escapeHtml(combo.name) + '"><span>' + cv.escapeHtml(combo.badge) + '</span></div>' +
          '<div class="combo-body"><h3>' + cv.escapeHtml(combo.name) + '</h3><p>' + cv.escapeHtml(combo.description) + '</p><div class="combo-footer"><strong>' + cv.formatCurrency(combo.price) + '</strong><div class="quantity-control"><button type="button" data-minus="' + combo.id + '" aria-label="Giảm số lượng">' + cv.icon("minus", 16) + '</button><b>' + quantity + '</b><button type="button" data-plus="' + combo.id + '" aria-label="Tăng số lượng">' + cv.icon("plus", 16) + '</button></div></div></div>' +
        '</article>';
    }).join("");
    holder.querySelectorAll("[data-minus]").forEach(function (button) {
      button.addEventListener("click", function () {
        setQuantity(button.getAttribute("data-minus"), getQuantity(button.getAttribute("data-minus")) - 1);
      });
    });
    holder.querySelectorAll("[data-plus]").forEach(function (button) {
      button.addEventListener("click", function () {
        setQuantity(button.getAttribute("data-plus"), getQuantity(button.getAttribute("data-plus")) + 1);
      });
    });
  }

  function renderSummary() {
    var holder = document.querySelector("[data-combo-summary]");
    var totals = cv.calculateTotals(booking);
    var lines = cv.getSelectedComboLines(booking);
    holder.innerHTML = '' +
      '<div class="summary-title"><span>' + cv.icon("ticket", 18) + '</span><div><small>ĐƠN HÀNG</small><strong>' + booking.seats.length + ' ghế đã chọn</strong></div></div>' +
      '<dl class="summary-list"><div><dt>Tiền vé</dt><dd>' + cv.formatCurrency(totals.seatSubtotal) + '</dd></div><div><dt>Phí dịch vụ</dt><dd>' + cv.formatCurrency(totals.serviceFee) + '</dd></div><div><dt>Combo</dt><dd>' + cv.formatCurrency(totals.comboSubtotal) + '</dd></div><div class="summary-total"><dt>Tổng cộng</dt><dd>' + cv.formatCurrency(totals.total) + '</dd></div></dl>' +
      (lines.length ? '<div class="summary-combos">' + lines.map(function (line) { return '<p><span>' + line.quantity + ' × ' + cv.escapeHtml(line.name) + '</span><b>' + cv.formatCurrency(line.subtotal) + '</b></p>'; }).join("") + '</div>' : '<p class="summary-empty">Bạn có thể bỏ qua combo và tiếp tục thanh toán.</p>') +
      '<a class="btn btn-primary btn-block" href="checkout.html">Tiếp tục thanh toán ' + cv.icon("arrowRight", 18) + '</a>';
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!cv.requireBookingFields(["movieId", "cinemaId", "date", "showtime", "seats"], "seats.html")) {
      return;
    }
    booking = cv.getBooking();
    cv.renderSteps(3);
    renderCombos();
    renderSummary();
  });
}());
