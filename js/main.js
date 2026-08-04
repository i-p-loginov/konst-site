(function () {
  "use strict";

  /* Mobile nav */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
      });
    });
  }

  /* Scroll reveal */
  var reveals = document.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach(function (el) {
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* Cookie banner */
  var cookieKey = "konstanta_cookies_ok";
  var banner = document.querySelector(".cookie-banner");
  var acceptBtn = document.querySelector("[data-cookie-accept]");
  if (banner) {
    try {
      if (!localStorage.getItem(cookieKey)) {
        requestAnimationFrame(function () {
          banner.classList.add("is-visible");
        });
      }
    } catch (e) {
      banner.classList.add("is-visible");
    }
  }
  if (acceptBtn && banner) {
    acceptBtn.addEventListener("click", function () {
      try {
        localStorage.setItem(cookieKey, "1");
      } catch (e) {}
      banner.classList.remove("is-visible");
    });
  }

  /* Contact form */
  var form = document.querySelector("[data-contact-form]");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var valid = true;
      var fields = form.querySelectorAll("[required]");
      fields.forEach(function (field) {
        var row = field.closest(".form-row") || field.closest(".form-check");
        var ok = true;
        if (field.type === "checkbox") {
          ok = field.checked;
        } else {
          ok = String(field.value || "").trim().length > 0;
          if (ok && field.type === "email") {
            ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim());
          }
          if (ok && field.type === "tel") {
            ok = field.value.replace(/\D/g, "").length >= 10;
          }
        }
        if (row && row.classList) {
          row.classList.toggle("has-error", !ok);
        }
        if (!ok) valid = false;
      });
      if (!valid) return;
      form.classList.add("is-sent");
      form.reset();
    });
  }
})();
