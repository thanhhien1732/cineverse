(function () {
  "use strict";

  var SHARED_KEYS = [
    "cineverse.users.v1",
    "cineverse.profile-security.dob-migration.v1",
    "cineverse.member-data.v1",
    "cineverse.ticket-registry.v1",
    "cineverse.qr-sequence.v1",
    "cineverse.staff-users.v1"
  ];
  var sharedSet = SHARED_KEYS.reduce(function (result, key) {
    result[key] = true;
    return result;
  }, {});
  var available = false;

  function isSharedKey(key) {
    return Boolean(sharedSet[String(key || "")]);
  }

  function applySnapshot(snapshot) {
    var data = snapshot && snapshot.data && typeof snapshot.data === "object" ? snapshot.data : {};
    SHARED_KEYS.forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(data, key) && data[key] !== null && typeof data[key] !== "undefined") {
        window.localStorage.setItem(key, String(data[key]));
      } else {
        window.localStorage.removeItem(key);
      }
    });
  }

  function getLocalSharedData() {
    var data = {};
    SHARED_KEYS.forEach(function (key) {
      var raw = window.localStorage.getItem(key);
      if (raw !== null) {
        data[key] = raw;
      }
    });
    return data;
  }

  function putSync(key, rawValue) {
    var request = new XMLHttpRequest();
    request.open("PUT", "/api/storage/item", false);
    request.setRequestHeader("Content-Type", "application/json");
    request.send(JSON.stringify({ key: key, value: rawValue }));
    return request.status >= 200 && request.status < 300;
  }

  function seedEmptyServerFromLocal(localData) {
    return Object.keys(localData).every(function (key) {
      return putSync(key, localData[key]);
    });
  }

  function loadInitialSnapshot() {
    try {
      var request = new XMLHttpRequest();
      var snapshot;
      var remoteData;
      var localData;
      request.open("GET", "/api/storage/snapshot", false);
      request.setRequestHeader("Accept", "application/json");
      request.send(null);
      if (request.status >= 200 && request.status < 300) {
        snapshot = JSON.parse(request.responseText || "{}");
        remoteData = snapshot && snapshot.data && typeof snapshot.data === "object" ? snapshot.data : {};
        localData = getLocalSharedData();
        if (Object.keys(remoteData).length === 0 && Object.keys(localData).length > 0) {
          available = seedEmptyServerFromLocal(localData);
          return;
        }
        applySnapshot(snapshot);
        available = true;
      }
    } catch (error) {
      available = false;
    }
  }

  function refresh() {
    return window.fetch("/api/storage/snapshot", {
      method: "GET",
      headers: { "Accept": "application/json" },
      cache: "no-store"
    }).then(function (response) {
      if (!response.ok) {
        throw new Error("Shared storage unavailable");
      }
      return response.json();
    }).then(function (snapshot) {
      applySnapshot(snapshot);
      available = true;
      return true;
    }).catch(function () {
      available = false;
      return false;
    });
  }

  function persist(key, rawValue) {
    if (!isSharedKey(key)) {
      return Promise.resolve(false);
    }
    return window.fetch("/api/storage/item", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: String(key), value: rawValue === null ? null : String(rawValue) }),
      cache: "no-store",
      keepalive: true
    }).then(function (response) {
      if (!response.ok) {
        throw new Error("Shared storage write failed");
      }
      available = true;
      return true;
    }).catch(function () {
      available = false;
      return false;
    });
  }

  function getStatus() {
    return {
      available: available,
      mode: available ? "lan-shared" : "browser-local",
      keys: SHARED_KEYS.slice()
    };
  }

  loadInitialSnapshot();

  window.CineverseSync = {
    isSharedKey: isSharedKey,
    refresh: refresh,
    persist: persist,
    getStatus: getStatus
  };
}());
