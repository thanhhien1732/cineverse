(function () {
  "use strict";

  var cv = window.Cineverse;

  function getPaymentLabel(ticket) {
    return ticket && ticket.payment && ticket.payment.method === "momo" ? "MoMo" : "Thẻ ngân hàng";
  }

  function getTicketContext(ticket) {
    var booking = ticket && ticket.booking;
    var movie = booking ? cv.getMovie(booking.movieId) : null;
    var cinema = booking ? cv.getCinema(booking.cinemaId) : null;
    if (!ticket || !ticket.code || !booking || !movie || !cinema) {
      return null;
    }
    return { ticket: ticket, booking: booking, movie: movie, cinema: cinema };
  }

  function renderTicketCard(context, latestCode) {
    var ticket = context.ticket;
    var booking = context.booking;
    var movie = context.movie;
    var cinema = context.cinema;
    var seats = cv.expandAdmissionSeats(booking.seats || []);
    var showtime = cv.getTicketShowtimeDate(ticket);
    var isLatest = String(ticket.code || "") === String(latestCode || "");

    return '' +
      '<article class="wallet-ticket-card">' +
        '<a class="wallet-ticket-poster" href="ticket.html?code=' + encodeURIComponent(ticket.code) + '"><img src="' + cv.escapeHtml(movie.poster) + '" alt="Poster phim ' + cv.escapeHtml(movie.title) + '"></a>' +
        '<div class="wallet-ticket-content">' +
          '<div class="wallet-ticket-head"><div><p class="eyebrow">' + (isLatest ? 'VÉ MUA GẦN NHẤT' : 'VÉ SẮP CHIẾU') + '</p><h2>' + cv.escapeHtml(movie.title) + '</h2></div><span class="wallet-ticket-status">Sắp chiếu</span></div>' +
          '<dl class="wallet-ticket-meta">' +
            '<div><dt>Ngày chiếu</dt><dd>' + cv.formatDate(booking.date) + '</dd></div>' +
            '<div><dt>Suất chiếu</dt><dd>' + cv.escapeHtml(booking.showtime) + '</dd></div>' +
            '<div><dt>Rạp</dt><dd>' + cv.escapeHtml(cinema.name) + '</dd></div>' +
            '<div><dt>Phòng</dt><dd>' + cv.escapeHtml(booking.hall) + '</dd></div>' +
            '<div><dt>Ghế</dt><dd>' + cv.escapeHtml(seats.map(function (seat) { return seat.label; }).join(", ")) + '</dd></div>' +
            '<div><dt>Thanh toán</dt><dd>' + cv.escapeHtml(getPaymentLabel(ticket)) + '</dd></div>' +
          '</dl>' +
          '<div class="wallet-ticket-footer"><span><strong>' + cv.escapeHtml(ticket.code) + '</strong>' + (showtime ? '<small>' + cv.escapeHtml(showtime.toLocaleString("vi-VN")) + '</small>' : '') + '</span><a class="btn btn-primary" href="ticket.html?code=' + encodeURIComponent(ticket.code) + '">Mở vé ' + cv.icon("arrowRight", 17) + '</a></div>' +
        '</div>' +
      '</article>';
  }

  function renderEmpty(holder, activeTicket) {
    holder.innerHTML = '' +
      '<section class="ticket-wallet-hero"><div class="container"><p class="hero-kicker">CINEVERSE E-TICKETS</p><h1>Vé của bạn</h1><p>Quản lý các vé điện tử cho những suất chiếu sắp tới.</p></div></section>' +
      '<section class="section"><div class="container"><div class="empty-state large"><span>' + cv.icon("ticket", 34) + '</span><h2>Chưa có vé sắp chiếu</h2><p>Chọn phim và hoàn tất thanh toán để nhận vé điện tử.</p><div class="wallet-empty-actions"><a class="btn btn-primary" href="movies.html">Chọn phim ngay ' + cv.icon("arrowRight", 18) + '</a>' + (activeTicket && activeTicket.code ? '<a class="btn btn-ghost" href="ticket.html">Mở vé gần nhất</a>' : '') + '</div></div></div></section>';
  }

  document.addEventListener("DOMContentLoaded", function () {
    var user = cv.requireAuth("tickets.html");
    var holder = document.querySelector("[data-tickets-page]");
    var tickets;
    var latest;
    if (!user || !holder) {
      return;
    }
    tickets = cv.getUpcomingUserTickets(user.id);
    latest = cv.getActiveTicket();
    if (!tickets.length) {
      renderEmpty(holder, latest);
      return;
    }
    holder.innerHTML = '' +
      '<section class="ticket-wallet-hero"><div class="container wallet-heading"><div><p class="hero-kicker">CINEVERSE E-TICKETS</p><h1>Vé của bạn</h1><p>Các vé điện tử cho những suất chiếu chưa diễn ra.</p></div>' + (latest && latest.code ? '<a class="btn btn-ghost" href="ticket.html">Mở vé gần nhất</a>' : '') + '</div></section>' +
      '<section class="section"><div class="container"><div class="wallet-ticket-grid">' + tickets.map(function (ticket) { return getTicketContext(ticket); }).filter(Boolean).map(function (context) { return renderTicketCard(context, latest && latest.code); }).join("") + '</div></div></section>';
  });
}());
