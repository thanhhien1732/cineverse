(function () {
  "use strict";

  var cv = window.Cineverse;
  var data = window.CINEVERSE_DATA;

  if (!cv) {
    throw new Error(
      "Cineverse core phải được tải trước showtimes.js."
    );
  }

  if (!data) {
    throw new Error(
      "CINEVERSE_DATA phải được tải trước showtimes.js."
    );
  }

  if (!cv.showtimeAgeRestriction) {
    throw new Error(
      "showtime-age-restriction.js phải được tải trước showtimes.js."
    );
  }

  var ageRestriction = cv.showtimeAgeRestriction;
  var booking = cv.getBooking();

  function ensureBookingDate() {
    var dates = cv.getUpcomingDates(7);

    var hasValidDate = dates.some(function (date) {
      return date.value === booking.date;
    });

    if (!hasValidDate) {
      booking = cv.saveBooking({
        date: dates[0].value,
        cinemaId: "",
        showtime: "",
        format: "",
        hall: "",
        seats: []
      });
    }

    return dates;
  }

  function renderAgeRestrictionState(hardAgeBlocked) {
    var datePanel =
      document.querySelector("[data-date-panel]");

    var cinemaPanel =
      document.querySelector("[data-cinema-panel]");

    var banner =
      document.querySelector(
        "[data-age-restriction-banner]"
      );

    datePanel.hidden = hardAgeBlocked;
    cinemaPanel.hidden = hardAgeBlocked;

    if (!hardAgeBlocked) {
      banner.hidden = true;
      banner.innerHTML = "";
      return;
    }

    banner.hidden = false;

    banner.innerHTML =
      '<span class="showtime-age-block-icon" aria-hidden="true">' +
        cv.icon("birthday", 20) +
      "</span>" +

      '<div class="showtime-age-block-copy">' +
        "<strong>" +
          "Phim không phù hợp với độ tuổi của tài khoản" +
        "</strong>" +

        "<small>" +
          "Vui lòng chọn một phim khác phù hợp với độ tuổi " +
          "để tiếp tục đặt vé." +
        "</small>" +
      "</div>";
  }

  function renderMoviePicker() {
    var holder =
      document.querySelector("[data-movie-picker]");

    var movies = data.movies.filter(function (movie) {
      return movie.status === "now-showing";
    });

    holder.innerHTML = movies.map(function (movie) {
      return (
        '<button type="button" class="picker-movie' +
          (
            movie.id === booking.movieId
              ? " is-active"
              : ""
          ) +
          '" data-movie-id="' +
          movie.id +
        '">' +

          '<img src="' +
            movie.poster +
            '" alt="">' +

          "<span>" +
            "<strong>" +
              cv.escapeHtml(movie.title) +
            "</strong>" +

            "<small>" +
              cv.escapeHtml(
                movie.genre.join(" · ")
              ) +
            "</small>" +

            "<em>" +
              cv.escapeHtml(movie.rating) +
            "</em>" +
          "</span>" +
        "</button>"
      );
    }).join("");

    holder
      .querySelectorAll("[data-movie-id]")
      .forEach(function (button) {
        button.addEventListener("click", function () {
          booking = cv.saveBooking({
            movieId:
              button.getAttribute("data-movie-id"),

            cinemaId: "",
            showtime: "",
            format: "",
            hall: "",
            seats: []
          });

          renderAll();
        });
      });
  }

  function renderDatePicker(dates) {
    var holder =
      document.querySelector("[data-date-picker]");

    holder.innerHTML = dates.map(function (date) {
      return (
        '<button type="button" class="date-chip' +
          (
            date.value === booking.date
              ? " is-active"
              : ""
          ) +
          '" data-date="' +
          date.value +
        '">' +

          "<small>" +
            cv.escapeHtml(date.day) +
          "</small>" +

          "<strong>" +
            cv.escapeHtml(
              String(date.date)
            ) +
          "</strong>" +

          "<span>" +
            cv.escapeHtml(
              String(date.month)
            ) +
          "</span>" +
        "</button>"
      );
    }).join("");

    holder
      .querySelectorAll("[data-date]")
      .forEach(function (button) {
        button.addEventListener("click", function () {
          booking = cv.saveBooking({
            date:
              button.getAttribute("data-date"),

            cinemaId: "",
            showtime: "",
            format: "",
            hall: "",
            seats: []
          });

          renderAll();
        });
      });
  }

  function renderCinemas() {
    var holder =
      document.querySelector("[data-cinema-list]");

    holder.innerHTML = data.cinemas
      .map(function (cinema) {
        var times = cv.getShowtimes(
          booking.movieId,
          cinema.id,
          booking.date
        );

        return (
          '<article class="cinema-card' +
            (
              cinema.id === booking.cinemaId
                ? " is-selected"
                : ""
            ) +
          '">' +

            '<div class="cinema-head">' +
              "<div>" +
                '<p class="eyebrow">' +
                  cv.escapeHtml(cinema.distance) +
                  " · TP. HỒ CHÍ MINH" +
                "</p>" +

                "<h3>" +
                  cv.escapeHtml(cinema.name) +
                "</h3>" +

                "<p>" +
                  cv.icon("location", 16) +
                  cv.escapeHtml(cinema.address) +
                "</p>" +
              "</div>" +

              '<div class="cinema-features">' +
                cinema.features
                  .map(function (feature) {
                    return (
                      "<span>" +
                        cv.escapeHtml(feature) +
                      "</span>"
                    );
                  })
                  .join("") +
              "</div>" +
            "</div>" +

            '<div class="showtime-grid">' +
              times
                .map(function (item) {
                  var selected =
                    cinema.id === booking.cinemaId &&
                    item.time === booking.showtime &&
                    item.format === booking.format;

                  return (
                    '<button type="button" class="showtime-chip' +
                      (
                        selected
                          ? " is-active"
                          : ""
                      ) +
                      '" data-cinema="' +
                      cinema.id +
                      '" data-time="' +
                      item.time +
                      '" data-format="' +
                      item.format +
                      '" data-hall="' +
                      item.hall +
                    '">' +

                      "<strong>" +
                        cv.escapeHtml(item.time) +
                      "</strong>" +

                      "<span>" +
                        cv.escapeHtml(item.format) +
                      "</span>" +
                    "</button>"
                  );
                })
                .join("") +
            "</div>" +
          "</article>"
        );
      })
      .join("");

    holder
      .querySelectorAll("[data-cinema]")
      .forEach(function (button) {
        button.addEventListener("click", function () {
          booking = cv.saveBooking({
            cinemaId:
              button.getAttribute("data-cinema"),

            showtime:
              button.getAttribute("data-time"),

            format:
              button.getAttribute("data-format"),

            hall:
              button.getAttribute("data-hall"),

            seats: []
          });

          renderAll();

          cv.showToast(
            "Đã chọn suất chiếu " +
              booking.showtime +
              ".",

            "success"
          );
        });
      });
  }

  function renderSummary(
    verification,
    hardAgeBlocked
  ) {
    var holder =
      document.querySelector(
        "[data-showtime-summary]"
      );

    var movie =
      cv.getMovie(booking.movieId);

    var cinema =
      cv.getCinema(booking.cinemaId);

    var policy = cv.getRatingPolicy(
      movie
        ? movie.rating
        : "NR"
    );

    var ageNoteClass =
      verification &&
      verification.authenticated &&
      verification.eligible
        ? " is-verified"
        : " is-warning";

    var statusMessage =
      verification &&
      verification.authenticated
        ? verification.message
        : (
            "Điều kiện độ tuổi sẽ được kiểm tra " +
            "trước khi thanh toán."
          );

    var dateLabel =
      hardAgeBlocked
        ? "Không khả dụng"
        : cv.formatDate(booking.date);

    var cinemaLabel =
      hardAgeBlocked
        ? "Không khả dụng"
        : cinema
          ? cinema.name
          : "Chưa chọn";

    var showtimeLabel =
      hardAgeBlocked
        ? "Không khả dụng"
        : booking.showtime
          ? (
              booking.showtime +
              (
                booking.format
                  ? " · " + booking.format
                  : ""
              )
            )
          : "Chưa chọn";

    var continueDisabled =
      hardAgeBlocked ||
      !booking.showtime;

    holder.innerHTML =
      '<div class="summary-title">' +
        "<span>" +
          cv.icon("ticket", 18) +
        "</span>" +

        "<div>" +
          "<small>" +
            "LỰA CHỌN HIỆN TẠI" +
          "</small>" +

          "<strong>" +
            cv.escapeHtml(
              movie
                ? movie.title
                : "Chọn phim"
            ) +
          "</strong>" +
        "</div>" +
      "</div>" +

      '<dl class="summary-list">' +
        "<div>" +
          "<dt>Phân loại</dt>" +

          "<dd>" +
            '<span class="rating-badge">' +
              cv.escapeHtml(policy.code) +
            "</span>" +
          "</dd>" +
        "</div>" +

        "<div>" +
          "<dt>Ngày</dt>" +

          "<dd>" +
            cv.escapeHtml(dateLabel) +
          "</dd>" +
        "</div>" +

        "<div>" +
          "<dt>Rạp</dt>" +

          "<dd>" +
            cv.escapeHtml(cinemaLabel) +
          "</dd>" +
        "</div>" +

        "<div>" +
          "<dt>Suất chiếu</dt>" +

          "<dd>" +
            cv.escapeHtml(showtimeLabel) +
          "</dd>" +
        "</div>" +
      "</dl>" +

      '<div class="summary-age-note' +
        ageNoteClass +
      '">' +

        '<span class="summary-age-note-icon" aria-hidden="true">' +
          cv.icon("birthday", 17) +
        "</span>" +

        '<div class="summary-age-note-copy">' +
          "<p>" +
            cv.escapeHtml(
              policy.description
            ) +
          "</p>" +

          '<p class="summary-age-note-status">' +
            cv.escapeHtml(
              statusMessage
            ) +
          "</p>" +
        "</div>" +
      "</div>" +

      '<a class="btn btn-primary btn-block' +
        (
          continueDisabled
            ? " is-disabled"
            : ""
        ) +

        '" href="' +
        (
          continueDisabled
            ? "#"
            : "seats.html"
        ) +

        '" data-continue aria-disabled="' +
        (
          continueDisabled
            ? "true"
            : "false"
        ) +

        '"' +

        (
          continueDisabled
            ? ' tabindex="-1"'
            : ""
        ) +

      ">" +
        "Chọn ghế " +
        cv.icon("arrowRight", 18) +
      "</a>";

    var button =
      holder.querySelector("[data-continue]");

    if (continueDisabled) {
      button.addEventListener(
        "click",
        function (event) {
          event.preventDefault();

          if (hardAgeBlocked) {
            cv.showToast(
              "Phim này không phù hợp với độ tuổi " +
                "của tài khoản hiện tại.",

              "error"
            );

            return;
          }

          cv.showToast(
            "Vui lòng chọn một suất chiếu " +
              "trước khi tiếp tục.",

            "error"
          );
        }
      );
    }
  }

  function renderAll() {
    var dates = ensureBookingDate();

    var ageState =
      ageRestriction
        .syncAgeRestrictionState(booking);

    booking = ageState.booking;

    renderMoviePicker();

    renderAgeRestrictionState(
      ageState.hardAgeBlocked
    );

    if (ageState.hardAgeBlocked) {
      document
        .querySelector("[data-date-picker]")
        .innerHTML = "";

      document
        .querySelector("[data-cinema-list]")
        .innerHTML = "";
    } else {
      renderDatePicker(dates);
      renderCinemas();
    }

    renderSummary(
      ageState.verification,
      ageState.hardAgeBlocked
    );
  }

  document.addEventListener(
    "DOMContentLoaded",
    function () {
      cv.renderSteps(1);

      var query = cv.parseQuery();
      var movie = cv.getMovie(query.movie);

      if (
        movie &&
        movie.status === "now-showing"
      ) {
        booking = cv.saveBooking({
          movieId: movie.id,
          cinemaId: "",
          showtime: "",
          format: "",
          hall: "",
          seats: []
        });
      }

      if (
        !booking.movieId ||
        !cv.getMovie(booking.movieId) ||
        cv.getMovie(booking.movieId).status !==
          "now-showing"
      ) {
        booking = cv.saveBooking({
          movieId: "minions-monsters"
        });
      }

      renderAll();
    }
  );
}());