(function () {
  "use strict";

  const data = window.CINEVERSE_DATA;
  const cv = window.Cineverse;

  const state = {
    status: "all",
    genre: "all",
    search: ""
  };

  function movieCard(movie) {
    const movieUrl = "movie-detail.html?id=" + encodeURIComponent(movie.id);
    const actionUrl = movie.status === "now-showing"
      ? "showtimes.html?movie=" + encodeURIComponent(movie.id)
      : movieUrl;

    const statusText = movie.status === "now-showing" ? "Đang chiếu" : "Sắp chiếu";
    const releaseText = movie.status === "now-showing" ? "Khởi chiếu " : "Dự kiến ";
    const actionLabel = movie.status === "now-showing" ? "Đặt vé" : "Chi tiết";

    return '' +
      '<article class="catalog-card">' +
      '<a class="catalog-poster" href="' + movieUrl + '">' +
      '<img src="' + cv.escapeHtml(movie.poster) + '" alt="Poster phim ' + cv.escapeHtml(movie.title) + '">' +
      '<span class="catalog-status">' + statusText + '</span>' +
      '<span class="movie-overlay"><span>' + cv.icon("play", 20) + '</span></span>' +
      '</a>' +
      '<div class="catalog-body">' +
      '<p class="eyebrow">' + cv.escapeHtml(movie.genre.join(" · ")) + '</p>' +
      '<h2><a href="' + movieUrl + '">' + cv.escapeHtml(movie.title) + '</a></h2>' +
      '<div class="movie-meta-row">' +
      '<span>' + cv.icon("clock", 15) + cv.formatDuration(movie.duration) + '</span>' +
      '<span>' + cv.escapeHtml(movie.rating) + '</span>' +
      '</div>' +
      '<p class="catalog-copy">' + cv.escapeHtml(movie.shortDescription) + '</p>' +
      '<div class="catalog-footer">' +
      '<span>' + releaseText + cv.escapeHtml(movie.release) + '</span>' +
      '<a class="circle-link" href="' + actionUrl + '" aria-label="' + actionLabel + '">' +
      cv.icon("arrowRight", 18) +
      '</a>' +
      '</div>' +
      '</div>' +
      '</article>';
  }

  function getFilteredMovies() {
    return data.movies.filter(function (movie) {
      const titleSearchMatch = movie.title.toLowerCase().indexOf(state.search.toLowerCase()) !== -1;

      const genreSearchMatch = movie.genre.join(" ").toLowerCase().indexOf(state.search.toLowerCase()) !== -1;

      const searchMatch = titleSearchMatch || genreSearchMatch;

      const genreMatch = state.genre === 'all' || movie.genre.indexOf(state.genre) !== -1;

      const statusMatch = state.status === 'all' || movie.status.indexOf(state.status) !== -1;

      return searchMatch && genreMatch && statusMatch
    })
  }

  function render() {
    const grid = document.querySelector("[data-catalog-grid]");
    const count = document.querySelector("[data-catalog-count]");

    if (!grid || !count) {
      return;
    }

    const movies = getFilteredMovies();

    count.textContent = String(movies.length) + " phim";

    grid.innerHTML = movies.length
      ? movies.map(movieCard).join("")
      : '<div class="empty-state">' +
      '<span>' + cv.icon("search", 28) + '</span>' +
      '<h3>Không tìm thấy phim phù hợp</h3>' +
      '<p>Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>' +
      '</div>';
  }

  function setStatus(value) {
    state.status = value;

    document.querySelectorAll("[data-status-filter]").forEach(function (button) {
      button.classList.toggle(
        "is-active",
        button.getAttribute("data-status-filter") === value
      );
    });

    render();
  }

  function applyHashFilter() {
    const hash = window.location.hash;

    if (hash === "#now-showing") {
      setStatus("now-showing");
    } else if (hash === "#coming-soon") {
      setStatus("coming-soon");
    } else {
      setStatus("all");
    }

    if (cv.syncNavigationState) {
      cv.syncNavigationState();
    }
  }

  function updateStatusHash(value) {
    if (value === "now-showing") {
      if (window.location.hash === "#now-showing") {
        applyHashFilter();
      } else {
        window.location.hash = "now-showing";
      }
      return;
    }

    if (value === "coming-soon") {
      if (window.location.hash === "#coming-soon") {
        applyHashFilter();
      } else {
        window.location.hash = "coming-soon";
      }
      return;
    }

    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search
    );

    applyHashFilter();
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-status-filter]").forEach(function (button) {
      button.addEventListener("click", function () {
        updateStatusHash(button.getAttribute("data-status-filter"));
      });
    });

    const genreSelect = document.querySelector("[data-genre-filter]");
    const searchInput = document.querySelector("[data-search-input]");

    if (genreSelect) {
      const genreSelectWrap = genreSelect.closest(".filter-select-wrap");

      genreSelect.addEventListener("pointerdown", function () {
        if (genreSelectWrap) {
          genreSelectWrap.classList.toggle("is-open");
        }
      });

      genreSelect.addEventListener("change", function (event) {
        state.genre = event.target.value;

        if (genreSelectWrap) {
          genreSelectWrap.classList.remove("is-open");
        }

        render();
      });

      genreSelect.addEventListener("blur", function () {
        if (genreSelectWrap) {
          genreSelectWrap.classList.remove("is-open");
        }
      });

      genreSelect.addEventListener("keydown", function (event) {
        if (
          event.key === "Escape" ||
          event.key === "Tab" ||
          event.key === "Enter"
        ) {
          if (genreSelectWrap) {
            genreSelectWrap.classList.remove("is-open");
          }
        }
      });

      document.addEventListener("pointerdown", function (event) {
        if (genreSelectWrap && !genreSelectWrap.contains(event.target)) {
          genreSelectWrap.classList.remove("is-open");
        }
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", function (event) {
        state.search = event.target.value.trim();
        render();
      });
    }

    window.addEventListener("hashchange", applyHashFilter);

    applyHashFilter();
  });
}());