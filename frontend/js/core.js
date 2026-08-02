(function () {
  "use strict";

  var BOOKING_KEY = "cineverse.booking.v1";
  var ACTIVE_TICKET_KEY = "cineverse.active-ticket.v1";
  var USERS_KEY = "cineverse.users.v1";
  var SESSION_KEY = "cineverse.auth-session.v1";
  var REMEMBERED_SESSION_KEY = "cineverse.auth-session-remembered.v1";
  var DOB_MIGRATION_KEY = "cineverse.profile-security.dob-migration.v1";
  var MEMBER_DATA_KEY = "cineverse.member-data.v1";
  var TICKET_REGISTRY_KEY = "cineverse.ticket-registry.v1";
  var QR_SEQUENCE_KEY = "cineverse.qr-sequence.v1";
  var POINT_VALUE = 1000;
  var POINT_EARN_DIVISOR = 10000;
  var data = window.CINEVERSE_DATA;

  function getDefaultBooking() {
    return {
      movieId: "",
      cinemaId: "",
      date: "",
      showtime: "",
      format: "",
      hall: "",
      seats: [],
      guardianSeatId: "",
      combos: {},
      rewards: {
        pointsToRedeem: 0,
        birthdayVoucherId: ""
      },
      customer: {
        fullName: "",
        phone: "",
        email: ""
      },
      paymentMethod: "card"
    };
  }

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

  function removeStorageItem(key, storage) {
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

  function getBooking() {
    var saved = readJson(BOOKING_KEY, null);
    if (!saved) {
      return getDefaultBooking();
    }
    return Object.assign(getDefaultBooking(), saved, {
      customer: Object.assign(getDefaultBooking().customer, saved.customer || {}),
      seats: Array.isArray(saved.seats) ? saved.seats : [],
      combos: saved.combos || {},
      rewards: Object.assign({}, getDefaultBooking().rewards, saved.rewards || {})
    });
  }

  function saveBooking(update) {
    var current = getBooking();
    var merged = Object.assign({}, current, update);
    if (update && update.customer) {
      merged.customer = Object.assign({}, current.customer, update.customer);
    }
    if (merged.guardianSeatId && expandAdmissionSeats(merged.seats).every(function (seat) { return seat.id !== merged.guardianSeatId; })) {
      merged.guardianSeatId = "";
    }
    writeJson(BOOKING_KEY, merged);
    syncCurrentUserData({ booking: merged });
    updateHeaderBookingBadge();
    return merged;
  }

  function clearBooking() {
    var emptyBooking = getDefaultBooking();
    writeJson(BOOKING_KEY, emptyBooking);
    syncCurrentUserData({ booking: emptyBooking });
    updateHeaderBookingBadge();
  }

  function sanitizeTicketForStorage(ticket) {
    var sanitized = ticket ? JSON.parse(JSON.stringify(ticket)) : ticket;
    if (sanitized && sanitized.ageVerification && sanitized.ageVerification.dateOfBirth) {
      delete sanitized.ageVerification.dateOfBirth;
    }
    return sanitized;
  }

  function setActiveTicket(ticket) {
    var preparedTicket = ensureTicketQr(ticket);
    var sanitized = sanitizeTicketForStorage(preparedTicket);
    var session = getAuthSession();
    var state;
    writeJson(ACTIVE_TICKET_KEY, sanitized);
    registerTicket(sanitized);
    if (session && session.userId) {
      state = getMemberState(session.userId);
      syncCurrentUserData({
        activeTicket: sanitized,
        tickets: normalizeTicketHistory(sanitized, state.tickets)
      });
    }
    updateHeaderBookingBadge();
    return sanitized;
  }

  function getActiveTicket() {
    var ticket = readJson(ACTIVE_TICKET_KEY, null);
    if (ticket && ticket.ageVerification && ticket.ageVerification.dateOfBirth) {
      ticket = sanitizeTicketForStorage(ticket);
      writeJson(ACTIVE_TICKET_KEY, ticket);
    }
    return ticket;
  }

  function normalizeTicketHistory(activeTicket, tickets) {
    var seen = {};
    var normalized = [];

    function addTicket(ticket) {
      var prepared = sanitizeTicketForStorage(ticket);
      var key;
      if (!prepared || !prepared.code || !prepared.booking) {
        return;
      }
      key = String(prepared.code).toUpperCase();
      if (seen[key]) {
        return;
      }
      seen[key] = true;
      normalized.push(prepared);
    }

    (Array.isArray(tickets) ? tickets : []).forEach(addTicket);
    addTicket(activeTicket);

    return normalized.sort(function (left, right) {
      return new Date(right.purchasedAt || 0).getTime() - new Date(left.purchasedAt || 0).getTime();
    });
  }

  function getTicketShowtimeDate(ticket) {
    var booking = ticket && ticket.booking;
    var match;
    var date;
    if (!booking || !booking.date) {
      return null;
    }
    match = String(booking.showtime || "23:59").match(/^(\d{1,2}):(\d{2})/);
    if (!match) {
      return null;
    }
    date = new Date(booking.date + "T" + String(match[1]).padStart(2, "0") + ":" + match[2] + ":00");
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function isUpcomingTicket(ticket, referenceDate) {
    var showtimeDate = getTicketShowtimeDate(ticket);
    var now = referenceDate instanceof Date ? referenceDate : new Date(referenceDate || Date.now());
    return Boolean(showtimeDate && showtimeDate.getTime() >= now.getTime());
  }

  function deepClone(value) {
    return value === null || typeof value === "undefined" ? value : JSON.parse(JSON.stringify(value));
  }

  function hasBookingProgress(booking) {
    var candidate = booking || {};
    return Boolean(candidate.movieId || candidate.cinemaId || candidate.date || candidate.showtime || (candidate.seats || []).length || Object.keys(candidate.combos || {}).length);
  }

  function getMemberDataStore() {
    var store = readJson(MEMBER_DATA_KEY, {});
    return store && typeof store === "object" && !Array.isArray(store) ? store : {};
  }

  function saveMemberDataStore(store) {
    writeJson(MEMBER_DATA_KEY, store || {});
  }

  function getTierForLifetimePoints(points) {
    var total = Math.max(0, Number(points || 0));
   var tiers = [
     { code: "POPCORN_FAN", label: "Fan Bắp Rang", threshold: 0 },
     { code: "MOVIE_ADDICT", label: "Người Mê Phim", threshold: 500 },
     { code: "MOVIE_HOLIC", label: "Mọt Phim Cày Xuyên Đêm", threshold: 1500 },
     { code: "CINEMA_LEGEND", label: "Huyền Thoại Cineverse", threshold: 3500 },
   ];
    return tiers.reduce(function (selected, tier) {
      return total >= tier.threshold ? tier : selected;
    }, tiers[0]);
  }

  function getDefaultMembership() {
    var tier = getTierForLifetimePoints(0);
    return {
      pointsAvailable: 0,
      lifetimePoints: 0,
      tierCode: tier.code,
      tierLabel: tier.label,
      vouchers: [],
      transactions: [],
      updatedAt: new Date().toISOString()
    };
  }

  function normalizeMembership(value) {
    var source = value && typeof value === "object" ? value : {};
    var tier = getTierForLifetimePoints(source.lifetimePoints);
    return {
      pointsAvailable: Math.max(0, Math.floor(Number(source.pointsAvailable || 0))),
      lifetimePoints: Math.max(0, Math.floor(Number(source.lifetimePoints || 0))),
      tierCode: tier.code,
      tierLabel: tier.label,
      vouchers: Array.isArray(source.vouchers) ? source.vouchers : [],
      transactions: Array.isArray(source.transactions) ? source.transactions.slice(0, 80) : [],
      updatedAt: source.updatedAt || new Date().toISOString()
    };
  }

  function getMemberState(userId) {
    var store = getMemberDataStore();
    var state = store[userId] || {};
    var activeTicket = state.activeTicket ? deepClone(state.activeTicket) : null;
    return {
      booking: state.booking ? Object.assign(getDefaultBooking(), deepClone(state.booking), {
        customer: Object.assign({}, getDefaultBooking().customer, (state.booking && state.booking.customer) || {}),
        seats: Array.isArray(state.booking && state.booking.seats) ? deepClone(state.booking.seats) : [],
        combos: (state.booking && state.booking.combos) || {},
        rewards: Object.assign({}, getDefaultBooking().rewards, (state.booking && state.booking.rewards) || {})
      }) : getDefaultBooking(),
      activeTicket: activeTicket,
      tickets: normalizeTicketHistory(activeTicket, state.tickets),
      membership: normalizeMembership(state.membership)
    };
  }

  function saveMemberState(userId, update) {
    if (!userId) {
      return null;
    }
    var store = getMemberDataStore();
    var existing = getMemberState(userId);
    var patch = update || {};
    var nextActiveTicket = Object.prototype.hasOwnProperty.call(patch, "activeTicket") ? deepClone(patch.activeTicket) : existing.activeTicket;
    var next = {
      booking: Object.prototype.hasOwnProperty.call(patch, "booking") ? deepClone(patch.booking) : existing.booking,
      activeTicket: nextActiveTicket,
      tickets: normalizeTicketHistory(nextActiveTicket, Object.prototype.hasOwnProperty.call(patch, "tickets") ? patch.tickets : existing.tickets),
      membership: normalizeMembership(Object.prototype.hasOwnProperty.call(patch, "membership") ? patch.membership : existing.membership)
    };
    store[userId] = next;
    saveMemberDataStore(store);
    return next;
  }

  function syncCurrentUserData(update) {
    var session = getAuthSession();
    if (!session || !session.userId) {
      return null;
    }
    return saveMemberState(session.userId, update);
  }

  function getUserTickets(userId) {
    var session = getAuthSession();
    var targetUserId = userId || (session && session.userId) || "";
    var state;
    var registry;
    var registeredTickets;
    if (!targetUserId) {
      return [];
    }
    state = getMemberState(targetUserId);
    registry = getTicketRegistry();
    registeredTickets = Object.keys(registry).map(function (qrId) {
      return registry[qrId];
    }).filter(function (ticket) {
      return ticket && ticket.userId === targetUserId;
    });
    return normalizeTicketHistory(state.activeTicket, state.tickets.concat(registeredTickets));
  }

  function getUpcomingUserTickets(userId, referenceDate) {
    return getUserTickets(userId).filter(function (ticket) {
      return isUpcomingTicket(ticket, referenceDate);
    });
  }

  function getUserTicketByCode(code, userId) {
    var target = String(code || "").trim().toUpperCase();
    return getUserTickets(userId).find(function (ticket) {
      return String(ticket.code || "").toUpperCase() === target;
    }) || null;
  }

  function snapshotCurrentUserData(userId) {
    if (!userId) {
      return null;
    }
    var state = getMemberState(userId);
    return saveMemberState(userId, {
      booking: getBooking(),
      activeTicket: getActiveTicket(),
      tickets: state.tickets
    });
  }

  function restoreUserData(userId) {
    if (!userId) {
      return null;
    }
    var state = getMemberState(userId);
    var currentBooking = getBooking();
    state = saveMemberState(userId, { tickets: getUserTickets(userId) });
    if (hasBookingProgress(currentBooking)) {
      state = saveMemberState(userId, { booking: currentBooking });
    } else {
      writeJson(BOOKING_KEY, state.booking || getDefaultBooking());
    }
    if (state.activeTicket) {
      writeJson(ACTIVE_TICKET_KEY, state.activeTicket);
    } else {
      removeStorageItem(ACTIVE_TICKET_KEY, window.localStorage);
    }
    updateHeaderBookingBadge();
    return state;
  }

  function addMonths(date, months) {
    var source = new Date(date.getTime());
    var targetDay = source.getDate();
    source.setDate(1);
    source.setMonth(source.getMonth() + months);
    var lastDay = new Date(source.getFullYear(), source.getMonth() + 1, 0).getDate();
    source.setDate(Math.min(targetDay, lastDay));
    return source;
  }

  function addDays(date, days) {
    var copy = new Date(date.getTime());
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  function toLocalDay(value) {
    var date = value instanceof Date ? new Date(value.getTime()) : new Date(value || Date.now());
    if (Number.isNaN(date.getTime())) {
      date = new Date();
    }
    date.setHours(0, 0, 0, 0);
    return date;
  }

  function syncBirthdayVoucherForUser(userId, referenceDate) {
    var user = getUsers().find(function (item) { return item.id === userId; }) || null;
    var state = getMemberState(userId);
    var wallet = normalizeMembership(state.membership);
    var today = toLocalDay(referenceDate);
    var changed = false;
    wallet.vouchers = wallet.vouchers.map(function (voucher) {
      return Object.assign({}, voucher);
    });
    if (user && isValidDateOfBirth(user.dateOfBirth)) {
      var birth = new Date(user.dateOfBirth + "T00:00:00");
      var registered = toLocalDay(user.createdAt);
      var eligibleFrom = addMonths(registered, 12);
      var isBirthday = birth.getMonth() === today.getMonth() && birth.getDate() === today.getDate();
      var voucherId = "CV-BDAY-" + userId + "-" + today.getFullYear();
      var alreadyIssued = wallet.vouchers.some(function (voucher) { return voucher.id === voucherId; });
      if (isBirthday && today >= eligibleFrom && !alreadyIssued) {
        wallet.vouchers.unshift({
          id: voucherId,
          type: "birthday-free-ticket",
          label: "Vé xem phim sinh nhật",
          status: "available",
          issuedAt: today.toISOString(),
          expiresAt: "",
          issuedForYear: today.getFullYear(),
          redeemedAt: "",
          ticketCode: ""
        });
        wallet.transactions.unshift({
          id: "reward-" + Date.now().toString(36),
          type: "birthday-voucher-issued",
          label: "Tặng voucher vé xem phim sinh nhật",
          createdAt: today.toISOString()
        });
        changed = true;
      }
    }
    if (changed) {
      wallet.updatedAt = new Date().toISOString();
      saveMemberState(userId, { membership: wallet });
    }
    return wallet;
  }

  function getMemberWallet(userId, referenceDate) {
    var targetUserId = userId || ((getAuthSession() || {}).userId || "");
    if (!targetUserId) {
      return getDefaultMembership();
    }
    return syncBirthdayVoucherForUser(targetUserId, referenceDate);
  }

  function getAvailableBirthdayVouchers(userId, referenceDate) {
    return getMemberWallet(userId, referenceDate).vouchers.filter(function (voucher) {
      return voucher.type === "birthday-free-ticket" && voucher.status === "available";
    });
  }

  function getAdmissionUnitPrices(booking) {
    var units = [];
    (booking.seats || []).forEach(function (seat) {
      var expanded = expandAdmissionSeats([seat]);
      var unitPrice = expanded.length ? Math.round(getSeatPrice(seat) / expanded.length) : 0;
      expanded.forEach(function (admission) {
        units.push({ id: admission.id, label: admission.label, price: unitPrice });
      });
    });
    return units;
  }

  function calculateRewardedTotals(booking, wallet, selection) {
    var base = calculateTotals(booking);
    var rewards = selection || {};
    var membership = normalizeMembership(wallet);
    var voucherId = String(rewards.birthdayVoucherId || "");
    var voucher = membership.vouchers.find(function (item) {
      return item.id === voucherId && item.type === "birthday-free-ticket" && item.status === "available";
    }) || null;
    var unitPrices = getAdmissionUnitPrices(booking);
    var voucherDiscount = voucher && unitPrices.length ? Math.max.apply(Math, unitPrices.map(function (item) { return item.price; })) : 0;
    var productSubtotal = base.seatSubtotal + base.comboSubtotal;
    var redeemableAfterVoucher = Math.max(0, productSubtotal - voucherDiscount);
    var requestedPoints = Math.max(0, Math.floor(Number(rewards.pointsToRedeem || 0)));
    var maxPoints = Math.min(membership.pointsAvailable, Math.floor(redeemableAfterVoucher / POINT_VALUE));
    var pointsRedeemed = Math.min(requestedPoints, maxPoints);
    var pointsDiscount = pointsRedeemed * POINT_VALUE;
    var discountTotal = voucherDiscount + pointsDiscount;
    return Object.assign({}, base, {
      productSubtotal: productSubtotal,
      voucherId: voucher ? voucher.id : "",
      voucherDiscount: voucherDiscount,
      pointsRedeemed: pointsRedeemed,
      pointsDiscount: pointsDiscount,
      discountTotal: discountTotal,
      maxPointsRedeemable: maxPoints,
      total: Math.max(0, base.total - discountTotal)
    });
  }

  function applyMembershipPurchase(userId, ticket, selection) {
    if (!userId || !ticket) {
      return { ok: false, error: "Không thể cập nhật quyền lợi hội viên." };
    }
    var wallet = getMemberWallet(userId, ticket.purchasedAt);
    var totals = calculateRewardedTotals(ticket.booking, wallet, selection);
    if (Number(selection && selection.pointsToRedeem || 0) > totals.maxPointsRedeemable) {
      return { ok: false, error: "Số điểm sử dụng vượt quá giới hạn áp dụng cho đơn hàng." };
    }
    if (selection && selection.birthdayVoucherId && !totals.voucherId) {
      return { ok: false, error: "Voucher đã hết hiệu lực hoặc không còn khả dụng." };
    }
    wallet.pointsAvailable = Math.max(0, wallet.pointsAvailable - totals.pointsRedeemed);
    if (totals.voucherId) {
      wallet.vouchers = wallet.vouchers.map(function (voucher) {
        if (voucher.id !== totals.voucherId) {
          return voucher;
        }
        return Object.assign({}, voucher, {
          status: "redeemed",
          redeemedAt: ticket.purchasedAt,
          ticketCode: ticket.code
        });
      });
    }
    var earnedPoints = Math.floor(totals.total / POINT_EARN_DIVISOR);
    wallet.pointsAvailable += earnedPoints;
    wallet.lifetimePoints += earnedPoints;
    var tier = getTierForLifetimePoints(wallet.lifetimePoints);
    wallet.tierCode = tier.code;
    wallet.tierLabel = tier.label;
    wallet.transactions.unshift({
      id: "purchase-" + Date.now().toString(36),
      type: "ticket-purchase",
      label: "Mua vé " + ticket.code,
      ticketCode: ticket.code,
      earnedPoints: earnedPoints,
      redeemedPoints: totals.pointsRedeemed,
      voucherId: totals.voucherId,
      createdAt: ticket.purchasedAt
    });
    wallet.updatedAt = new Date().toISOString();
    saveMemberState(userId, { membership: wallet });
    return {
      ok: true,
      totals: totals,
      membership: {
        earnedPoints: earnedPoints,
        redeemedPoints: totals.pointsRedeemed,
        pointsAvailable: wallet.pointsAvailable,
        lifetimePoints: wallet.lifetimePoints,
        tierCode: wallet.tierCode,
        tierLabel: wallet.tierLabel,
        voucherId: totals.voucherId
      }
    };
  }

  function getTicketRegistry() {
    var registry = readJson(TICKET_REGISTRY_KEY, {});
    return registry && typeof registry === "object" && !Array.isArray(registry) ? registry : {};
  }

  function allocateQrId() {
    var current = Math.max(0, Number(readJson(QR_SEQUENCE_KEY, 0) || 0));
    var next = (current % 512) + 1;
    writeJson(QR_SEQUENCE_KEY, next);
    return String(next).padStart(6, "0");
  }

  function getQrPayload(qrId) {
    return "CINEVERSE:V1:" + String(qrId || "").padStart(6, "0");
  }

  function getQrAssetPath(qrId) {
    return "assets/qr/cvqr-" + String(qrId || "").padStart(6, "0") + ".svg";
  }

  function ensureTicketQr(ticket) {
    var prepared = deepClone(ticket || {});
    if (!prepared.qrId) {
      prepared.qrId = allocateQrId();
    }
    prepared.qrPayload = getQrPayload(prepared.qrId);
    prepared.qrAsset = getQrAssetPath(prepared.qrId);
    return prepared;
  }

  function registerTicket(ticket) {
    if (!ticket || !ticket.code || !ticket.qrId) {
      return false;
    }
    var registry = getTicketRegistry();
    registry[ticket.qrId] = Object.assign({}, deepClone(ticket), {
      verificationStatus: "valid",
      registeredAt: new Date().toISOString()
    });
    writeJson(TICKET_REGISTRY_KEY, registry);
    return true;
  }

  function parseQrPayload(value) {
    var text = String(value || "").trim();
    var match = text.match(/(?:CINEVERSE:V1:|ticket=)(\d{6})/i);
    if (match) {
      return match[1];
    }
    if (/^\d{6}$/.test(text)) {
      return text;
    }
    return "";
  }

  function findTicketForVerification(value) {
    var text = String(value || "").trim();
    var registry = getTicketRegistry();
    var qrId = parseQrPayload(text);
    if (qrId && registry[qrId]) {
      return deepClone(registry[qrId]);
    }
    var codes = Object.keys(registry);
    var matchKey = codes.find(function (key) {
      return String(registry[key].code || "").toUpperCase() === text.toUpperCase();
    });
    return matchKey ? deepClone(registry[matchKey]) : null;
  }

  function getUsers() {
    var storedUsers = readJson(USERS_KEY, []);
    var migrationCompleted = readJson(DOB_MIGRATION_KEY, false) === true;
    var storageChanged = false;
    if (!Array.isArray(storedUsers)) {
      return [];
    }
    storedUsers = storedUsers.map(function (storedUser) {
      var record = Object.assign({}, storedUser);
      if (!migrationCompleted && !record.dateOfBirthCipher && isValidDateOfBirth(record.dateOfBirth)) {
        record.dateOfBirthCipher = sealDateOfBirth(record.dateOfBirth, record.id);
        storageChanged = true;
      }
      if (Object.prototype.hasOwnProperty.call(record, "dateOfBirth")) {
        delete record.dateOfBirth;
        storageChanged = true;
      }
      return record;
    });
    if (!migrationCompleted) {
      writeJson(DOB_MIGRATION_KEY, true);
    }
    if (storageChanged) {
      writeJson(USERS_KEY, storedUsers);
    }
    return storedUsers.map(hydrateStoredUser);
  }

  function saveUsers(users) {
    writeJson(USERS_KEY, (users || []).map(prepareUserForStorage));
  }

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function normalizePhone(phone) {
    return String(phone || "").replace(/[\s.-]/g, "").trim();
  }

  function derivePasswordHash(value, namespace, prefix) {
    var text = namespace + String(value || "");
    var hash = 2166136261;
    var index;
    for (index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return prefix + (hash >>> 0).toString(16).padStart(8, "0");
  }

  function hashPassword(value) {
    return derivePasswordHash(value, "cineverse-auth::", "cv-auth-");
  }

  function legacyHashPassword(value) {
    return derivePasswordHash(value, "cineverse-demo::", "demo-");
  }

  function generateUserId() {
    return "cv-user-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function isValidDateOfBirth(value) {
    var text = String(value || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      return false;
    }
    var parts = text.split("-").map(Number);
    var date = new Date(parts[0], parts[1] - 1, parts[2]);
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.getFullYear() === parts[0] && date.getMonth() === parts[1] - 1 && date.getDate() === parts[2] && date <= today && parts[0] >= 1900;
  }

  var DOB_SEAL_NAMESPACE = "cineverse::member-profile::dob::v1";

  function fnv32(value) {
    var text = String(value || "");
    var hash = 2166136261;
    var index;
    for (index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return hash >>> 0;
  }

  function bytesToBase64(bytes) {
    var binary = "";
    bytes.forEach(function (byte) {
      binary += String.fromCharCode(byte);
    });
    return window.btoa(binary);
  }

  function base64ToBytes(payload) {
    var binary = window.atob(payload);
    var bytes = [];
    var index;
    for (index = 0; index < binary.length; index += 1) {
      bytes.push(binary.charCodeAt(index));
    }
    return bytes;
  }

  function createDobStream(userId, length) {
    var state = fnv32(DOB_SEAL_NAMESPACE + "|" + String(userId || ""));
    var stream = [];
    var index;
    for (index = 0; index < length; index += 1) {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      stream.push((state >>> 0) & 255);
    }
    return stream;
  }

  function sealDateOfBirth(value, userId) {
    var text = String(value || "");
    if (!isValidDateOfBirth(text) || !userId) {
      return "";
    }
    var stream = createDobStream(userId, text.length);
    var encrypted = [];
    var index;
    for (index = 0; index < text.length; index += 1) {
      encrypted.push(text.charCodeAt(index) ^ stream[index]);
    }
    var payload = bytesToBase64(encrypted);
    var signature = fnv32(DOB_SEAL_NAMESPACE + "|" + userId + "|" + payload).toString(16).padStart(8, "0");
    return "cvdob1." + payload + "." + signature;
  }

  function unsealDateOfBirth(value, userId) {
    try {
      var parts = String(value || "").split(".");
      if (parts.length !== 3 || parts[0] !== "cvdob1" || !userId) {
        return "";
      }
      var expected = fnv32(DOB_SEAL_NAMESPACE + "|" + userId + "|" + parts[1]).toString(16).padStart(8, "0");
      if (expected !== parts[2]) {
        return "";
      }
      var encrypted = base64ToBytes(parts[1]);
      var stream = createDobStream(userId, encrypted.length);
      var decoded = encrypted.map(function (byte, index) {
        return String.fromCharCode(byte ^ stream[index]);
      }).join("");
      return isValidDateOfBirth(decoded) ? decoded : "";
    } catch (error) {
      return "";
    }
  }

  function prepareUserForStorage(user) {
    var record = Object.assign({}, user);
    if (!record.dateOfBirthCipher && isValidDateOfBirth(record.dateOfBirth)) {
      record.dateOfBirthCipher = sealDateOfBirth(record.dateOfBirth, record.id);
    }
    delete record.dateOfBirth;
    delete record.dateOfBirthIntegrityValid;
    return record;
  }

  function hydrateStoredUser(user) {
    var record = Object.assign({}, user);
    var decryptedDateOfBirth = unsealDateOfBirth(record.dateOfBirthCipher, record.id);
    record.dateOfBirth = decryptedDateOfBirth;
    record.dateOfBirthIntegrityValid = Boolean(decryptedDateOfBirth);
    return record;
  }

  function setAuthSession(userId, remember) {
    var session = {
      userId: userId,
      signedInAt: new Date().toISOString()
    };
    removeStorageItem(SESSION_KEY, window.sessionStorage);
    removeStorageItem(REMEMBERED_SESSION_KEY, window.localStorage);
    if (remember) {
      writeJson(REMEMBERED_SESSION_KEY, session, window.localStorage);
    } else {
      writeJson(SESSION_KEY, session, window.sessionStorage);
    }
    updateHeaderAuthState();
    return session;
  }

  function getAuthSession() {
    return readJson(SESSION_KEY, null, window.sessionStorage) || readJson(REMEMBERED_SESSION_KEY, null, window.localStorage);
  }

  function getCurrentUser() {
    var session = getAuthSession();
    if (!session || !session.userId) {
      return null;
    }
    var user = getUsers().find(function (item) {
      return item.id === session.userId;
    }) || null;
    if (!user) {
      logoutUser();
      return null;
    }
    return user;
  }

  function validateRegistration(values) {
    var email = normalizeEmail(values.email);
    var phone = normalizePhone(values.phone);
    if (String(values.fullName || "").trim().length < 2) {
      return "Vui lòng nhập họ và tên hợp lệ.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Vui lòng nhập địa chỉ email hợp lệ.";
    }
    if (!/^(0|\+84)[0-9]{9,10}$/.test(phone)) {
      return "Vui lòng nhập số điện thoại Việt Nam hợp lệ.";
    }
    if (!isValidDateOfBirth(values.dateOfBirth)) {
      return "Vui lòng nhập ngày sinh hợp lệ để xác thực độ tuổi khi mua vé.";
    }
    if (String(values.password || "").length < 6) {
      return "Mật khẩu phải có ít nhất 6 ký tự.";
    }
    if (values.password !== values.confirmPassword) {
      return "Mật khẩu xác nhận chưa trùng khớp.";
    }
    if (getUsers().some(function (user) { return normalizeEmail(user.email) === email; })) {
      return "Email này đã được sử dụng. Vui lòng đăng nhập hoặc chọn email khác.";
    }
    return "";
  }

  function registerUser(values, remember) {
    var error = validateRegistration(values);
    if (error) {
      return { ok: false, error: error };
    }
    var users = getUsers();
    var user = {
      id: generateUserId(),
      fullName: String(values.fullName || "").trim(),
      email: normalizeEmail(values.email),
      phone: normalizePhone(values.phone),
      dateOfBirth: String(values.dateOfBirth || ""),
      dateOfBirthLockedAt: new Date().toISOString(),
      passwordHash: hashPassword(values.password),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    users.push(user);
    saveUsers(users);
    saveMemberState(user.id, { membership: getDefaultMembership() });
    setAuthSession(user.id, Boolean(remember));
    restoreUserData(user.id);
    syncBirthdayVoucherForUser(user.id);
    return { ok: true, user: getCurrentUser() || user };
  }

  function loginUser(email, password, remember) {
    var normalizedEmail = normalizeEmail(email);
    var user = getUsers().find(function (item) {
      return normalizeEmail(item.email) === normalizedEmail;
    }) || null;
    if (!user || (user.passwordHash !== hashPassword(password) && user.passwordHash !== legacyHashPassword(password))) {
      return { ok: false, error: "Email hoặc mật khẩu chưa chính xác." };
    }
    if (user.passwordHash === legacyHashPassword(password)) {
      var users = getUsers().map(function (item) {
        if (item.id === user.id) {
          return Object.assign({}, item, { passwordHash: hashPassword(password), updatedAt: new Date().toISOString() });
        }
        return item;
      });
      saveUsers(users);
    }
    setAuthSession(user.id, Boolean(remember));
    restoreUserData(user.id);
    syncBirthdayVoucherForUser(user.id);
    updateHeaderBookingBadge();
    return { ok: true, user: getCurrentUser() || user };
  }

  function logoutUser() {
    var session = getAuthSession();
    if (session && session.userId) {
      snapshotCurrentUserData(session.userId);
    }
    removeStorageItem(BOOKING_KEY, window.localStorage);
    removeStorageItem(ACTIVE_TICKET_KEY, window.localStorage);
    removeStorageItem(BOOKING_KEY, window.sessionStorage);
    removeStorageItem(ACTIVE_TICKET_KEY, window.sessionStorage);
    removeStorageItem(SESSION_KEY, window.sessionStorage);
    removeStorageItem(REMEMBERED_SESSION_KEY, window.localStorage);
    updateHeaderBookingBadge();
    updateHeaderAuthState();
  }

  function updateCurrentUserProfile(values) {
    var current = getCurrentUser();
    if (!current) {
      return { ok: false, error: "Phiên đăng nhập không còn hợp lệ." };
    }
    var fullName = String(values.fullName || "").trim();
    var phone = normalizePhone(values.phone);
    var requestedDateOfBirth = String(values.dateOfBirth || current.dateOfBirth || "");
    if (requestedDateOfBirth !== String(current.dateOfBirth || "")) {
      return { ok: false, error: "Ngày sinh đã được khóa sau khi đăng ký và không thể tự thay đổi. Vui lòng liên hệ quầy CINEVERSE nếu cần xử lý sai sót." };
    }
    if (fullName.length < 2) {
      return { ok: false, error: "Vui lòng nhập họ và tên hợp lệ." };
    }
    if (!/^(0|\+84)[0-9]{9,10}$/.test(phone)) {
      return { ok: false, error: "Vui lòng nhập số điện thoại Việt Nam hợp lệ." };
    }
    var users = getUsers();
    var updated = null;
    users = users.map(function (user) {
      if (user.id !== current.id) {
        return user;
      }
      updated = Object.assign({}, user, {
        fullName: fullName,
        phone: phone,
        updatedAt: new Date().toISOString()
      });
      return updated;
    });
    saveUsers(users);
    updateHeaderAuthState();
    return { ok: true, user: updated };
  }

  function validateAvatarDataUrl(value) {
    var text = String(value || "");
    return /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(text) && text.length <= 950000;
  }

  function updateCurrentUserAvatar(dataUrl) {
    var current = getCurrentUser();
    if (!current) {
      return { ok: false, error: "Phiên đăng nhập không còn hợp lệ." };
    }
    if (dataUrl && !validateAvatarDataUrl(dataUrl)) {
      return { ok: false, error: "Ảnh đại diện chưa hợp lệ hoặc vượt quá dung lượng cho phép." };
    }
    var users = getUsers();
    var updated = null;
    users = users.map(function (user) {
      if (user.id !== current.id) {
        return user;
      }
      updated = Object.assign({}, user, {
        avatarDataUrl: dataUrl || "",
        updatedAt: new Date().toISOString()
      });
      return updated;
    });
    saveUsers(users);
    updateHeaderAuthState();
    return { ok: true, user: updated };
  }

  function getAvatarMarkup(user, fallback, imageClass) {
    if (user && validateAvatarDataUrl(user.avatarDataUrl)) {
      return '<img class="' + escapeHtml(imageClass || "") + '" src="' + escapeHtml(user.avatarDataUrl) + '" alt="Ảnh đại diện">';
    }
    return fallback || icon("user", 18);
  }

  function getSafeRedirect(value, fallback) {
    var allowed = ["index.html", "movies.html", "movie-detail.html", "showtimes.html", "seats.html", "combos.html", "checkout.html", "tickets.html", "ticket.html", "auth.html"];
    var candidate = String(value || "").trim();
    var base = candidate.split("?")[0].split("#")[0];
    if (allowed.indexOf(base) === -1) {
      return fallback || "index.html";
    }
    return candidate;
  }

  function requireAuth(redirectUrl) {
    var user = getCurrentUser();
    if (user) {
      return user;
    }
    var target = getSafeRedirect(redirectUrl || (window.location.pathname.split("/").pop() || "index.html"), "index.html");
    window.location.href = "auth.html?notice=login-required&redirect=" + encodeURIComponent(target);
    return null;
  }

  function getMovie(movieId) {
    return data.movies.find(function (movie) {
      return movie.id === movieId;
    }) || null;
  }

  function getCinema(cinemaId) {
    return data.cinemas.find(function (cinema) {
      return cinema.id === cinemaId;
    }) || null;
  }

  function getCombo(comboId) {
    return data.combos.find(function (combo) {
      return combo.id === comboId;
    }) || null;
  }

  function getRatingPolicy(rating) {
    var policies = {
      P: { code: "P", minAge: 0, label: "P · Phổ biến mọi độ tuổi", description: "Phim được phép phổ biến đến người xem ở mọi độ tuổi." },
      K: { code: "K", minAge: 0, guardianAgeThreshold: 13, label: "K · Dưới 13 tuổi phải có người giám hộ", description: "Người xem dưới 13 tuổi chỉ được mua vé khi có cha, mẹ hoặc người giám hộ đi cùng." },
      T13: { code: "T13", minAge: 13, label: "T13 · Từ đủ 13 tuổi", description: "Chỉ dành cho người xem từ đủ 13 tuổi trở lên." },
      T16: { code: "T16", minAge: 16, label: "T16 · Từ đủ 16 tuổi", description: "Chỉ dành cho người xem từ đủ 16 tuổi trở lên." },
      T18: { code: "T18", minAge: 18, label: "T18 · Từ đủ 18 tuổi", description: "Chỉ dành cho người xem từ đủ 18 tuổi trở lên." }
    };
    return policies[rating] || { code: String(rating || "NR"), minAge: 0, label: String(rating || "Chưa phân loại"), description: "Vui lòng kiểm tra phân loại độ tuổi trước khi mua vé." };
  }

  function calculateAge(dateOfBirth, referenceDate) {
    if (!isValidDateOfBirth(dateOfBirth)) {
      return null;
    }
    var birthDate = new Date(dateOfBirth + "T00:00:00");
    var targetDate = referenceDate ? new Date(referenceDate + "T00:00:00") : new Date();
    if (Number.isNaN(targetDate.getTime())) {
      targetDate = new Date();
    }
    var age = targetDate.getFullYear() - birthDate.getFullYear();
    var monthDifference = targetDate.getMonth() - birthDate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && targetDate.getDate() < birthDate.getDate())) {
      age -= 1;
    }
    return age;
  }

  function getAgeVerification(movie, referenceDate, user) {
    var policy = getRatingPolicy(movie ? movie.rating : "NR");
    var account = user || getCurrentUser();
    var hasDateOfBirth = Boolean(account && isValidDateOfBirth(account.dateOfBirth));
    var age = hasDateOfBirth ? calculateAge(account.dateOfBirth, referenceDate) : null;
    var guardianRequired = Boolean(hasDateOfBirth && policy.code === "K" && age < policy.guardianAgeThreshold);
    var blockedByAge = Boolean(hasDateOfBirth && !guardianRequired && age < policy.minAge);
    var eligible = Boolean(hasDateOfBirth && !guardianRequired && !blockedByAge);
    var message;
    if (!account) {
      message = "Vui lòng đăng nhập để xác thực độ tuổi trước khi thanh toán.";
    } else if (!hasDateOfBirth) {
      message = "Tài khoản chưa có ngày sinh hợp lệ. Ngày sinh không thể tự chỉnh sửa, vui lòng liên hệ quầy chăm sóc khách hàng CINEVERSE để được hỗ trợ.";
    } else if (guardianRequired) {
      message = "Người xem dưới 13 tuổi chỉ được mua vé phim K khi có cha, mẹ hoặc người giám hộ đi cùng. Vui lòng khai báo người đi cùng ở phần thanh toán.";
    } else if (blockedByAge) {
      message = "Tài khoản hiện tại chưa đủ " + policy.minAge + " tuổi vào ngày chiếu và không thể mua vé cho phim " + policy.code + ".";
    } else if (policy.code === "K") {
      message = "Đã xác thực: người xem từ đủ 13 tuổi có thể mua vé phim K mà không cần khai báo người giám hộ.";
    } else if (policy.minAge > 0) {
      message = "Đã xác thực: bạn đủ điều kiện mua vé phim " + policy.code + ".";
    } else {
      message = "Đã xác thực ngày sinh cho suất chiếu này.";
    }
    return {
      authenticated: Boolean(account),
      hasDateOfBirth: hasDateOfBirth,
      eligible: eligible,
      blockedByAge: blockedByAge,
      guardianRequired: guardianRequired,
      canProceedWithGuardian: guardianRequired,
      age: age,
      rating: policy.code,
      minAge: policy.minAge,
      guardianAgeThreshold: policy.guardianAgeThreshold || null,
      label: policy.label,
      description: policy.description,
      dateOfBirth: account ? account.dateOfBirth : "",
      referenceDate: referenceDate || "",
      message: message
    };
  }

  function validateGuardianAccompaniment(values) {
    var guardian = values || {};
    var fullName = String(guardian.fullName || "").trim();
    var phone = normalizePhone(guardian.phone);
    var relationship = String(guardian.relationship || "").trim();
    var seatId = String(guardian.seatId || "").trim();
    var selectedSeatIds = Array.isArray(guardian.selectedSeatIds) ? guardian.selectedSeatIds : [];
    var relationshipLabels = {
      parent: "Cha / mẹ",
      guardian: "Người giám hộ hợp pháp"
    };
    if (selectedSeatIds.length < 2) {
      return { ok: false, error: "Vui lòng mua thêm một vé cho cha, mẹ hoặc người giám hộ đi cùng." };
    }
    if (!seatId || selectedSeatIds.indexOf(seatId) === -1) {
      return { ok: false, error: "Vui lòng chỉ định ghế đã mua dành cho người giám hộ." };
    }
    if (fullName.length < 2) {
      return { ok: false, error: "Vui lòng nhập họ và tên của cha, mẹ hoặc người giám hộ đi cùng." };
    }
    if (!relationshipLabels[relationship]) {
      return { ok: false, error: "Vui lòng chọn quan hệ của người giám hộ đi cùng." };
    }
    if (!/^(0|\+84)[0-9]{9,10}$/.test(phone)) {
      return { ok: false, error: "Vui lòng nhập số điện thoại hợp lệ của người giám hộ đi cùng." };
    }
    if (!guardian.confirmed) {
      return { ok: false, error: "Cần xác nhận cha, mẹ hoặc người giám hộ sẽ trực tiếp đi cùng người xem dưới 13 tuổi." };
    }
    return {
      ok: true,
      guardian: {
        fullName: fullName,
        phone: phone,
        relationship: relationship,
        relationshipLabel: relationshipLabels[relationship],
        seatId: seatId,
        ticketPurchased: true,
        accompanimentConfirmed: true
      }
    };
  }

  function parseQuery() {
    var result = {};
    var query = new URLSearchParams(window.location.search);
    query.forEach(function (value, key) {
      result[key] = value;
    });
    return result;
  }

  function buildQuery(params) {
    var query = new URLSearchParams();
    Object.keys(params).forEach(function (key) {
      if (params[key] !== "" && params[key] !== null && typeof params[key] !== "undefined") {
        query.set(key, params[key]);
      }
    });
    return query.toString();
  }

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString("vi-VN") + " ₫";
  }

  function formatDuration(minutes) {
    var hours = Math.floor(minutes / 60);
    var mins = minutes % 60;
    return hours + "h " + mins + "m";
  }

  function formatDate(dateString) {
    if (!dateString) {
      return "Chưa chọn";
    }
    var date = new Date(dateString + "T00:00:00");
    return new Intl.DateTimeFormat("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(date);
  }

  function formatDateOfBirth(dateString) {
    if (!dateString) {
      return "Chưa cập nhật";
    }
    var date = new Date(dateString + "T00:00:00");
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(date);
  }

  function toDateInput(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function getUpcomingDates(count) {
    var dates = [];
    var index;
    for (index = 0; index < count; index += 1) {
      var date = new Date();
      date.setDate(date.getDate() + index);
      dates.push({
        value: toDateInput(date),
        day: new Intl.DateTimeFormat("vi-VN", { weekday: "short" }).format(date),
        date: String(date.getDate()).padStart(2, "0"),
        month: "Tháng " + String(date.getMonth() + 1).padStart(2, "0")
      });
    }
    return dates;
  }

  function getShowtimes(movieId, cinemaId, dateString) {
    var movie = getMovie(movieId);
    var cinema = getCinema(cinemaId);
    if (!movie || !cinema || movie.status !== "now-showing") {
      return [];
    }
    var seed = 0;
    var text = movieId + cinemaId + dateString;
    var index;
    for (index = 0; index < text.length; index += 1) {
      seed += text.charCodeAt(index);
    }
    var options = [
      ["09:30", "12:15", "15:00", "17:45", "20:30", "22:50"],
      ["10:10", "13:05", "16:20", "19:15", "21:55"],
      ["08:50", "11:40", "14:35", "18:05", "20:50", "23:10"]
    ];
    var times = options[seed % options.length];
    return times.map(function (time, timeIndex) {
      var format = movie.formats[(seed + timeIndex) % movie.formats.length];
      return {
        time: time,
        format: format,
        hall: cinema.halls[(seed + timeIndex) % cinema.halls.length]
      };
    });
  }

  function getSeatPrice(seat) {
    if (!seat) {
      return 0;
    }
    if (seat.type === "vip") {
      return data.ticketPrices.vip;
    }
    if (seat.type === "couple") {
      return data.ticketPrices.couple;
    }
    return data.ticketPrices.standard;
  }

  function expandAdmissionSeats(seats) {
    var admissions = [];
    (seats || []).forEach(function (seat) {
      if (seat && seat.type === "couple" && String(seat.label || "").indexOf("-") !== -1) {
        String(seat.label).split("-").forEach(function (label) {
          admissions.push({ id: label, label: label, sourceSeatId: seat.id, type: seat.type });
        });
      } else if (seat) {
        admissions.push({ id: seat.label || seat.id, label: seat.label || seat.id, sourceSeatId: seat.id, type: seat.type });
      }
    });
    return admissions;
  }

  function getAdmissionCount(bookingOrSeats) {
    var seats = Array.isArray(bookingOrSeats) ? bookingOrSeats : ((bookingOrSeats && bookingOrSeats.seats) || []);
    return expandAdmissionSeats(seats).length;
  }

  function calculateTotals(booking) {
    var seatSubtotal = (booking.seats || []).reduce(function (sum, seat) {
      return sum + getSeatPrice(seat);
    }, 0);
    var comboSubtotal = Object.keys(booking.combos || {}).reduce(function (sum, comboId) {
      var combo = getCombo(comboId);
      var quantity = Number(booking.combos[comboId] || 0);
      return sum + (combo ? combo.price * quantity : 0);
    }, 0);
    var serviceFee = getAdmissionCount(booking) * data.serviceFeePerSeat;
    return {
      seatSubtotal: seatSubtotal,
      comboSubtotal: comboSubtotal,
      serviceFee: serviceFee,
      total: seatSubtotal + comboSubtotal + serviceFee
    };
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function icon(name, size) {
    var dimension = size || 20;
    var paths = {
      menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
      close: '<path d="M6 6l12 12M18 6L6 18"/>',
      arrowRight: '<path d="M8 4l8 8-8 8" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>',
      arrowLeft: '<path d="M16 4l-8 8 8 8" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>',
      play: '<path d="M9 7l8 5-8 5z"/>',
      ticket: '<path d="M4 6h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4z"/><path d="M12 8v8"/>',
      search: '<circle cx="11" cy="11" r="5"/><path d="M15 15l5 5"/>',
      calendar: '<path d="M5 4v3M19 4v3M4 9h16M5 6h14a1 1 0 0 1 1 1v12H4V7a1 1 0 0 1 1-1z"/>',
      location: '<path d="M12 21s6-5 6-11a6 6 0 1 0-12 0c0 6 6 11 6 11z"/><circle cx="12" cy="10" r="2"/>',
      clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/>',
      star: '<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
      check: '<path d="M5 12l4 4L19 6"/>',
      plus: '<path d="M12 5v14M5 12h14"/>',
      minus: '<path d="M5 12h14"/>',
      user: '<circle cx="12" cy="8" r="3"/><path d="M5 20a7 7 0 0 1 14 0"/>',
      phone: '<path d="M7 4l3 3-2 3a15 15 0 0 0 6 6l3-2 3 3-2 3c-7 0-14-7-14-14z"/>',
      mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M4 7l8 6 8-6"/>',
      card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/>',
      shield: '<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
      home: '<path d="M4 11l8-7 8 7v9h-6v-6h-4v6H4z"/>',
      download: '<path d="M12 3v12M8 11l4 4 4-4M5 20h14"/>',
      print: '<path d="M7 8V4h10v4M7 17v3h10v-3M5 9h14a2 2 0 0 1 2 2v5h-4v-3H7v3H3v-5a2 2 0 0 1 2-2z"/>',
      info: '<circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/>',
      chevronDown: '<path d="M7 9l5 5 5-5"/>',
      lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2"/>',
      logout: '<path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9"/>',
      birthday: '<path d="M5 11h14v9H5zM4 11h16M8 11V8M12 11V7M16 11V8M8 5h.01M12 4h.01M16 5h.01M5 15c2 1.2 3.5 1.2 5 0 1.5 1.2 3.5 1.2 5 0 1.5 1.2 3 1.2 4 0"/>',
      edit: '<path d="M4 20h4l11-11-4-4L4 16zM13 7l4 4"/>',
      camera: '<path d="M4 7h4l2-2h4l2 2h4v12H4z"/><circle cx="12" cy="13" r="3"/>',
      trash: '<path d="M5 7h14M9 7V5h6v2M8 10v7M12 10v7M16 10v7M7 7l1 13h8l1-13"/>',
      gift: '<path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7H8.7a2.2 2.2 0 1 1 0-4c2.2 0 3.3 4 3.3 4zM12 7h3.3a2.2 2.2 0 1 0 0-4C13.1 3 12 7 12 7z"/>',
      crown: '<path d="M4 18h16l-1-10-4 4-3-7-3 7-4-4zM5 21h14"/>',
      scan: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10"/>',
      wallet: '<path d="M4 6h15a1 1 0 0 1 1 1v11H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h13M15 11h6v4h-6a2 2 0 0 1 0-4z"/>',
      qr: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM15 14h2v2h-2zM18 14h2v5h-2zM14 18h3v2h-3z"/>'
    };
    return '<svg class="icon" width="' + dimension + '" height="' + dimension + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[name] || paths.info) + '</svg>';
  }

  function getCurrentNavigationKey() {
    var page = window.location.pathname.split("/").pop() || "index.html";
    var hash = window.location.hash;
    if (page === "movies.html") {
      if (hash === "#now-showing") {
        return "now-showing";
      }
      if (hash === "#coming-soon") {
        return "coming-soon";
      }
      return "movies";
    }
    if (page === "index.html" && hash === "#trailers") {
      return "trailers";
    }
    return page === "index.html" || page === "" ? "home" : "";
  }

  function syncNavigationState() {
    var activeKey = getCurrentNavigationKey();
    document.querySelectorAll("[data-nav-key]").forEach(function (link) {
      var isActive = link.getAttribute("data-nav-key") === activeKey;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function renderHeader() {
    var header = document.querySelector("[data-site-header]");
    if (!header) {
      return;
    }
    header.innerHTML = '' +
      '<header class="site-header" data-header>' +
        '<div class="container header-inner">' +
          '<a class="brand" href="index.html" aria-label="CINEVERSE home"><img src="assets/logo.svg" alt="CINEVERSE"></a>' +
          '<nav class="desktop-nav" aria-label="Main navigation">' +
            '<a href="index.html" data-nav-key="home">Trang chủ</a>' +
            '<a href="movies.html" data-nav-key="movies">Phim</a>' +
            '<a href="movies.html#now-showing" data-nav-key="now-showing">Đang chiếu</a>' +
            '<a href="movies.html#coming-soon" data-nav-key="coming-soon">Sắp chiếu</a>' +
            
          '</nav>' +
          '<div class="header-actions">' +
            '<a class="header-account" href="auth.html" aria-label="Tài khoản CINEVERSE" data-header-account-link><span class="header-account-avatar" data-header-account-avatar>' + icon("user", 18) + '</span><span data-header-account-label>Tài khoản</span></a>' +
            '<a class="header-ticket" href="showtimes.html" aria-label="Tiếp tục đặt vé" data-header-ticket-link>' + icon("ticket", 18) + '<span data-header-ticket-label>Vé của bạn</span><b data-booking-count>0</b></a>' +
            '<button class="nav-toggle" type="button" aria-label="Mở menu" aria-expanded="false" data-nav-toggle>' + icon("menu", 22) + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="mobile-panel" data-mobile-panel>' +
          '<nav class="mobile-nav" aria-label="Mobile navigation">' +
            '<a href="index.html" data-nav-key="home">Trang chủ</a>' +
            '<a href="movies.html" data-nav-key="movies">Danh sách phim</a>' +
            '<a href="movies.html#now-showing" data-nav-key="now-showing">Phim đang chiếu</a>' +
            '<a href="movies.html#coming-soon" data-nav-key="coming-soon">Phim sắp chiếu</a>' +
            '<a href="index.html#trailers" data-nav-key="trailers">Trailers & featured videos</a>' +
            '<a href="auth.html" data-mobile-account-link>Đăng nhập / Đăng ký</a>' +
            '<a href="showtimes.html" data-mobile-ticket-link>Tiếp tục đặt vé</a>' +
          '</nav>' +
        '</div>' +
      '</header>';
    var toggle = header.querySelector("[data-nav-toggle]");
    var panel = header.querySelector("[data-mobile-panel]");
    toggle.addEventListener("click", function () {
      var open = panel.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Đóng menu" : "Mở menu");
      toggle.innerHTML = open ? icon("close", 22) : icon("menu", 22);
    });
    window.addEventListener("scroll", function () {
      var currentHeader = document.querySelector("[data-header]");
      if (currentHeader) {
        currentHeader.classList.toggle("is-scrolled", window.scrollY > 40);
      }
    });
    window.addEventListener("hashchange", syncNavigationState);
    syncNavigationState();
    updateHeaderBookingBadge();
    updateHeaderAuthState();
  }

  function renderFooter() {
    var footer = document.querySelector("[data-site-footer]");
    if (!footer) {
      return;
    }
    footer.innerHTML = '' +
      '<footer class="site-footer">' +
        '<div class="container footer-grid">' +
          '<div><img class="footer-logo" src="assets/logo.svg" alt="CINEVERSE"><p>Đặt vé nhanh, trải nghiệm điện ảnh trọn vẹn tại hệ thống rạp CINEVERSE.</p></div>' +
          '<div><h3>Khám phá</h3><a href="index.html">Trang chủ</a><a href="movies.html">Tất cả phim</a><a href="movies.html#now-showing">Đang chiếu</a><a href="movies.html#coming-soon">Sắp chiếu</a></div>' +
          '<div><h3>Hỗ trợ</h3><a href="showtimes.html">Đặt vé</a><a href="tickets.html">Vé của bạn</a><a href="ticket.html">Vé gần nhất</a><a href="auth.html">Tài khoản</a></div>' +
          '<div><h3>Kết nối</h3><p>Hotline: 1900 2026</p><p>Email: hello@cineverse.vn</p><div class="social-row"><span>f</span><span>▶</span><span>◎</span><span>♪</span></div></div>' +
        '</div>' +
        '<div class="container footer-bottom"><span>© 2026 CINEVERSE. All rights reserved.</span><span>Điều khoản sử dụng · Chính sách bảo mật</span></div>' +
      '</footer>';
  }

  function updateHeaderAuthState() {
    var user = getCurrentUser();
    document.querySelectorAll("[data-header-account-label]").forEach(function (element) {
      element.textContent = user ? user.fullName.split(/\s+/).slice(-1)[0] : "Tài khoản";
    });
    document.querySelectorAll("[data-header-account-avatar]").forEach(function (element) {
      element.innerHTML = getAvatarMarkup(user, icon("user", 18), "header-avatar-image");
    });
    document.querySelectorAll("[data-header-account-link]").forEach(function (element) {
      element.classList.toggle("is-authenticated", Boolean(user));
      element.setAttribute("title", user ? "Mở hồ sơ " + user.fullName : "Đăng nhập hoặc đăng ký");
      element.setAttribute("aria-label", user ? "Mở hồ sơ tài khoản " + user.fullName : "Đăng nhập hoặc đăng ký tài khoản CINEVERSE");
    });
    document.querySelectorAll("[data-mobile-account-link]").forEach(function (element) {
      element.textContent = user ? "Tài khoản: " + user.fullName : "Đăng nhập / Đăng ký";
    });
  }

  function getResumeBookingUrl(booking) {
    if (booking && booking.movieId && booking.cinemaId && booking.date && booking.showtime && (booking.seats || []).length) {
      return "combos.html";
    }
    if (booking && booking.movieId && booking.cinemaId && booking.date && booking.showtime) {
      return "seats.html";
    }
    return "showtimes.html";
  }

  function updateHeaderBookingBadge() {
    var booking = getBooking();
    var seatCount = getAdmissionCount(booking);
    var upcomingTicketCount = getUpcomingUserTickets().length;

    var hasActiveBooking = seatCount > 0;
    var badgeCount = hasActiveBooking ? seatCount : upcomingTicketCount;

    var href = hasActiveBooking ? getResumeBookingUrl(booking) : "tickets.html";

    var label = hasActiveBooking ? "Đang đặt vé" : "Vé của tôi";

    var ariaLabel = hasActiveBooking
      ? "Tiếp tục đặt vé đang thực hiện"
      : "Mở danh sách vé sắp chiếu";

    document
      .querySelectorAll("[data-booking-count]")
      .forEach(function (element) {
        element.textContent = String(badgeCount);
        element.classList.toggle("has-items", badgeCount > 0);
      });

    document
      .querySelectorAll("[data-header-ticket-link]")
      .forEach(function (element) {
        element.setAttribute("href", href);
        element.setAttribute("aria-label", ariaLabel);
        element.setAttribute("title", ariaLabel);

        element.classList.toggle("is-booking-active", hasActiveBooking);
      });

    document
      .querySelectorAll("[data-header-ticket-label]")
      .forEach(function (element) {
        element.textContent = label;
      });

    document
      .querySelectorAll("[data-mobile-ticket-link]")
      .forEach(function (element) {
        element.setAttribute("href", href);
        element.setAttribute("aria-label", ariaLabel);
        element.setAttribute("title", ariaLabel);

        element.textContent = hasActiveBooking
          ? "Tiếp tục đặt vé"
          : "Vé của tôi";

        element.classList.toggle("is-booking-active", hasActiveBooking);
      });
  }

  function renderSteps(activeStep) {
    var holder = document.querySelector("[data-booking-steps]");
    if (!holder) {
      return;
    }
    var steps = [
      [1, "Suất chiếu", "showtimes.html"],
      [2, "Ghế ngồi", "seats.html"],
      [3, "Combo", "combos.html"],
      [4, "Thanh toán", "checkout.html"],
      [5, "Mã vé", "ticket.html"]
    ];
    holder.innerHTML = '<div class="booking-steps">' + steps.map(function (step) {
      var classes = "booking-step";
      if (step[0] < activeStep) {
        classes += " is-complete";
      }
      if (step[0] === activeStep) {
        classes += " is-active";
      }
      return '<a class="' + classes + '" href="' + step[2] + '"><span>' + (step[0] < activeStep ? icon("check", 15) : step[0]) + '</span><strong>' + step[1] + '</strong></a>';
    }).join("") + '</div>';
  }

  function getSelectedComboLines(booking) {
    return Object.keys(booking.combos || {}).map(function (comboId) {
      var combo = getCombo(comboId);
      var quantity = Number(booking.combos[comboId] || 0);
      if (!combo || quantity < 1) {
        return null;
      }
      return {
        id: combo.id,
        name: combo.name,
        quantity: quantity,
        price: combo.price,
        subtotal: combo.price * quantity
      };
    }).filter(Boolean);
  }

  function showToast(message, type) {
    var existing = document.querySelector(".toast");
    if (existing) {
      existing.remove();
    }
    var toast = document.createElement("div");
    toast.className = "toast" + (type ? " toast-" + type : "");
    toast.innerHTML = '<span>' + icon(type === "error" ? "info" : "check", 18) + '</span><p>' + escapeHtml(message) + '</p>';
    document.body.appendChild(toast);
    window.setTimeout(function () {
      toast.classList.add("is-visible");
    }, 20);
    window.setTimeout(function () {
      toast.classList.remove("is-visible");
      window.setTimeout(function () {
        toast.remove();
      }, 250);
    }, 2800);
  }

  function requireBookingFields(fields, redirectUrl) {
    var booking = getBooking();
    var valid = fields.every(function (field) {
      var value = booking[field];
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return Boolean(value);
    });
    if (!valid) {
      window.location.href = redirectUrl;
      return false;
    }
    return true;
  }

  function generateTicketCode() {
    var alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var result = "CV-";
    var index;
    for (index = 0; index < 8; index += 1) {
      result += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    return result;
  }

  function setCurrentYear() {
    document.querySelectorAll("[data-current-year]").forEach(function (element) {
      element.textContent = String(new Date().getFullYear());
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderHeader();
    renderFooter();
    setCurrentYear();
  });

  window.Cineverse = {
    BOOKING_KEY: BOOKING_KEY,
    ACTIVE_TICKET_KEY: ACTIVE_TICKET_KEY,
    USERS_KEY: USERS_KEY,
    SESSION_KEY: SESSION_KEY,
    REMEMBERED_SESSION_KEY: REMEMBERED_SESSION_KEY,
    MEMBER_DATA_KEY: MEMBER_DATA_KEY,
    TICKET_REGISTRY_KEY: TICKET_REGISTRY_KEY,
    QR_SEQUENCE_KEY: QR_SEQUENCE_KEY,
    POINT_VALUE: POINT_VALUE,
    POINT_EARN_DIVISOR: POINT_EARN_DIVISOR,
    getDefaultBooking: getDefaultBooking,
    getBooking: getBooking,
    saveBooking: saveBooking,
    clearBooking: clearBooking,
    setActiveTicket: setActiveTicket,
    getActiveTicket: getActiveTicket,
    getUserTickets: getUserTickets,
    getUpcomingUserTickets: getUpcomingUserTickets,
    getUserTicketByCode: getUserTicketByCode,
    getTicketShowtimeDate: getTicketShowtimeDate,
    getUsers: getUsers,
    normalizeEmail: normalizeEmail,
    registerUser: registerUser,
    loginUser: loginUser,
    logoutUser: logoutUser,
    getCurrentUser: getCurrentUser,
    getMemberState: getMemberState,
    getMemberWallet: getMemberWallet,
    getAvailableBirthdayVouchers: getAvailableBirthdayVouchers,
    syncBirthdayVoucherForUser: syncBirthdayVoucherForUser,
    restoreUserData: restoreUserData,
    snapshotCurrentUserData: snapshotCurrentUserData,
    getTierForLifetimePoints: getTierForLifetimePoints,
    calculateRewardedTotals: calculateRewardedTotals,
    applyMembershipPurchase: applyMembershipPurchase,
    getQrPayload: getQrPayload,
    getQrAssetPath: getQrAssetPath,
    findTicketForVerification: findTicketForVerification,
    parseQrPayload: parseQrPayload,
    updateCurrentUserProfile: updateCurrentUserProfile,
    updateCurrentUserAvatar: updateCurrentUserAvatar,
    getAvatarMarkup: getAvatarMarkup,
    getSafeRedirect: getSafeRedirect,
    requireAuth: requireAuth,
    getMovie: getMovie,
    getCinema: getCinema,
    getCombo: getCombo,
    getRatingPolicy: getRatingPolicy,
    calculateAge: calculateAge,
    getAgeVerification: getAgeVerification,
    validateGuardianAccompaniment: validateGuardianAccompaniment,
    parseQuery: parseQuery,
    buildQuery: buildQuery,
    formatCurrency: formatCurrency,
    formatDuration: formatDuration,
    formatDate: formatDate,
    formatDateOfBirth: formatDateOfBirth,
    getUpcomingDates: getUpcomingDates,
    getShowtimes: getShowtimes,
    getSeatPrice: getSeatPrice,
    expandAdmissionSeats: expandAdmissionSeats,
    getAdmissionCount: getAdmissionCount,
    calculateTotals: calculateTotals,
    escapeHtml: escapeHtml,
    icon: icon,
    renderSteps: renderSteps,
    getSelectedComboLines: getSelectedComboLines,
    updateHeaderBookingBadge: updateHeaderBookingBadge,
    updateHeaderAuthState: updateHeaderAuthState,
    getResumeBookingUrl: getResumeBookingUrl,
    syncNavigationState: syncNavigationState,
    showToast: showToast,
    requireBookingFields: requireBookingFields,
    generateTicketCode: generateTicketCode
  };
}());
