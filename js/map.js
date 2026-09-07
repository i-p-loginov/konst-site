(function () {
  "use strict";

  /* Структура отделений по утверждённой зоне покрытия Константы */
  var BRANCHES = {
    kirishskoe: {
      name: "Киришское отделение",
      short: "Киришское",
      regions: ["kirishskiy"],
      sites: [],
      text: "Киришское отделение ООО «Константа». Технологическое присоединение, увеличение мощности и интеллектуальный учёт."
    },
    volkhovskoe: {
      name: "Волховское отделение",
      short: "Волховское",
      regions: ["volkhovskiy"],
      sites: [],
      text: "Волховское отделение. Сопровождение подключения и работ в зоне ответственности отделения."
    },
    vyborgskoe: {
      name: "Выборгское отделение",
      short: "Выборгское",
      regions: ["vyborgskiy"],
      sites: [],
      text: "Выборгское отделение. Документы, техприсоединение и увеличение мощности под ключ."
    },
    gatchinskoe: {
      name: "Гатчинское отделение",
      short: "Гатчинское",
      regions: ["gatchinskiy"],
      sites: [],
      text: "Гатчинское отделение. Оформление заявок, выполнение ТУ и сопровождение до включения."
    },
    luzhskoe: {
      name: "Лужское отделение",
      short: "Лужское",
      regions: ["luzhskiy"],
      sites: [],
      text: "Лужское отделение. Технологическое присоединение и увеличение электрической мощности."
    },
    lodeynopolskoe: {
      name: "Лодейнопольское отделение",
      short: "Лодейнопольское",
      regions: ["lodeynopolskiy"],
      sites: [],
      text: "Лодейнопольское отделение. Подключение объектов и сопровождение клиентов в зоне отделения."
    },
    kirovskoe: {
      name: "Кировское отделение",
      short: "Кировское",
      regions: ["kirovskiy"],
      sites: [],
      text: "Кировское отделение. Работы по подключению и увеличению мощности."
    },
    tosnenskoe: {
      name: "Тосненское отделение",
      short: "Тосненское",
      regions: ["tosnenskiy"],
      sites: [],
      text: "Тосненское отделение. Техприсоединение и услуги по приборам учёта."
    },
    tikhvinskoe: {
      name: "Тихвинское отделение",
      short: "Тихвинское",
      regions: ["tikhvinskiy", "boksitogorskiy"],
      sites: ["Бокситогорский участок"],
      text: "Тихвинское отделение. В состав входит Бокситогорский участок."
    },
    prigorodnoe: {
      name: "Пригородное отделение",
      short: "Пригородное",
      regions: ["vsevolozhskiy"],
      sites: ["Всеволожский участок"],
      text: "Пригородное отделение. В состав входит Всеволожский участок."
    },
    kingiseppskoe: {
      name: "Кингисеппское отделение",
      short: "Кингисеппское",
      regions: ["kingiseppskiy", "slantsevskiy", "volosovskiy"],
      sites: ["Сланцевский участок", "Волосовский участок"],
      text: "Кингисеппское отделение. В состав входят Сланцевский и Волосовский участки."
    },
    sosnovoborskiy: {
      name: "Сосновоборский участок",
      short: "Сосновоборский",
      regions: ["sosnovoborskiy"],
      sites: [],
      text: "Сосновоборский участок — самостоятельное структурное подразделение (не входит в состав отделений)."
    }
  };

  var ORDER = [
    "volkhovskoe",
    "vyborgskoe",
    "gatchinskoe",
    "kingiseppskoe",
    "kirishskoe",
    "kirovskoe",
    "lodeynopolskoe",
    "luzhskoe",
    "prigorodnoe",
    "sosnovoborskiy",
    "tikhvinskoe",
    "tosnenskoe"
  ];

  var root = document.querySelector("[data-region-map]");
  if (!root) return;

  var panelTitle = root.querySelector("[data-map-title]");
  var panelText = root.querySelector("[data-map-text]");
  var panelSites = root.querySelector("[data-map-sites]");
  var list = root.querySelector("[data-district-list]");

  function regionsOf(branchId) {
    return (BRANCHES[branchId] && BRANCHES[branchId].regions) || [];
  }

  function setActive(branchId) {
    var data = BRANCHES[branchId];
    if (!data) return;
    var regs = data.regions;

    root.querySelectorAll(".map-district").forEach(function (el) {
      var rid = el.getAttribute("data-id");
      var on = regs.indexOf(rid) !== -1;
      el.classList.toggle("is-active", on);
      el.classList.remove("is-hover");
    });

    root.querySelectorAll(".map-label[data-for]").forEach(function (el) {
      var forId = el.getAttribute("data-for");
      var on = forId === branchId || regs.indexOf(forId) !== -1;
      el.classList.toggle("is-on-active", on);
    });

    if (list) {
      list.querySelectorAll("button[data-branch]").forEach(function (btn) {
        btn.classList.toggle("is-active", btn.getAttribute("data-branch") === branchId);
        btn.classList.remove("is-hover");
      });
    }

    if (panelTitle) panelTitle.textContent = data.name;
    if (panelText) panelText.textContent = data.text;
    if (panelSites) {
      if (data.sites && data.sites.length) {
        panelSites.hidden = false;
        panelSites.innerHTML =
          "<strong>В составе:</strong> " +
          data.sites
            .map(function (s) {
              return "<span class=\"site-chip\">" + s + "</span>";
            })
            .join(" ");
      } else {
        panelSites.hidden = true;
        panelSites.innerHTML = "";
      }
    }
  }

  function setHover(branchId, on) {
    var data = BRANCHES[branchId];
    if (!data) return;
    var regs = data.regions;

    root.querySelectorAll(".map-district").forEach(function (el) {
      if (el.classList.contains("is-active")) return;
      var rid = el.getAttribute("data-id");
      el.classList.toggle("is-hover", on && regs.indexOf(rid) !== -1);
    });

    root.querySelectorAll(".map-label[data-for]").forEach(function (el) {
      if (el.classList.contains("is-on-active")) return;
      var forId = el.getAttribute("data-for");
      el.classList.toggle(
        "is-on-hover",
        on && (forId === branchId || regs.indexOf(forId) !== -1)
      );
    });

    if (list) {
      list.querySelectorAll('button[data-branch="' + branchId + '"]').forEach(function (btn) {
        if (!btn.classList.contains("is-active")) {
          btn.classList.toggle("is-hover", on);
        }
      });
    }
  }

  function branchByRegion(regionId) {
    var id;
    for (id in BRANCHES) {
      if (BRANCHES[id].regions.indexOf(regionId) !== -1) return id;
    }
    return null;
  }

  function bindMap() {
    root.querySelectorAll(".map-district").forEach(function (path) {
      var regionId = path.getAttribute("data-id");
      var branchId = path.getAttribute("data-branch") || branchByRegion(regionId);
      if (!branchId) {
        path.classList.add("is-out");
        path.style.pointerEvents = "none";
        return;
      }
      path.setAttribute("data-branch", branchId);
      path.setAttribute("tabindex", "0");
      path.setAttribute("role", "button");
      path.setAttribute("aria-label", BRANCHES[branchId].name);
      path.addEventListener("mouseenter", function () {
        setHover(branchId, true);
      });
      path.addEventListener("mouseleave", function () {
        setHover(branchId, false);
      });
      path.addEventListener("click", function () {
        setActive(branchId);
      });
      path.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setActive(branchId);
        }
      });
    });
  }

  if (list) {
    ORDER.forEach(function (id) {
      var data = BRANCHES[id];
      if (!data) return;
      var li = document.createElement("li");
      li.className = "branch-item";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-branch", id);
      btn.textContent = data.name;
      btn.addEventListener("mouseenter", function () {
        setHover(id, true);
      });
      btn.addEventListener("mouseleave", function () {
        setHover(id, false);
      });
      btn.addEventListener("click", function () {
        setActive(id);
      });
      li.appendChild(btn);
      if (data.sites && data.sites.length) {
        var sub = document.createElement("ul");
        sub.className = "branch-sites";
        data.sites.forEach(function (siteName) {
          var sli = document.createElement("li");
          sli.textContent = siteName;
          sub.appendChild(sli);
        });
        li.appendChild(sub);
      }
      list.appendChild(li);
    });
  }

  bindMap();
  setActive("prigorodnoe");
})();
