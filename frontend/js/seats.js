(function () {
  "use strict";

  var cv = window.Cineverse;
  var data = window.CINEVERSE_DATA;
  var booking = cv.getBooking();
  var MAX_SELECTION = 8;


  function getGuardianRequirement() {
    var movie = cv.getMovie(booking.movieId);
    var user = cv.getCurrentUser();
    var verification = user && movie ? cv.getAgeVerification(movie, booking.date, user) : null;
    return {
      required: Boolean(verification && verification.guardianRequired),
      minimumAdmissions: verification && verification.guardianRequired ? 2 : 1
    };
  }

  function buildSeed() {
    var text = booking.movieId + booking.cinemaId + booking.date + booking.showtime;
    var seed = 0;
    var index;
    for (index = 0; index < text.length; index += 1) {
      seed += text.charCodeAt(index) * (index + 3);
    }
    return seed;
  }

  function getReservedSeatIds() {
    var standardIds = [];
    var rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
    var seed = buildSeed();
    var index;
    for (index = 0; index < 22; index += 1) {
      var row = rows[(seed + index * 5) % rows.length];
      var number = ((seed + index * 7) % 12) + 1;
      var id = row + number;
      if (standardIds.indexOf(id) === -1) {
        standardIds.push(id);
      }
    }
    standardIds.push("J1-J2");
    standardIds.push("J9-J10");
    return standardIds;
  }

  function seatType(row) {
    if (["G", "H", "I"].indexOf(row) !== -1) {
      return "vip";
    }
    return "standard";
  }

  function createSeat(row, number, reserved) {
    var id = row + number;
    var type = seatType(row);
    return {
      id: id,
      label: id,
      row: row,
      number: number,
      type: type,
      price: type === "vip" ? data.ticketPrices.vip : data.ticketPrices.standard,
      reserved: reserved.indexOf(id) !== -1
    };
  }

  function createCoupleSeat(startNumber, reserved) {
    var id = "J" + startNumber + "-J" + (startNumber + 1);
    return {
      id: id,
      label: id,
      row: "J",
      number: startNumber,
      type: "couple",
      price: data.ticketPrices.couple,
      reserved: reserved.indexOf(id) !== -1
    };
  }

  function isSelected(seatId) {
    return booking.seats.some(function (seat) {
      return seat.id === seatId;
    });
  }

  function renderSeatButton(seat) {
    var classes = "seat seat-" + seat.type;
    if (seat.reserved) {
      classes += " is-reserved";
    }
    if (isSelected(seat.id)) {
      classes += " is-selected";
    }
    return '<button type="button" class="' + classes + '" data-seat-id="' + seat.id + '" data-seat-row="' + seat.row + '" data-seat-number="' + seat.number + '" data-seat-type="' + seat.type + '" data-seat-price="' + seat.price + '"' + (seat.reserved ? ' disabled' : '') + ' aria-label="Ghế ' + seat.label + '"><span>' + seat.label.replace("-J", "-") + '</span></button>';
  }

  function renderSeatMap() {
    var holder = document.querySelector("[data-seat-map]");
    var reserved = getReservedSeatIds();
    var rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
    var html = '<div class="screen"><span>MÀN HÌNH</span></div><div class="seat-map">';
    rows.forEach(function (row) {
      html += '<div class="seat-row"><b>' + row + '</b><div class="seat-row-inner">';
      var number;
      for (number = 1; number <= 12; number += 1) {
        if (number === 4 || number === 10) {
          html += '<i class="seat-aisle"></i>';
        }
        html += renderSeatButton(createSeat(row, number, reserved));
      }
      html += '</div><b>' + row + '</b></div>';
    });
    html += '<div class="seat-row seat-row-couple"><b>J</b><div class="seat-row-inner">';
    var pair;
    for (pair = 1; pair <= 11; pair += 2) {
      if (pair === 5 || pair === 9) {
        html += '<i class="seat-aisle"></i>';
      }
      html += renderSeatButton(createCoupleSeat(pair, reserved));
    }
    html += '</div><b>J</b></div></div>';
    holder.innerHTML = html;
    holder.querySelectorAll("[data-seat-id]").forEach(function (button) {
      button.addEventListener("click", function () {
        toggleSeat({
          id: button.getAttribute("data-seat-id"),
          label: button.getAttribute("data-seat-id"),
          row: button.getAttribute("data-seat-row"),
          number: Number(button.getAttribute("data-seat-number")),
          type: button.getAttribute("data-seat-type"),
          price: Number(button.getAttribute("data-seat-price"))
        });
      });
    });
  }

  function toggleSeat(seat) {
    var exists = isSelected(seat.id);
    if (exists) {
      booking = cv.saveBooking({
        seats: booking.seats.filter(function (selectedSeat) {
          return selectedSeat.id !== seat.id;
        })
      });
    } else {
      if (booking.seats.length >= MAX_SELECTION) {
        cv.showToast("Bạn chỉ có thể chọn tối đa " + MAX_SELECTION + " ghế trong một lần đặt.", "error");
        return;
      }
      booking = cv.saveBooking({ seats: booking.seats.concat([seat]) });
    }
    renderSeatMap();
    renderSummary();
  }

  function renderContext() {
    var movie = cv.getMovie(booking.movieId);
    var cinema = cv.getCinema(booking.cinemaId);
    document.querySelector("[data-seat-context]").innerHTML = '' +
      '<div><p class="eyebrow">CHỌN VỊ TRÍ PHÙ HỢP</p><h1>Chọn ghế ngồi</h1><p>' + cv.escapeHtml(movie.title) + ' · ' + cv.escapeHtml(cinema.name) + ' · ' + cv.formatDate(booking.date) + ' · ' + cv.escapeHtml(booking.showtime) + '</p></div>' +
      '<a class="text-link" href="showtimes.html">' + cv.icon("arrowLeft", 16) + ' Đổi suất chiếu</a>';
  }

  function renderSummary() {
    var holder = document.querySelector("[data-seat-summary]");
    var totals = cv.calculateTotals(booking);
    var requirement = getGuardianRequirement();
    var admissionCount = cv.getAdmissionCount(booking);
    var canContinue = admissionCount >= requirement.minimumAdmissions;
    var seatList = booking.seats.length ? booking.seats.map(function (seat) {
      return '<span class="selected-seat-pill">' + cv.escapeHtml(seat.label) + '</span>';
    }).join("") : '<p class="summary-empty">Chưa chọn ghế nào.</p>';
    var guardianNote = requirement.required ? '<div class="guardian-seat-note"><span>' + cv.icon("shield", 17) + '</span><p><strong>Yêu cầu vé người giám hộ</strong><small>Khách dưới 13 tuổi xem phim K cần mua tối thiểu 2 vé: một vé cho người xem và một vé cho người giám hộ đi cùng.</small></p></div>' : '';
    holder.innerHTML = '' +
      '<div class="summary-title"><span>' + cv.icon("ticket", 18) + '</span><div><small>GHẾ ĐÃ CHỌN</small><strong>' + admissionCount + ' vé · tối đa ' + MAX_SELECTION + ' lựa chọn</strong></div></div>' +
      guardianNote +
      '<div class="selected-seat-list">' + seatList + '</div>' +
      '<dl class="summary-list"><div><dt>Tiền vé</dt><dd>' + cv.formatCurrency(totals.seatSubtotal) + '</dd></div><div><dt>Phí dịch vụ</dt><dd>' + cv.formatCurrency(totals.serviceFee) + '</dd></div><div class="summary-total"><dt>Tạm tính</dt><dd>' + cv.formatCurrency(totals.total) + '</dd></div></dl>' +
      '<a class="btn btn-primary btn-block' + (!canContinue ? ' is-disabled' : '') + '" href="' + (canContinue ? 'combos.html' : '#') + '" data-continue>Chọn combo ' + cv.icon("arrowRight", 18) + '</a>';
    if (!canContinue) {
      holder.querySelector("[data-continue]").addEventListener("click", function (event) {
        event.preventDefault();
        cv.showToast(requirement.required ? "Vui lòng chọn thêm một ghế cho người giám hộ đi cùng." : "Vui lòng chọn ít nhất một ghế trước khi tiếp tục.", "error");
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!cv.requireBookingFields(["movieId", "cinemaId", "date", "showtime"], "showtimes.html")) {
      return;
    }
    booking = cv.getBooking();
    cv.renderSteps(2);
    renderContext();
    renderSeatMap();
    renderSummary();
  });
}());
