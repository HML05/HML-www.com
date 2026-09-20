/* ============================================================
   陶东辰 · 个人求职主页 — 交互脚本
   无依赖、无构建。所有增强均为渐进式：JS 失效时页面依然完整可读。
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 年份 ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- 导航：滚动加玻璃底 + 抽屉菜单 ---------- */
  var nav = document.getElementById("nav");
  var navToggle = document.getElementById("navToggle");
  var navDrawer = document.getElementById("navDrawer");

  function onScroll() {
    if (!nav) return;
    nav.classList.toggle("is-stuck", window.scrollY > 24);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  function closeDrawer() {
    if (!navDrawer || !navToggle) return;
    navDrawer.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  }
  if (navToggle && navDrawer) {
    navToggle.addEventListener("click", function () {
      var open = navDrawer.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    navDrawer.addEventListener("click", function (e) {
      if (e.target.tagName === "A") closeDrawer();
    });
    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeDrawer();
    });
  }

  /* ---------- 滚动入场 ---------- */
  var revealables = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealables.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });
    revealables.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- 数字滚动（只跑真实数据） ---------- */
  var counters = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));

  function runCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var decimals = (String(el.getAttribute("data-count")).split(".")[1] || "").length;

    if (reduceMotion || isNaN(target)) {
      el.textContent = target.toFixed(decimals) + suffix;
      return;
    }
    var duration = 1400;
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(decimals) + suffix;
    }
    requestAnimationFrame(step);
  }

  if (!("IntersectionObserver" in window)) {
    counters.forEach(runCount);
  } else {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          runCount(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { countObserver.observe(el); });
  }

  /* ---------- 背景视频：落地播放 + 手动暂停 + 离屏/后台自动暂停 ---------- */
  var video = document.getElementById("heroVideo");
  var videoToggle = document.getElementById("videoToggle");

  function setToggleLabel(paused) {
    if (!videoToggle) return;
    var label = videoToggle.querySelector("span");
    if (label) label.textContent = paused ? "播放动效" : "暂停动效";
    videoToggle.setAttribute("aria-label", paused ? "播放背景视频" : "暂停背景视频");
  }

  if (video) {
    var tryPlay = function () {
      var p = video.play();
      if (p && typeof p.catch === "function") { p.catch(function () { /* 自动播放被拦截，poster 兜底 */ }); }
    };

    // 部分浏览器会拦截带 autoplay 的恢复播放，这里显式补一次
    tryPlay();
    video.addEventListener("loadeddata", function () {
      setToggleLabel(video.paused);
      tryPlay();
    });

    if (videoToggle) {
      videoToggle.addEventListener("click", function () {
        if (video.paused) { tryPlay(); } else { video.pause(); }
        setToggleLabel(video.paused);
        window.setTimeout(function () { setToggleLabel(video.paused); }, 60);
      });
    }

    if (!reduceMotion && "IntersectionObserver" in window) {
      var videoObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { tryPlay(); } else { video.pause(); }
        });
      }, { threshold: 0.08 });
      videoObserver.observe(video);
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) video.pause();
      else if (!reduceMotion) tryPlay();
    });
  }

  /* ---------- 简历下载 ---------- */
  Array.prototype.slice.call(document.querySelectorAll("[data-resume]")).forEach(function (btn) {
    btn.addEventListener("click", function () {
      var a = document.createElement("a");
      a.href = "assets/resume.pdf";
      a.download = "陶东辰-简历-Python开发工程师.pdf";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast("简历已开始下载");
    });
  });

  /* ---------- 复制邮箱 / 电话 ---------- */
  var toast = document.getElementById("toast");
  var toastTimer = null;

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("is-on");
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-on");
    }, 2000);
  }

  function legacyCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  Array.prototype.slice.call(document.querySelectorAll("[data-copy]")).forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy") || "";
      var done = function () { showToast("已复制：" + text); };
      var fail = function () { showToast("复制失败，请手动选择：" + text); };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () {
          legacyCopy(text) ? done() : fail();
        });
      } else {
        legacyCopy(text) ? done() : fail();
      }
    });
  });

  /* ---------- 导航当前分区高亮 ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav__links a"));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    var activeObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = "#" + entry.target.id;
        navLinks.forEach(function (a) {
          a.classList.toggle("is-active", a.getAttribute("href") === id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    sections.forEach(function (s) { activeObserver.observe(s); });
  }
})();
