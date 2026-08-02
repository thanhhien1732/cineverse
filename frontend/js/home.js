(function () {
  "use strict";

  var data = window.CINEVERSE_DATA;
  var cv = window.Cineverse;
  var featured = data.movies.filter(function (movie) {
    return movie.featured;
  });
  var activeIndex = 0;
  var timer = null;

  function movieCard(movie, compact) {
    return '' +
      '<article class="movie-card' + (compact ? ' movie-card-compact' : '') + '">' +
        '<a class="movie-card-image" href="movie-detail.html?id=' + movie.id + '">' +
          '<img src="' + movie.poster + '" alt="Poster phim ' + cv.escapeHtml(movie.title) + '">' +
          '<span class="movie-rating">' + cv.escapeHtml(movie.rating) + '</span>' +
          '<span class="movie-overlay"><span>' + cv.icon("play", 18) + '</span></span>' +
        '</a>' +
        '<div class="movie-card-body">' +
          '<p class="eyebrow">' + cv.escapeHtml(movie.genre.join(" · ")) + '</p>' +
          '<h3><a href="movie-detail.html?id=' + movie.id + '">' + cv.escapeHtml(movie.title) + '</a></h3>' +
          '<div class="movie-meta-row"><span>' + cv.icon("clock", 15) + cv.formatDuration(movie.duration) + '</span><span>' + cv.escapeHtml(movie.release) + '</span></div>' +
          '<div class="card-actions"><a class="text-link" href="movie-detail.html?id=' + movie.id + '">Chi tiết ' + cv.icon("arrowRight", 16) + '</a></div>' +
        '</div>' +
      '</article>';
  }

  function getHeroPrimaryAction(movie) {
    if (movie.status === "now-showing") {
      return '<a class="btn btn-primary" href="showtimes.html?movie=' + movie.id + '">Đặt vé ngay ' + cv.icon("ticket", 18) + '</a>';
    }
    return '<a class="btn btn-primary" href="movie-detail.html?id=' + movie.id + '">Khám phá phim ' + cv.icon("arrowRight", 18) + '</a>';
  }

  function getHeroMedia(movie) {
    var background = '<div class="hero-bg"></div>';
    if (!movie.previewVideo) {
      return background;
    }
    return background +
      '<video class="hero-bg-video" autoplay muted loop playsinline poster="' + movie.backdrop + '" aria-hidden="true">' +
        '<source src="' + movie.previewVideo + '" type="video/webm">' +
      '</video>';
  }


  function getHeroTitleClass(movie) {
    var title = String(movie.displayTitle || movie.title || "");
    if (title.length >= 26) {
      return "hero-title is-extra-long";
    }
    if (title.length >= 17) {
      return "hero-title is-long";
    }
    return "hero-title";
  }

  function toRootPath(path) {
    return "/" + String(path).replace(/^\/+/, "");
  }

  function renderHero() {
    var holder = document.querySelector("[data-home-hero]");
    if (!holder || featured.length === 0) {
      return;
    }
    var movie = featured[activeIndex];
    holder.innerHTML = '' +
      '<section class="home-hero" style="--hero-image:url(\'' + toRootPath(movie.backdrop) + '\');--accent:' + movie.accent + '">' +
        getHeroMedia(movie) +
        '<div class="hero-vignette"></div>' +
        '<div class="container hero-content">' +
          '<p class="hero-kicker">' + (movie.status === "now-showing" ? 'ĐANG CHIẾU TẠI CINEVERSE' : 'SẮP CHIẾU TẠI CINEVERSE') + '</p>' +
          '<h1 class="' + getHeroTitleClass(movie) + '">' + cv.escapeHtml(movie.displayTitle || movie.title) + '</h1>' +
          '<p class="hero-tagline">' + cv.escapeHtml(movie.tagline) + '</p>' +
          
          '<div class="hero-actions">' +
            getHeroPrimaryAction(movie) +
            '<button class="btn btn-ghost" type="button" data-hero-preview>' + cv.icon("play", 18) + ' Xem trailer</button>' +
          '</div>' +
        '</div>' +
        '<div class="container hero-switcher">' +
          '<div class="hero-switcher-head"><span>Phim nổi bật</span><div class="hero-switcher-arrows"><button type="button" data-hero-prev aria-label="Phim trước">' + cv.icon("arrowLeft", 16) + '</button><button type="button" data-hero-next aria-label="Phim tiếp theo">' + cv.icon("arrowRight", 16) + '</button></div></div>' +
          '<div class="hero-tabs">' + featured.map(function (item, index) {
            return '<button type="button" class="hero-tab' + (index === activeIndex ? ' is-active' : '') + '" data-hero-index="' + index + '"><span>' + String(index + 1).padStart(2, "0") + '</span><strong>' + cv.escapeHtml(item.title) + '</strong><i></i></button>';
          }).join("") + '</div>' +
        '</div>' +
      '</section>';
    holder.querySelector("[data-hero-prev]").addEventListener("click", function () {
      setActiveHero(activeIndex - 1);
    });
    holder.querySelector("[data-hero-next]").addEventListener("click", function () {
      setActiveHero(activeIndex + 1);
    });
    holder.querySelector("[data-hero-preview]").addEventListener("click", function () {
      openpreviewModal(movie);
    });
    holder.querySelectorAll("[data-hero-index]").forEach(function (button) {
      button.addEventListener("click", function () {
        setActiveHero(Number(button.getAttribute("data-hero-index")));
      });
    });
  }

  function setActiveHero(index) {
    if (index < 0) {
      activeIndex = featured.length - 1;
    } else if (index >= featured.length) {
      activeIndex = 0;
    } else {
      activeIndex = index;
    }
    renderHero();
    restartTimer();
  }

  function restartTimer() {
    window.clearInterval(timer);
    timer = window.setInterval(function () {
      setActiveHero(activeIndex + 1);
    }, 6500);
  }

  function renderMovies() {
    var showing = document.querySelector("[data-now-showing-grid]");
    var upcoming = document.querySelector("[data-coming-soon-grid]");
    if (showing) {
      showing.innerHTML = data.movies.filter(function (movie) {
        return movie.status === "now-showing";
      }).slice(0, 4).map(function (movie) {
        return movieCard(movie, false);
      }).join("");
    }
    if (upcoming) {
      upcoming.innerHTML = data.movies.filter(function (movie) {
        return movie.status === "coming-soon";
      }).slice(0, 4).map(function (movie) {
        return movieCard(movie, true);
      }).join("");
    }
  }

  function renderExperience() {
    var holder = document.querySelector("[data-experience-strip]");
    if (!holder) {
      return;
    }
    var items = [
      ["IMAX", "Khung hình cực đại", "Không gian màn ảnh mở rộng cho từng chi tiết điện ảnh."],
      ["4DX", "Chuyển động đa giác quan", "Hiệu ứng ghế, gió và rung chuyển đồng bộ với cảnh phim."],
      ["ATMOS", "Âm thanh vòm sống động", "Từng chuyển động âm thanh được định vị quanh khán phòng."]
    ];
    holder.innerHTML = items.map(function (item, index) {
      return '<article class="experience-card"><span>0' + (index + 1) + '</span><h3>' + item[0] + '</h3><strong>' + item[1] + '</strong><p>' + item[2] + '</p></article>';
    }).join("");
  }

  function previewMarkup(movie) {
    if (movie.previewVideo) {
      return '<video class="preview-video" controls autoplay muted playsinline poster="' + movie.backdrop + '"><source src="' + movie.previewVideo + '" type="video/webm"></video>';
    }
    return '<div class="preview-image" style="--preview-image:url(\'' + movie.backdrop + '\')"><span>' + cv.icon("play", 42) + '</span></div>';
  }

  function openpreviewModal(movie) {
    var modal = document.createElement("div");
    modal.className = "modal-backdrop";
    modal.innerHTML = '' +
      '<div class="preview-modal home-preview-modal" role="dialog" aria-modal="true" aria-label="preview phim">' +
        '<button type="button" class="modal-close" data-modal-close aria-label="Đóng">' + cv.icon("close", 20) + '</button>' +
        previewMarkup(movie) +
        '<div class="preview-copy"><p class="eyebrow">FEATURED preview</p><h3>' + cv.escapeHtml(movie.title) + '</h3><p>' + (movie.previewVideo ? 'Khám phá video giới thiệu nổi bật của bộ phim.' : 'Khám phá những khung hình nổi bật và thông tin mới nhất của bộ phim.') + '</p><a class="text-link" href="movie-detail.html?id=' + movie.id + '">Mở trang chi tiết ' + cv.icon("arrowRight", 16) + '</a></div>' +
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

  function renderFeaturedVideos() {
    var holder = document.querySelector("[data-featured-videos]");
    if (!holder) {
      return;
    }
    holder.innerHTML = data.featuredVideos.map(function (item) {
      var movie = cv.getMovie(item.movieId);
      return '' +
        '<button class="video-card" type="button" data-preview-movie="' + movie.id + '">' +
          '<span class="video-card-image"><img src="' + item.image + '" alt="Ảnh preview ' + cv.escapeHtml(item.title) + '"><i>' + cv.icon("play", 22) + '</i><em>' + cv.escapeHtml(item.duration) + '</em></span>' +
          '<span class="video-card-copy"><small>' + cv.escapeHtml(item.label) + '</small><strong>' + cv.escapeHtml(item.title) + '</strong></span>' +
        '</button>';
    }).join("");
    holder.querySelectorAll("[data-preview-movie]").forEach(function (button) {
      button.addEventListener("click", function () {
        openpreviewModal(cv.getMovie(button.getAttribute("data-preview-movie")));
      });
    });
  }

  function renderPromos() {
    var holder = document.querySelector("[data-promo-grid]");
    if (!holder) {
      return;
    }
    holder.innerHTML = data.promos.map(function (promo) {
      return '' +
        '<article class="promo-card">' +
          '<img src="' + promo.image + '" alt="' + cv.escapeHtml(promo.title) + '">' +
          '<div class="promo-card-overlay"><p class="eyebrow">' + cv.escapeHtml(promo.label) + '</p><h3>' + cv.escapeHtml(promo.title) + '</h3><span>' + cv.escapeHtml(promo.copy) + '</span></div>' +
        '</article>';
    }).join("");
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderHero();
    renderMovies();
    renderExperience();
    renderFeaturedVideos();
    renderPromos();
    restartTimer();
  });
}());
