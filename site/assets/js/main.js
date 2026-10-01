// Shared behaviour: theme, reveal, KPI count-up, active navigation, tabs, email links.
(function () {
  var root = document.documentElement;
  root.classList.remove("no-js");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      /* storage can be blocked; the theme still switches for this visit */
    }
  }

  document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var current = root.getAttribute("data-theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      var next = current === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      safeSet("theme", next);
    });
  });

  // Scroll reveal
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -30px 0px" }
    );
    reveals.forEach(function (el) {
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) {
      el.classList.add("in");
    });
  }

  // KPI count-up (final value is already in the markup, so no-JS and reduced motion show the right number)
  function setCount(el, n) {
    el.innerHTML = (el.getAttribute("data-prefix") || "") + n + "<small>" + (el.getAttribute("data-suffix") || "") + "</small>";
  }

  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window && !reduce) {
    var co = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          co.unobserve(entry.target);
          var el = entry.target;
          var target = Number(el.getAttribute("data-count"));
          var start = performance.now();
          var duration = 1000;
          function tick(now) {
            var t = Math.min((now - start) / duration, 1);
            var eased = 1 - Math.pow(1 - t, 3);
            setCount(el, Math.round(target * eased));
            if (t < 1) requestAnimationFrame(tick);
          }
          setCount(el, 0);
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (el) {
      co.observe(el);
    });
  }

  // Active section in both navigation bars
  var links = document.querySelectorAll("[data-nav]");
  function setActive(id) {
    links.forEach(function (a) {
      if (a.getAttribute("data-nav") === id) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  }
  var sections = document.querySelectorAll("main section[id]");
  if (links.length && sections.length && "IntersectionObserver" in window) {
    var so = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    sections.forEach(function (s) {
      so.observe(s);
    });
    setActive("overview");
  }
  links.forEach(function (a) {
    a.addEventListener("click", function () {
      setActive(a.getAttribute("data-nav"));
    });
  });

  // Roving-tabindex tabs (experience roles)
  document.querySelectorAll("[data-tabs]").forEach(function (list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll("[role=tab]"));
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () {
        select(tab, false);
      });
      tab.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
        else if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === "Home") next = tabs[0];
        else if (e.key === "End") next = tabs[tabs.length - 1];
        if (next) {
          e.preventDefault();
          select(next, true);
        }
      });
    });
  });

  // Email links and copy button
  var cfg = window.PORTFOLIO || {};
  document.querySelectorAll("[data-email]").forEach(function (el) {
    if (!cfg.email) return;
    el.setAttribute("href", "mailto:" + cfg.email);
    if (el.hasAttribute("data-email-text")) {
      var label = el.querySelector("span");
      if (label) label.textContent = cfg.email;
    }
  });

  document.querySelectorAll("[data-copy-email]").forEach(function (btn) {
    var label = btn.querySelector("span");
    var original = label ? label.textContent : "";
    btn.addEventListener("click", function () {
      function done(ok) {
        if (label) label.textContent = ok ? "Copied!" : cfg.email;
        setTimeout(function () {
          if (label) label.textContent = original;
        }, 2200);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(cfg.email).then(function () { done(true); }, function () { done(false); });
      } else {
        done(false);
      }
    });
  });

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
