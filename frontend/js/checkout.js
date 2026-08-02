(function () {
  "use strict";

  var cv = window.Cineverse;
  var booking = cv.getBooking();
  var currentUser = null;
  var currentWallet = null;
  var currentVerification = null;
  var rewardSelection = Object.assign({ pointsToRedeem: 0, birthdayVoucherId: "" }, booking.rewards || {});

  function getAdmissionSeats() {
    return cv.expandAdmissionSeats(booking.seats || []);
  }

  function getRewardTotals() {
    return cv.calculateRewardedTotals(booking, currentWallet || cv.getMemberWallet(currentUser && currentUser.id), rewardSelection);
  }

  function renderOrderSummary() {
    var holder = document.querySelector("[data-checkout-summary]");
    var movie = cv.getMovie(booking.movieId);
    var cinema = cv.getCinema(booking.cinemaId);
    var totals = getRewardTotals();
    var comboLines = cv.getSelectedComboLines(booking);
    var policy = cv.getRatingPolicy(movie.rating);
    var admissionSeats = getAdmissionSeats();
    holder.innerHTML = '' +
      '<div class="checkout-movie"><img src="' + movie.poster + '" alt="Poster phim ' + cv.escapeHtml(movie.title) + '"><div><p class="eyebrow">ĐƠN HÀNG CỦA BẠN</p><h3>' + cv.escapeHtml(movie.title) + '</h3><p>' + cv.escapeHtml(cinema.name) + '</p></div></div>' +
      '<dl class="summary-list">' +
        '<div><dt>Phân loại</dt><dd><span class="rating-badge">' + cv.escapeHtml(policy.code) + '</span></dd></div>' +
        '<div><dt>Ngày</dt><dd>' + cv.formatDate(booking.date) + '</dd></div>' +
        '<div><dt>Suất chiếu</dt><dd>' + cv.escapeHtml(booking.showtime) + ' · ' + cv.escapeHtml(booking.format) + '</dd></div>' +
        '<div><dt>Phòng chiếu</dt><dd>' + cv.escapeHtml(booking.hall) + '</dd></div>' +
        '<div><dt>Ghế</dt><dd>' + cv.escapeHtml(admissionSeats.map(function (seat) { return seat.label; }).join(", ")) + '</dd></div>' +
        '<div><dt>Số vé</dt><dd>' + admissionSeats.length + '</dd></div>' +
        (booking.guardianSeatId ? '<div><dt>Ghế người giám hộ</dt><dd>' + cv.escapeHtml(booking.guardianSeatId) + '</dd></div>' : '') +
      '</dl>' +
      (comboLines.length ? '<div class="checkout-lines"><h4>Combo bắp nước</h4>' + comboLines.map(function (line) { return '<p><span>' + line.quantity + ' × ' + cv.escapeHtml(line.name) + '</span><b>' + cv.formatCurrency(line.subtotal) + '</b></p>'; }).join("") + '</div>' : '') +
      '<dl class="summary-list checkout-totals">' +
        '<div><dt>Tiền vé</dt><dd>' + cv.formatCurrency(totals.seatSubtotal) + '</dd></div>' +
        '<div><dt>Combo</dt><dd>' + cv.formatCurrency(totals.comboSubtotal) + '</dd></div>' +
        '<div><dt>Phí dịch vụ</dt><dd>' + cv.formatCurrency(totals.serviceFee) + '</dd></div>' +
        (totals.voucherDiscount ? '<div class="summary-discount"><dt>Voucher sinh nhật</dt><dd>- ' + cv.formatCurrency(totals.voucherDiscount) + '</dd></div>' : '') +
        (totals.pointsDiscount ? '<div class="summary-discount"><dt>Điểm CINEVERSE (' + totals.pointsRedeemed + ')</dt><dd>- ' + cv.formatCurrency(totals.pointsDiscount) + '</dd></div>' : '') +
        '<div class="summary-total"><dt>Tổng thanh toán</dt><dd>' + cv.formatCurrency(totals.total) + '</dd></div>' +
      '</dl>';
    updateMomoPayableAmount();
  }

  function renderAccountPanel() {
    var holder = document.querySelector("[data-checkout-account]");
    currentWallet = cv.getMemberWallet(currentUser.id);
    holder.innerHTML = '' +
      '<div class="checkout-section-heading"><span>' + cv.icon("user", 22) + '</span><div><h2>Tài khoản đặt vé</h2></div></div>' +
      '<div class="checkout-account-card"><div><strong>' + cv.escapeHtml(currentUser.fullName) + '</strong>'+
      '<small class="account-contact account-contact-icons">' +
        '<span>' +
          cv.icon("mail", 14) +
          cv.escapeHtml(currentUser.email) +
        '</span>' +
        '<span>' +
          cv.icon("phone", 14) +
          cv.escapeHtml(currentUser.phone) +
        '</span>' +
      '</small>'
      '</div><a class="text-link" href="auth.html?redirect=checkout.html">Mở hồ sơ ' + cv.icon("arrowRight", 16) + '</a></div>';
  }

  function renderRewardsPanel() {
    var holder = document.querySelector("[data-checkout-rewards]");
    var vouchers;
    var totals;

    currentWallet = cv.getMemberWallet(currentUser.id);
    vouchers = cv.getAvailableBirthdayVouchers(currentUser.id);

    if (
      rewardSelection.birthdayVoucherId &&
      !vouchers.some(function (voucher) {
        return voucher.id === rewardSelection.birthdayVoucherId;
      })
    ) {
      rewardSelection.birthdayVoucherId = "";
    }

    totals = getRewardTotals();

    if (rewardSelection.pointsToRedeem > totals.maxPointsRedeemable) {
      rewardSelection.pointsToRedeem = totals.maxPointsRedeemable;
      totals = getRewardTotals();
    }

    holder.innerHTML = '' +
      '<div class="checkout-section-heading has-context-help" tabindex="0">' +
        '<span>' + cv.icon("gift", 22) + '</span>' +
        '<div class="checkout-heading-copy">' +
          '<div class="checkout-heading-title-row">' +
            '<h2>Quyền lợi hội viên</h2>' +
            checkoutContextHelp(
              "Sử dụng điểm và voucher đang khả dụng cho đơn hàng này.",
              "context-help-heading"
            ) +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="rewards-wallet-card">' +
        '<div>' +
          '<small>HẠNG THÀNH VIÊN</small>' +
          '<strong>' + cv.escapeHtml(currentWallet.tierLabel) + '</strong>' +
        '</div>' +
        '<div>' +
          '<small>ĐIỂM KHẢ DỤNG</small>' +
          '<strong>' + currentWallet.pointsAvailable + '</strong>' +
        '</div>' +
        '<div>' +
          '<small>QUY ĐỔI</small>' +
          '<strong>1 điểm = ' + cv.formatCurrency(cv.POINT_VALUE) + '</strong>' +
        '</div>' +
      '</div>' +

      '<div class="rewards-control-grid">' +
        '<label class="field points-field has-context-help">' +
          '<span class="field-label-row">' +
            '<span>Điểm sử dụng</span>' +
            checkoutContextHelp(
              "Tối đa " +
                totals.maxPointsRedeemable +
                " điểm cho sản phẩm trong đơn hàng. Điểm không quy đổi thành tiền mặt.",
              "context-help-field"
            ) +
          '</span>' +
          '<input type="number" ' +
            'name="pointsToRedeem" ' +
            'min="0" ' +
            'max="' + totals.maxPointsRedeemable + '" ' +
            'step="1" ' +
            'value="' + rewardSelection.pointsToRedeem + '" ' +
            'inputmode="numeric">' +
        '</label>' +

        '<div class="voucher-selector">' +
          '<span>Voucher sinh nhật</span>' +

          (vouchers.length
            ? vouchers.map(function (voucher) {
                var checked = rewardSelection.birthdayVoucherId === voucher.id;

                return '<label class="voucher-option">' +
                  '<input type="checkbox" ' +
                    'name="birthdayVoucher" ' +
                    'value="' + cv.escapeHtml(voucher.id) + '"' +
                    (checked ? ' checked' : '') +
                  '>' +
                  '<span>' +
                    '<strong>' + cv.escapeHtml(voucher.label) + '</strong>' +
                    '<small>Miễn phí 01 vé xem phim · Sử dụng 01 lần</small>' +
                  '</span>' +
                '</label>';
              }).join("")
            : '<p class="reward-empty">Hiện chưa có voucher khả dụng.</p>') +
        '</div>' +
      '</div>';

    holder.querySelectorAll("input[name=birthdayVoucher]").forEach(function (input) {
      input.addEventListener("change", function () {
        holder.querySelectorAll("input[name=birthdayVoucher]").forEach(function (other) {
          if (other !== input) {
            other.checked = false;
          }
        });

        rewardSelection.birthdayVoucherId = input.checked ? input.value : "";

        renderRewardsPanel();
        renderOrderSummary();
      });
    });

    var pointsInput = holder.querySelector("input[name=pointsToRedeem]");

    if (pointsInput) {
      pointsInput.addEventListener("input", function () {
        var next = Math.max(0, Math.floor(Number(pointsInput.value || 0)));

        rewardSelection.pointsToRedeem = Math.min(
          next,
          Number(pointsInput.max || 0)
        );

        pointsInput.value = rewardSelection.pointsToRedeem;

        renderOrderSummary();
      });
    }
  }

  function guardianSeatOptions() {
    return getAdmissionSeats().map(function (seat) {
      return '<option value="' + cv.escapeHtml(seat.id) + '"' + (booking.guardianSeatId === seat.id ? ' selected' : '') + '>Ghế ' + cv.escapeHtml(seat.label) + '</option>';
    }).join("");
  }

  function guardianMarkup() {
    var admissionCount = cv.getAdmissionCount(booking);
    var needsAdditionalTicket = admissionCount < 2;
    return '' +
      '<div class="guardian-panel">' +
        '<div class="guardian-panel-heading"><span>' + cv.icon("shield", 20) + '</span><strong>Thông tin người giám hộ</strong></div>' +
        (needsAdditionalTicket ? '<div class="guardian-ticket-required"><span>' + cv.icon("ticket", 18) + '</span><div><strong>Cần bổ sung vé người giám hộ</strong><p>Đơn hàng hiện có ' + admissionCount + ' vé. Vui lòng chọn thêm ít nhất một ghế cho người giám hộ trước khi thanh toán.</p></div><a class="btn btn-ghost" href="seats.html">Chọn thêm ghế ' + cv.icon("arrowRight", 16) + '</a></div>' : '') +
        '<div class="form-grid guardian-grid">' +
          '<label class="field field-wide"><span>Họ và tên</span><input type="text" name="guardianFullName" autocomplete="name" placeholder="Nguyễn Văn Bình" required></label>' +
          '<label class="field"><span>Quan hệ</span><select name="guardianRelationship" required><option value="">Chọn quan hệ</option><option value="parent">Cha / mẹ</option><option value="guardian">Người giám hộ hợp pháp</option></select></label>' +
          '<label class="field"><span>Số điện thoại</span><input type="tel" name="guardianPhone" autocomplete="tel" placeholder="0912345678" required></label>' +
          '<label class="field field-wide"><span>Ghế dành cho người giám hộ</span><select name="guardianSeatId"' + (needsAdditionalTicket ? ' disabled' : ' required') + '><option value="">Chọn ghế đã mua</option>' + guardianSeatOptions() + '</select></label>' +
        '</div>' +
        '<label class="terms-check guardian-confirm-check"><input type="checkbox" name="guardianConfirm" required><span>Tôi xác nhận người giám hộ nêu trên sẽ trực tiếp đi cùng người xem dưới 13 tuổi và xuất trình giấy tờ khi được yêu cầu.</span></label>' +
      '</div>';
  }

  function getGuardianValues(form) {
    if (!form || !currentVerification || !currentVerification.guardianRequired) { return null; }
    return {
      fullName: form.guardianFullName ? form.guardianFullName.value : "",
      relationship: form.guardianRelationship ? form.guardianRelationship.value : "",
      phone: form.guardianPhone ? form.guardianPhone.value : "",
      seatId: form.guardianSeatId ? form.guardianSeatId.value : "",
      selectedSeatIds: getAdmissionSeats().map(function (seat) { return seat.id; }),
      confirmed: Boolean(form.guardianConfirm && form.guardianConfirm.checked)
    };
  }

  function getGuardianResult(form) {
    return !currentVerification || !currentVerification.guardianRequired ? { ok: true, guardian: null } : cv.validateGuardianAccompaniment(getGuardianValues(form));
  }

  function syncPayButtonState() {
    var form = document.querySelector("[data-checkout-form]");
    var button = document.querySelector("[data-pay-button]");
    if (!form || !button || !currentVerification) { return; }
    var guardianReady = getGuardianResult(form).ok;
    var ready = currentVerification.eligible || (currentVerification.guardianRequired && guardianReady);
    button.disabled = !ready;
    button.classList.toggle("is-disabled", !ready);
  }

  function bindGuardianListeners() {
    var form = document.querySelector("[data-checkout-form]");
    if (!form || !currentVerification.guardianRequired) { return; }
    form.querySelectorAll("[name^=guardian]").forEach(function (field) {
      field.addEventListener("input", syncPayButtonState);
      field.addEventListener("change", function () {
        if (field.name === "guardianSeatId") {
          booking = cv.saveBooking({ guardianSeatId: field.value });
          renderOrderSummary();
        }
        syncPayButtonState();
      });
    });
  }

  function checkoutContextHelp(message, className) {
    return '' +
      '<span class="context-help' + (className ? ' ' + className : '') + '">' +
      
        '<span class="context-help-popover" role="tooltip">' +
          cv.escapeHtml(String(message)) +
        '</span>' +
      '</span>';
  }

  function renderAgeVerification() {
  var holder = document.querySelector("[data-age-verification]");
  var movie = cv.getMovie(booking.movieId);
  var statusClass;
  var statusText;
  var blockedActionMarkup = '';

  currentVerification = cv.getAgeVerification(
    movie,
    booking.date,
    currentUser
  );

  if (currentVerification.guardianRequired) {
    statusClass = "is-guardian-required";
    statusText = "Cần người giám hộ";
  } else if (currentVerification.eligible) {
    statusClass = "is-eligible";
    statusText = "Đã xác thực";
  } else {
    statusClass = "is-blocked";
    statusText = "Không đủ điều kiện";
  }

  if (
    !currentVerification.eligible &&
    !currentVerification.guardianRequired
  ) {
    blockedActionMarkup =
      '<div class="age-gate-actions">' +
        '<a class="btn btn-ghost" href="movies.html">' +
          'Chọn phim khác ' +
          cv.icon("arrowRight", 17) +
        '</a>' +
      '</div>';
  }

  holder.innerHTML = '' +
    '<div class="checkout-section-heading has-context-help" tabindex="0">' +
      '<span>' + cv.icon("birthday", 22) + '</span>' +
      '<div class="checkout-heading-copy">' +
        '<div class="checkout-heading-title-row">' +
          '<h2>Xác thực độ tuổi</h2>' +
          checkoutContextHelp(
            "Điều kiện mua vé được kiểm tra theo phân loại phim và ngày chiếu đã chọn.",
            "context-help-heading"
          ) +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div class="age-gate-card ' + statusClass + ' has-context-help" tabindex="0">' +
      checkoutContextHelp(
        currentVerification.description +
          " Rạp có quyền yêu cầu giấy tờ đối chiếu tại cổng kiểm soát vé.",
        "context-help-age-policy"
      ) +

      '<div class="age-gate-icon">' +
        cv.icon(
          currentVerification.guardianRequired
            ? "shield"
            : (currentVerification.eligible ? "check" : "lock"),
          22
        ) +
      '</div>' +

      '<div class="age-gate-copy">' +
        '<div class="age-gate-title">' +
          '<strong>' +
            cv.escapeHtml(currentVerification.label) +
          '</strong>' +
          '<span>' + statusText + '</span>' +
        '</div>' +

        '<p>' +
          cv.escapeHtml(currentVerification.message) +
        '</p>' +

        '<small>Tuổi tại ngày chiếu: ' +
          (
            currentVerification.age === null
              ? "Chưa xác định"
              : currentVerification.age + " tuổi"
          ) +
        '</small>' +

        blockedActionMarkup +

      '</div>' +
    '</div>';

    if (currentVerification.guardianRequired) {
      holder.insertAdjacentHTML("beforeend", guardianMarkup());
    }

    bindGuardianListeners();
    syncPayButtonState();
  }
  
  function updateMomoPayableAmount() {
    var amountHolder = document.querySelector("[data-momo-payable]");
    if (amountHolder) {
      amountHolder.textContent = cv.formatCurrency(getRewardTotals().total);
    }
  }

  function renderPaymentPanel(method) {
    var holder = document.querySelector("[data-payment-panel]");
    var phone = (booking.customer && booking.customer.phone) || (currentUser && currentUser.phone) || "";
    if (method === "momo") {
      holder.innerHTML = '' +
        '<div class="momo-panel momo-tooltip-host" tabindex="0" aria-describedby="momo-payment-tooltip">' +
          '<div class="momo-brand-badge" aria-hidden="true">' +
            '<img src="assets/momo/momo.png" alt="">' +
          '</div>' +
          '<div class="momo-panel-copy">' +
            '<strong>Thanh toán trực tuyến qua MoMo</strong>' +
            '<div class="momo-checkout-meta">' +
              '<span>Số tiền thanh toán</span>' +
              '<b data-momo-payable></b>' +
            '</div>' +
          '</div>' +
          '<p class="momo-hover-tooltip momo-payment-tooltip" id="momo-payment-tooltip" role="tooltip">' +
            'Sau khi xác nhận đơn hàng, hệ thống sẽ mở cửa sổ thanh toán MoMo để hoàn tất giao dịch an toàn.' +
          '</p>' +
        '</div>' +

        '<label class="field momo-phone-field momo-tooltip-host">' +
          '<span>Số điện thoại đăng ký MoMo</span>' +
          '<input type="tel" name="momoPhone" autocomplete="tel" inputmode="tel" placeholder="0912345678" value="' + cv.escapeHtml(phone) + '" aria-describedby="momo-phone-tooltip" required>' +
          '<small class="momo-hover-tooltip momo-phone-tooltip" id="momo-phone-tooltip" role="tooltip">' +
            'Số điện thoại nhận yêu cầu xác nhận thanh toán trong ứng dụng MoMo.' +
          '</small>' +
        '</label>';

      updateMomoPayableAmount();
      return;
    }
    holder.innerHTML = '<div class="payment-panel-grid"><label class="field field-wide"><span>Số thẻ</span><input type="text" inputmode="numeric" name="cardNumber" placeholder="0000 0000 0000 0000" maxlength="19" required></label><label class="field"><span>Ngày hết hạn</span><input type="text" name="expiry" placeholder="MM/YY" maxlength="5" required></label><label class="field"><span>CVV</span><input type="password" inputmode="numeric" name="cvv" placeholder="•••" maxlength="4" required></label></div>';
  }

  function validateContact(values) {
    if (values.fullName.trim().length < 2) { return "Vui lòng nhập họ và tên hợp lệ."; }
    if (!/^(0|\+84)[0-9]{9,10}$/.test(values.phone.replace(/\s/g, ""))) { return "Vui lòng nhập số điện thoại Việt Nam hợp lệ."; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) { return "Vui lòng nhập địa chỉ email hợp lệ."; }
    return "";
  }

  function validatePayment(form) {
    if (form.paymentMethod.value === "momo") {
      var momoPhone = String(form.momoPhone ? form.momoPhone.value : "").replace(/\s/g, "");
      return /^(0|\+84)[0-9]{9,10}$/.test(momoPhone) ? "" : "Vui lòng nhập số điện thoại đăng ký MoMo hợp lệ.";
    }
    var cardNumber = String(form.cardNumber ? form.cardNumber.value : "").replace(/\s/g, "");
    var expiry = String(form.expiry ? form.expiry.value : "").trim();
    var cvv = String(form.cvv ? form.cvv.value : "").trim();
    if (!/^\d{16}$/.test(cardNumber)) { return "Vui lòng nhập số thẻ hợp lệ gồm 16 chữ số."; }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) { return "Vui lòng nhập ngày hết hạn theo định dạng MM/YY."; }
    if (!/^\d{3,4}$/.test(cvv)) { return "Vui lòng nhập mã CVV hợp lệ."; }
    return "";
  }

  function createPaymentReceipt(method, form, totals) {
    var prefix = method === "momo" ? "MOMO" : "CARD";
    return {
      method: method,
      provider: method === "momo" ? "MoMo" : "CINEVERSE Card Gateway",
      status: "paid",
      transactionId: prefix + "-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 7).toUpperCase(),
      amount: totals.total,
      paidAt: new Date().toISOString(),
      payerPhone: method === "momo" && form.momoPhone ? form.momoPhone.value.trim() : ""
    };
  }

  function closeMomoModal() {
    var modal = document.querySelector("[data-momo-modal]");
    if (modal) {
      modal.classList.remove("is-visible");
      window.setTimeout(function () { if (modal.parentNode) { modal.parentNode.removeChild(modal); } }, 180);
    }
    document.body.classList.remove("modal-lock");
  }

  function openMomoPaymentModal(form, totals, onApproved) {
    var phone = String(form.momoPhone ? form.momoPhone.value : "").trim();
    var reference = "CV-MOMO-" + Date.now().toString(36).toUpperCase();
    var backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop momo-modal-backdrop";
    backdrop.setAttribute("data-momo-modal", "");
    backdrop.innerHTML = '' +
      '<section class="momo-payment-modal" role="dialog" aria-modal="true" aria-labelledby="momo-modal-title">' +
        '<header class="momo-modal-head">'+
            '<div class="momo-brand-badge" aria-hidden="true">' +
            '<img src="assets/momo/momo.png" alt="">' +
          '</div>' +
          '<div><p class="eyebrow">CỔNG THANH TOÁN TRỰC TUYẾN</p><h2 id="momo-modal-title">Xác nhận thanh toán MoMo</h2></div></header>' +
          '<div class="momo-modal-body">' +
            '<a class="momo-demo-qr" href="https://developers.momo.vn/v2/#/" target="_blank" rel="noopener noreferrer" aria-label="Quét hoặc mở mã QR MoMo Developers">' +
              '<img src="assets/momo/momo-developers-qr.png" alt="Mã QR dẫn đến trang MoMo Developers">' +
            '</a>' +
            '<div class="momo-modal-copy"><p>Mở ứng dụng MoMo và xác nhận yêu cầu thanh toán cho đơn hàng CINEVERSE.</p>' +
              '<dl class="momo-modal-summary"><div><dt>Số tiền</dt><dd>' + cv.formatCurrency(totals.total) + '</dd></div><div><dt>Số điện thoại</dt><dd>' + cv.escapeHtml(phone) + '</dd></div><div><dt>Mã giao dịch</dt><dd>' + cv.escapeHtml(reference) + '</dd></div></dl>' +
            '</div>' +
          '</div>' +
        '<footer class="momo-modal-actions"><button class="btn btn-ghost" type="button" data-momo-cancel>Hủy giao dịch</button><button class="btn btn-momo" type="button" data-momo-confirm>Xác nhận thanh toán MoMo</button></footer>' +
      '</section>';
    document.body.appendChild(backdrop);
    document.body.classList.add("modal-lock");
    window.requestAnimationFrame(function () { backdrop.classList.add("is-visible"); });
    backdrop.querySelector("[data-momo-cancel]").addEventListener("click", closeMomoModal);
    backdrop.addEventListener("click", function (event) { if (event.target === backdrop) { closeMomoModal(); } });
    backdrop.querySelector("[data-momo-confirm]").addEventListener("click", function (event) {
      var confirmButton = event.currentTarget;
      confirmButton.disabled = true;
      confirmButton.innerHTML = '<span class="spinner"></span> Đang xác nhận';
      window.setTimeout(function () {
        closeMomoModal();
        onApproved(createPaymentReceipt("momo", form, totals));
      }, 850);
    });
  }

  function issueTicket(button, guardianResult, totals, paymentReceipt) {
    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span> Đang phát hành vé';
    window.setTimeout(function () {
      var ticket = {
        code: cv.generateTicketCode(),
        purchasedAt: new Date().toISOString(),
        userId: currentUser.id,
        payment: paymentReceipt,
        ageVerification: { rating: currentVerification.rating, minAge: currentVerification.minAge, verifiedAge: currentVerification.age, referenceDate: currentVerification.referenceDate, guardianRequired: currentVerification.guardianRequired, guardian: guardianResult.guardian, verifiedAt: new Date().toISOString() },
        booking: booking,
        totals: totals
      };
      var loyalty = cv.applyMembershipPurchase(currentUser.id, ticket, rewardSelection);
      if (!loyalty.ok) {
        button.disabled = false;
        button.textContent = "Xác nhận thanh toán và nhận vé";
        cv.showToast(loyalty.error, "error");
        renderRewardsPanel();
        renderOrderSummary();
        return;
      }
      ticket.totals = loyalty.totals;
      ticket.membership = loyalty.membership;
      cv.setActiveTicket(ticket);
      cv.clearBooking();
      window.location.href = "ticket.html";
    }, 650);
  }

  function createTicket(form, button) {
    var guardianResult;
    var values;
    var error;
    var totals;
    currentUser = cv.getCurrentUser();
    if (!currentUser) {
      cv.showToast(
        "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        "error",
      );
      window.setTimeout(function () {
        window.location.href =
          "auth.html?notice=login-required&redirect=checkout.html";
      }, 500);
      return;
    }
    currentWallet = cv.getMemberWallet(currentUser.id);
    currentVerification = cv.getAgeVerification(
      cv.getMovie(booking.movieId),
      booking.date,
      currentUser,
    );
    guardianResult = getGuardianResult(form);
    if (
      !currentVerification.eligible &&
      !currentVerification.guardianRequired
    ) {
      cv.showToast(currentVerification.message, "error");
      renderAgeVerification();
      return;
    }
    if (currentVerification.guardianRequired && !guardianResult.ok) {
      cv.showToast(guardianResult.error, "error");
      syncPayButtonState();
      return;
    }
    values = {
      fullName: currentUser.fullName.trim(),
      phone: currentUser.phone.trim(),
      email: currentUser.email.trim(),
    };
    error = validateContact(values) || validatePayment(form);
    if (error) {
      cv.showToast(error, "error");
      return;
    }
    if (!form.ageConfirm.checked) {
      cv.showToast(
        "Vui lòng xác nhận thông tin cá nhân và điều kiện phân loại độ tuổi.",
        "error",
      );
      return;
    }
    if (!form.terms.checked) {
      cv.showToast(
        "Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật.",
        "error",
      );
      return;
    }
    booking = cv.saveBooking({
      customer: values,
      guardianSeatId: guardianResult.guardian
        ? guardianResult.guardian.seatId
        : "",
      paymentMethod: form.paymentMethod.value,
      rewards: rewardSelection,
    });
    totals = cv.calculateRewardedTotals(
      booking,
      currentWallet,
      rewardSelection,
    );
    if (form.paymentMethod.value === "momo") {
      openMomoPaymentModal(form, totals, function (paymentReceipt) {
        issueTicket(button, guardianResult, totals, paymentReceipt);
      });
      return;
    }
    issueTicket(
      button,
      guardianResult,
      totals,
      createPaymentReceipt("card", form, totals),
    );
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!cv.requireBookingFields(["movieId", "cinemaId", "date", "showtime", "seats"], "seats.html")) { return; }
    currentUser = cv.requireAuth("checkout.html");
    if (!currentUser) { return; }
    booking = cv.getBooking();
    rewardSelection = Object.assign({ pointsToRedeem: 0, birthdayVoucherId: "" }, booking.rewards || {});
    currentWallet = cv.getMemberWallet(currentUser.id);
    cv.renderSteps(4);
    renderAccountPanel();
    renderRewardsPanel();
    renderOrderSummary();
    var form = document.querySelector("[data-checkout-form]");
    var storedPaymentMethod = booking.paymentMethod === "momo" ? "momo" : "card";
    var selected = form.querySelector("input[name=paymentMethod][value='" + storedPaymentMethod + "']");
    if (selected) { selected.checked = true; }
    renderPaymentPanel(form.paymentMethod.value);
    renderAgeVerification();
    form.querySelectorAll("input[name=paymentMethod]").forEach(function (radio) { radio.addEventListener("change", function () { renderPaymentPanel(radio.value); }); });
    form.addEventListener("submit", function (event) { event.preventDefault(); createTicket(form, form.querySelector("[data-pay-button]")); });
  });
}());
