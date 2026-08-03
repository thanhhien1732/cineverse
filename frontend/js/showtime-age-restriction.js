(function () {
  "use strict";

  const cv = window.Cineverse;

  if (!cv) {
    throw new Error(
      "Cineverse core phải được tải trước showtime-age-restriction.js.",
    );
  }

  function getCurrentAgeVerification(booking) {
    const movie = cv.getMovie(booking.movieId);
    if (!movie) {
      return null;
    }
    return cv.getAgeVerification(movie, booking.date, cv.getCurrentUser());
  }

  function isHardAgeBlocked(verification) {
    return Boolean(false
      // verification && verification.authenticated && verification.eligible && verification.guardianRequired,
    );
  }

  function clearInvalidShowtimeSelection(booking) {
    const hasSelectedSeats =
      Array.isArray(booking.seats) && booking.seats.length > 0;

    const hasInvalidSelection =
      booking.cinemaId ||
      booking.showtime ||
      booking.format ||
      booking.hall ||
      hasSelectedSeats;

    if (!hasInvalidSelection) {
      return booking;
    }

    return cv.saveBooking({
      cinemaId: "",
      showtime: "",
      format: "",
      hall: "",
      seats: [],
    });
  }

  function syncAgeRestrictionState(booking) {
    const verification = getCurrentAgeVerification(booking);
    const hardAgeBlocked = isHardAgeBlocked(verification);
    let currentBooking = booking;

    if (hardAgeBlocked) {
      currentBooking = clearInvalidShowtimeSelection(currentBooking);
    }

    return {
      booking: currentBooking,
      verification: verification,
      hardAgeBlocked: hardAgeBlocked,
    };
  }

  cv.showtimeAgeRestriction = {
    getCurrentAgeVerification: getCurrentAgeVerification,

    isHardAgeBlocked: isHardAgeBlocked,

    clearInvalidShowtimeSelection: clearInvalidShowtimeSelection,

    syncAgeRestrictionState: syncAgeRestrictionState,
  };
})();
