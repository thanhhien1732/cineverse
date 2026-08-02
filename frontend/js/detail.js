(function () {
  "use strict";

  var cv = window.Cineverse;
  var data = window.CINEVERSE_DATA;

  function renderRelated(currentMovie) {
    var holder = document.querySelector("[data-related-movies]");
    if (!holder) {
      return;
    }
    holder.innerHTML = data.movies.filter(function (movie) {
      return movie.id !== currentMovie.id;
    }).slice(0, 4).map(function (movie) {
      return '' +
        '<a class="related-card" href="movie-detail.html?id=' + movie.id + '">' +
          '<img src="' + movie.poster + '" alt="Poster phim ' + cv.escapeHtml(movie.title) + '">' +
          '<span><strong>' + cv.escapeHtml(movie.title) + '</strong><small>' + cv.escapeHtml(movie.genre.join(" · ")) + '</small></span>' +
        '</a>';
    }).join("");
  }

  function render(movie) {
    document.title = movie.title + " | CINEVERSE";
    var holder = document.querySelector("[data-movie-detail]");
    var bookingButton = movie.status === "now-showing"
      ? '<a class="btn btn-primary" href="showtimes.html?movie=' + movie.id + '">Đặt vé ngay ' + cv.icon("ticket", 18) + '</a>'
      : '<span class="btn btn-muted">Sắp mở bán vé</span>';
    holder.innerHTML = '' +
      '<section class="detail-hero" style="--detail-image:url(\'' + movie.backdrop + '\');--accent:' + movie.accent + '">' +
        '<div class="detail-bg"></div><div class="detail-overlay"></div>' +
        '<div class="container detail-layout">' +
          '<div class="detail-poster"><img src="' + movie.poster + '" alt="Poster phim ' + cv.escapeHtml(movie.title) + '"><span>' + cv.escapeHtml(movie.rating) + '</span></div>' +
          '<div class="detail-content">' +
            '<p class="hero-kicker">CINEVERSE FEATURED PRESENTATION</p>' +
            '<h1>' + cv.escapeHtml(movie.title) + '</h1>' +
            '<p class="detail-tagline">' + cv.escapeHtml(movie.tagline) + '</p>' +
            '<div class="detail-meta"><span>' + cv.icon("star", 16) + cv.escapeHtml(movie.score) + '</span><span>' + cv.icon("clock", 16) + cv.formatDuration(movie.duration) + '</span><span>' + cv.escapeHtml(movie.language) + '</span></div>' +
            '<div class="genre-list">' + movie.genre.map(function (genre) { return '<span>' + cv.escapeHtml(genre) + '</span>'; }).join("") + '</div>' +
            '<div class="hero-actions">' + bookingButton + '<button class="btn btn-ghost" type="button" data-preview-button>' + cv.icon("play", 18) + ' Xem trailer</button></div>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<section class="section detail-main"><div class="container detail-main-grid">' +
        '<article><p class="eyebrow">NỘI DUNG PHIM</p><h2>Câu chuyện</h2><p class="large-copy">' + cv.escapeHtml(movie.description) + '</p></article>' +
        '<aside class="detail-facts"><div><small>Khởi chiếu</small><strong>' + cv.escapeHtml(movie.release) + '</strong></div><div><small>Trình bày</small><strong>' + cv.escapeHtml(movie.director) + '</strong></div><div><small>Dữ liệu</small><strong>' + cv.escapeHtml(movie.cast.join(", ")) + '</strong></div><div><small>Định dạng</small><strong>' + cv.escapeHtml(movie.formats.join(" · ")) + '</strong></div></aside>' +
      '</div></section>';
    document.querySelector("[data-preview-button]").addEventListener("click", function () {
      openpreviewModal(movie);
    });
    renderRelated(movie);
  }

  function previewMedia(movie) {
    if (movie.previewVideo) {
      return '<video class="preview-video" controls autoplay muted playsinline poster="' + movie.backdrop + '"><source src="' + movie.previewVideo + '" type="video/webm"></video>';
    }
    return '<div class="preview-visual" style="--detail-image:url(\'' + movie.backdrop + '\')"><span>' + cv.icon("play", 38) + '</span></div>';
  }

  function openpreviewModal(movie) {
    var modal = document.createElement("div");
    modal.className = "modal-backdrop";
    modal.innerHTML = '' +
      '<div class="preview-modal" role="dialog" aria-modal="true" aria-label="preview giới thiệu">' +
        '<button type="button" class="modal-close" data-modal-close aria-label="Đóng">' + cv.icon("close", 20) + '</button>' +
        previewMedia(movie) +
        '<div class="preview-copy"><p class="eyebrow">FEATURED preview</p><h3>' + cv.escapeHtml(movie.title) + '</h3><p>' + (movie.previewVideo ? 'Khám phá video giới thiệu nổi bật của bộ phim.' : 'Khám phá những khung hình nổi bật và thông tin mới nhất của bộ phim.') + '</p></div>' +
      '</div>';
    document.body.appendChild(modal);
    window.setTimeout(function () {
      modal.classList.add("is-visible");
    }, 20);
    function closeModal() {
      var video = modal.querySelector("video");
      if (video) {
        video.pause();
      }
      modal.classList.remove("is-visible");
      window.setTimeout(function () {
        modal.remove();
      }, 220);
    }
    modal.addEventListener("click", function (event) {
      if (event.target === modal) {
        closeModal();
      }
    });
    modal.querySelector("[data-modal-close]").addEventListener("click", closeModal);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var query = cv.parseQuery();
    var movie = cv.getMovie(query.id || "minions-monsters");
    if (!movie) {
      window.location.href = "movies.html";
      return;
    }
    render(movie);
  });
}());
