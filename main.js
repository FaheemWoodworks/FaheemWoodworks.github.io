/* ===== Faheem Woodworks — Shared JS ===== */

(function () {
  'use strict';

  /* --- Mobile Menu --- */
  var toggle = document.querySelector('.menu-toggle');
  var navLinks = document.querySelector('.navbar-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen);
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* --- Scroll Reveal --- */
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length && 'IntersectionObserver' in window) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          revealObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { revealObs.observe(el); });
  }

  /* --- Hero Slider --- */
  var hero = document.getElementById('hero');
  if (hero) {
    var slides = [].slice.call(hero.querySelectorAll('.hero-slide'));
    var prev = hero.querySelector('.hero-btn.left');
    var next = hero.querySelector('.hero-btn.right');
    var dots = [].slice.call(hero.querySelectorAll('.hero-dot'));
    var idx = 0;
    var autoTimer = null;

    function showSlide() {
      slides.forEach(function (s, i) { s.classList.toggle('active', i === idx); });
      dots.forEach(function (d, i) { d.classList.toggle('active', i === idx); });
    }
    function step(d) {
      idx = (idx + d + slides.length) % slides.length;
      showSlide();
      resetAuto();
    }
    function resetAuto() {
      clearInterval(autoTimer);
      autoTimer = setInterval(function () { step(1); }, 6000);
    }

    slides.forEach(function (s) {
      s.addEventListener('click', function () {
        var href = s.getAttribute('data-link');
        if (href) window.location.href = href;
      });
    });

    if (prev) prev.addEventListener('click', function (e) { e.stopPropagation(); step(-1); });
    if (next) next.addEventListener('click', function (e) { e.stopPropagation(); step(1); });
    dots.forEach(function (d, i) {
      d.addEventListener('click', function () { idx = i; showSlide(); resetAuto(); });
    });

    hero.tabIndex = 0;
    hero.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
    var sx = null;
    hero.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
      sx = null;
    });

    showSlide();
    resetAuto();
  }

  /* --- Lightbox --- */
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = lightbox ? lightbox.querySelector('img') : null;
  function openLightbox(src, alt) {
    if (!lightbox) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }
  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox || e.target.classList.contains('lightbox-close')) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
    });
  }

  /* --- Image Probe Utility --- */
  function probe(url) {
    return new Promise(function (res) {
      var img = new Image();
      img.onload = function () { res(true); };
      img.onerror = function () { res(false); };
      img.src = url;
    });
  }

  function buildFiles(folder, base, count) {
    var exts = ['webp', 'jpg', 'jpeg', 'png'];
    var files = [];
    var max = count ? Number(count) : 120;
    var chain = Promise.resolve();

    for (var i = 1; i <= max; i++) {
      (function (num) {
        chain = chain.then(function () {
          var inner = Promise.resolve();
          for (var e = 0; e < exts.length; e++) {
            (function (ext) {
              inner = inner.then(function (found) {
                if (found) return found;
                var cand = folder + base + num + '.' + ext;
                return probe(cand).then(function (ok) {
                  return ok ? base + num + '.' + ext : null;
                });
              });
            })(exts[e]);
          }
          return inner.then(function (hit) {
            if (hit) files.push(hit);
          });
        });
      })(i);
    }

    return chain.then(function () { return files; });
  }

  /* --- Wire Gallery --- */
  function wireGallery(gal) {
    var folder = gal.getAttribute('data-folder');
    var base = gal.getAttribute('data-base');
    var count = gal.getAttribute('data-count');
    var title = gal.getAttribute('data-title') || '';

    buildFiles(folder, base, count).then(function (files) {
      var img = gal.querySelector('.gallery-main');
      var cnt = gal.querySelector('.gallery-count');
      var openA = gal.querySelector('.js-open');
      var fullB = gal.querySelector('.js-full');
      var thumbs = gal.querySelector('.thumbs');
      var frame = gal.querySelector('.gallery-frame');
      var idx = 0;

      if (!files.length) { if (img) img.alt = 'No images found'; return; }

      if (thumbs) {
        thumbs.innerHTML = '';
        files.forEach(function (f, i) {
          var btn = document.createElement('button');
          btn.className = 'thumb'; btn.type = 'button';
          var t = document.createElement('img');
          t.loading = 'lazy'; t.src = folder + f; t.alt = title + ' ' + (i + 1);
          btn.appendChild(t);
          btn.addEventListener('click', function () { idx = i; update(true); });
          thumbs.appendChild(btn);
        });
      }

      function preload(n) { var im = new Image(); im.src = folder + files[n]; }

      function update(animate) {
        var f = files[idx];
        if (cnt) cnt.textContent = (idx + 1) + ' / ' + files.length;
        if (openA) openA.href = folder + f;
        if (animate && img) img.classList.add('fade');
        setTimeout(function () {
          if (img) {
            img.src = folder + f;
            img.alt = title + ' photo ' + (idx + 1);
            img.classList.remove('fade');
          }
        }, animate ? 150 : 0);
        preload((idx + 1) % files.length);
        if (thumbs) {
          [].slice.call(thumbs.children).forEach(function (el, j) {
            el.classList.toggle('active', j === idx);
          });
        }
      }

      function step(d) {
        idx = (idx + d + files.length) % files.length;
        update(true);
      }

      gal.querySelectorAll('.nav-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          step(parseInt(btn.getAttribute('data-dir'), 10));
        });
      });

      if (img) {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', function () {
          openLightbox(img.src, img.alt);
        });
      }

      if (fullB) {
        fullB.addEventListener('click', function () {
          if (!document.fullscreenElement) {
            if (frame && frame.requestFullscreen) frame.requestFullscreen();
          } else {
            if (document.exitFullscreen) document.exitFullscreen();
          }
        });
      }

      gal.tabIndex = 0;
      gal.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') step(1);
        if (e.key === 'ArrowLeft') step(-1);
        if (e.key.toLowerCase() === 'f' && fullB) fullB.click();
      });
      var touchX = null;
      gal.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
      gal.addEventListener('touchend', function (e) {
        if (touchX === null) return;
        var dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
        touchX = null;
      });

      update(false);
    });
  }

  /* --- Lazy-init Galleries --- */
  var galleries = document.querySelectorAll('.gallery[data-folder][data-base]');
  if (galleries.length && 'IntersectionObserver' in window) {
    var galObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { wireGallery(e.target); galObs.unobserve(e.target); }
      });
    }, { rootMargin: '300px 0px' });
    galleries.forEach(function (g) { galObs.observe(g); });
  } else {
    galleries.forEach(function (g) { wireGallery(g); });
  }

  /* --- Inquiry Modal --- */
  var modal = document.getElementById('inq-modal');
  if (modal) {
    var itemInput = document.getElementById('inq-item');
    var msgInput = document.getElementById('inq-msg');

    function openInquiry(item) {
      if (itemInput) itemInput.value = item;
      if (msgInput) msgInput.value = "I'm interested in: " + item;
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeInquiry() {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }

    document.querySelectorAll('.btn-inquire').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openInquiry(btn.getAttribute('data-item') || 'Project');
      });
    });

    modal.addEventListener('click', function (e) { if (e.target === modal) closeInquiry(); });
    var closeBtn = modal.querySelector('.inq-close');
    if (closeBtn) closeBtn.addEventListener('click', closeInquiry);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeInquiry();
    });

    var form = modal.querySelector('form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var btn = form.querySelector('.inq-submit');
        if (btn) { btn.disabled = true; btn.textContent = 'Sending\u2026'; }
        fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        }).then(function (res) {
          if (btn) { btn.disabled = false; btn.textContent = 'Send Inquiry'; }
          if (res.ok) {
            alert("Thanks! I'll get back to you shortly.");
            form.reset();
            closeInquiry();
          } else {
            alert('Sorry, something went wrong. Please try again or email me.');
          }
        }).catch(function () {
          if (btn) { btn.disabled = false; btn.textContent = 'Send Inquiry'; }
          alert('Sorry, something went wrong. Please try again or email me.');
        });
      });
    }
  }

  /* --- Footer Year --- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
