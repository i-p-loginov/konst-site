(function () {
  "use strict";

  var DISTRICTS = {
    boksitogorskiy: {
      name: "Бокситогорский район",
      text: "Работаем в зоне ответственности АО «ЛОЭСК». Поможем с технологическим присоединением и увеличением мощности."
    },
    volosovskiy: {
      name: "Волосовский район",
      text: "Оформление заявок, сопровождение техприсоединения и установка интеллектуальных приборов учёта."
    },
    volkhovskiy: {
      name: "Волховский район",
      text: "Электроэнергия под ключ: от документов до включения объекта в сеть."
    },
    vsevolozhskiy: {
      name: "Всеволожский район",
      text: "Подключение домов и участков, увеличение мощности, замена счётчиков на «умные»."
    },
    vyborgskiy: {
      name: "Выборгский район",
      text: "Полное сопровождение по технологическому присоединению в зоне ЛОЭСК."
    },
    gatchinskiy: {
      name: "Гатчинский район",
      text: "Подготовка документов, переговоры с сетевой организацией и выполнение ТУ."
    },
    kingiseppskiy: {
      name: "Кингисеппский район",
      text: "Услуги по подключению и увеличению электрической мощности для частных и коммерческих объектов."
    },
    kirishskiy: {
      name: "Киришский район",
      text: "Комплексное решение: анализ, заявка, техприсоединение и договор энергоснабжения."
    },
    kirovskiy: {
      name: "Кировский район",
      text: "Работаем с объектами любой категории надёжности. Сопровождаем до подачи напряжения."
    },
    lodeynopolskiy: {
      name: "Лодейнопольский район",
      text: "Помощь владельцам домов и участков в подключении к электрическим сетям."
    },
    lomonosovskiy: {
      name: "Ломоносовский район",
      text: "Документы, заявки, техусловия и монтаж — берём процесс на себя."
    },
    luzhskiy: {
      name: "Лужский район",
      text: "Технологическое присоединение и увеличение мощности под ключ."
    },
    podporozhskiy: {
      name: "Подпорожский район",
      text: "Сопровождаем клиентов в зоне ЛОЭСК на всех этапах подключения."
    },
    priozerskiy: {
      name: "Приозерский район",
      text: "Подключение загородных домов, увеличение мощности, интеллектуальный учёт."
    },
    slantsevskiy: {
      name: "Сланцевский район",
      text: "Официальный партнёр АО «ЛОЭСК» — оформление и сопровождение без лишних хлопот."
    },
    tikhvinskiy: {
      name: "Тихвинский район",
      text: "От заявки до включения: подготовка документов и выполнение технических условий."
    },
    tosnenskiy: {
      name: "Тосненский район",
      text: "Увеличение мощности и технологическое присоединение для частных и юридических лиц."
    },
    sosnovoborskiy: {
      name: "Сосновоборский городской округ",
      text: "Услуги по подключению и модернизации учёта электроэнергии."
    }
  };

  var root = document.querySelector("[data-region-map]");
  if (!root) return;

  var panelTitle = root.querySelector("[data-map-title]");
  var panelText = root.querySelector("[data-map-text]");
  var list = root.querySelector("[data-district-list]");

  function setActive(id) {
    var data = DISTRICTS[id];
    if (!data) return;

    root.querySelectorAll(".map-district").forEach(function (el) {
      el.classList.toggle("is-active", el.getAttribute("data-id") === id);
      el.classList.remove("is-hover");
    });
    root.querySelectorAll(".map-label[data-for]").forEach(function (el) {
      var on = el.getAttribute("data-for") === id;
      el.classList.toggle("is-on-active", on);
      el.setAttribute("data-active", on ? "1" : "0");
    });
    if (list) {
      list.querySelectorAll("button").forEach(function (btn) {
        btn.classList.toggle("is-active", btn.getAttribute("data-id") === id);
        btn.classList.remove("is-hover");
      });
    }
    if (panelTitle) panelTitle.textContent = data.name;
    if (panelText) panelText.textContent = data.text;
  }

  function setHover(id, on) {
    root.querySelectorAll('.map-district[data-id="' + id + '"]').forEach(function (el) {
      el.classList.toggle("is-hover", on && !el.classList.contains("is-active"));
    });
    root.querySelectorAll('.map-label[data-for="' + id + '"]').forEach(function (el) {
      el.classList.toggle("is-on-hover", on && !el.classList.contains("is-on-active"));
    });
    if (list) {
      list.querySelectorAll('button[data-id="' + id + '"]').forEach(function (btn) {
        btn.classList.toggle("is-hover", on && !btn.classList.contains("is-active"));
      });
    }
  }

  function bindMap() {
    root.querySelectorAll(".map-district").forEach(function (path) {
      var id = path.getAttribute("data-id");
      path.addEventListener("mouseenter", function () {
        setHover(id, true);
      });
      path.addEventListener("mouseleave", function () {
        setHover(id, false);
      });
      path.addEventListener("click", function () {
        setActive(id);
      });
      path.setAttribute("tabindex", "0");
      path.setAttribute("role", "button");
      path.setAttribute("aria-label", DISTRICTS[id] ? DISTRICTS[id].name : id);
      path.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setActive(id);
        }
      });
    });
  }

  if (list) {
    var ids = Object.keys(DISTRICTS).sort(function (a, b) {
      return DISTRICTS[a].name.localeCompare(DISTRICTS[b].name, "ru");
    });
    ids.forEach(function (id) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-id", id);
      btn.textContent = DISTRICTS[id].name;
      btn.addEventListener("mouseenter", function () {
        setHover(id, true);
      });
      btn.addEventListener("mouseleave", function () {
        setHover(id, false);
      });
      btn.addEventListener("click", function () {
        setActive(id);
      });
      list.appendChild(btn);
    });
  }

  bindMap();
  setActive("vsevolozhskiy");
})();
