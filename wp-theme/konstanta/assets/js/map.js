/* Карта отделений. Данные приходят из админки (раздел «Отделения») через data-branches. */
(function () {
  "use strict";

  document.querySelectorAll("[data-region-map]").forEach(function (root) {
    var list;
    try {
      list = JSON.parse(root.getAttribute("data-branches") || "[]");
    } catch (e) {
      list = [];
    }
    var BRANCHES = {};
    list.forEach(function (b) {
      BRANCHES[b.key] = b;
    });
    var sitesLabel = root.getAttribute("data-sites-label") || "В составе:";

    var panelTitle = root.querySelector("[data-map-title]");
    var panelText = root.querySelector("[data-map-text]");
    var panelSites = root.querySelector("[data-map-sites]");
    var listEl = root.querySelector("[data-district-list]");

    function branchByRegion(regionId) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].regions.indexOf(regionId) !== -1) return list[i].key;
      }
      return null;
    }

    function setActive(key) {
      var data = BRANCHES[key];
      if (!data) return;

      root.querySelectorAll(".map-district").forEach(function (el) {
        el.classList.toggle("is-active", data.regions.indexOf(el.getAttribute("data-id")) !== -1);
        el.classList.remove("is-hover");
      });
      root.querySelectorAll(".map-label[data-for]").forEach(function (el) {
        el.classList.toggle("is-on-active", el.getAttribute("data-for") === key);
      });
      if (listEl) {
        listEl.querySelectorAll("button[data-branch]").forEach(function (btn) {
          btn.classList.toggle("is-active", btn.getAttribute("data-branch") === key);
          btn.classList.remove("is-hover");
        });
      }

      if (panelTitle) panelTitle.textContent = data.name;
      if (panelText) panelText.textContent = data.text;
      if (panelSites) {
        panelSites.innerHTML = "";
        if (data.sites && data.sites.length) {
          var strong = document.createElement("strong");
          strong.textContent = sitesLabel;
          panelSites.appendChild(strong);
          data.sites.forEach(function (s) {
            var chip = document.createElement("span");
            chip.className = "site-chip";
            chip.textContent = s;
            panelSites.appendChild(document.createTextNode(" "));
            panelSites.appendChild(chip);
          });
          panelSites.hidden = false;
        } else {
          panelSites.hidden = true;
        }
      }
    }

    function setHover(key, on) {
      var data = BRANCHES[key];
      if (!data) return;
      root.querySelectorAll(".map-district").forEach(function (el) {
        if (el.classList.contains("is-active")) return;
        el.classList.toggle("is-hover", on && data.regions.indexOf(el.getAttribute("data-id")) !== -1);
      });
      root.querySelectorAll(".map-label[data-for]").forEach(function (el) {
        if (el.classList.contains("is-on-active")) return;
        el.classList.toggle("is-on-hover", on && el.getAttribute("data-for") === key);
      });
      if (listEl) {
        listEl.querySelectorAll('button[data-branch="' + key + '"]').forEach(function (btn) {
          if (!btn.classList.contains("is-active")) btn.classList.toggle("is-hover", on);
        });
      }
    }

    function bind(el, key) {
      el.addEventListener("mouseenter", function () {
        setHover(key, true);
      });
      el.addEventListener("mouseleave", function () {
        setHover(key, false);
      });
      el.addEventListener("click", function () {
        setActive(key);
      });
    }

    root.querySelectorAll(".map-district").forEach(function (path) {
      var key = branchByRegion(path.getAttribute("data-id"));
      if (!key) {
        path.classList.add("is-out");
        path.style.pointerEvents = "none";
        return;
      }
      path.setAttribute("tabindex", "0");
      path.setAttribute("role", "button");
      path.setAttribute("aria-label", BRANCHES[key].name);
      bind(path, key);
      path.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setActive(key);
        }
      });
    });

    if (listEl) {
      listEl.querySelectorAll("button[data-branch]").forEach(function (btn) {
        bind(btn, btn.getAttribute("data-branch"));
      });
    }

    var initial = root.getAttribute("data-initial");
    if (initial && BRANCHES[initial]) setActive(initial);
  });
})();
