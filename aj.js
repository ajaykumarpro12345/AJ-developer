/* AJ Developers client enhancements & interactive contact drawer */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    // Close mobile/dropdown nav when clicking an in-page anchor
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function () {
        var dd = document.querySelector('.new_nav-dd-wrap');
        if (dd && getComputedStyle(dd).display !== 'none') {
          var bg = document.querySelector('.nav_new-bg');
          if (bg) bg.click();
        }
      });
    });

    // Link the two poster CTA cards ("Find out for free" & "Take the free test") to open the Start a project drawer
    document.querySelectorAll('.wr-cta-card').forEach(function (card) {
      card.addEventListener('click', function (e) {
        e.preventDefault();
        var trigger = document.querySelector('[btn="contact"]');
        if (trigger) trigger.click();
      });
    });

    // Enhance the contact drawer form
    var form = document.getElementById('wf-form-Main-Lead-Form');
    if (!form) return;

    // Remove the testimonial card & enable native scroll inside the contact drawer (bypass Lenis)
    var drawer = form.closest('.form-pop-up');
    var drawerWrap = form.closest('.form-pop-up-wrap');
    if (drawerWrap) {
      drawerWrap.setAttribute('data-lenis-prevent', '');
      drawerWrap.setAttribute('data-lenis-prevent-wheel', '');
      drawerWrap.setAttribute('data-lenis-prevent-touch', '');
    }
    if (drawer) {
      drawer.setAttribute('data-lenis-prevent', '');
      drawer.setAttribute('data-lenis-prevent-wheel', '');
      drawer.setAttribute('data-lenis-prevent-touch', '');
      drawer.addEventListener('wheel', function (ev) { ev.stopPropagation(); }, { passive: true });
      drawer.addEventListener('touchmove', function (ev) { ev.stopPropagation(); }, { passive: true });
      drawer.querySelectorAll('.gradient-card').forEach(function (el) { el.remove(); });
    }

    var formWrap = form.closest('.w-form');
    var headerContent = formWrap && formWrap.querySelector('.content');

    // 1. Availability badge & live completion progress bar
    if (headerContent && !headerContent.querySelector('.aj-status-pill')) {
      var pill = document.createElement('div');
      pill.className = 'aj-status-pill';
      pill.innerHTML = '<span class="aj-status-dot"></span>Available for new projects';
      headerContent.insertBefore(pill, headerContent.firstChild);

      var progWrap = document.createElement('div');
      progWrap.className = 'aj-progress-wrap';
      progWrap.innerHTML = '<div class="aj-progress-bar"></div>';
      headerContent.appendChild(progWrap);
    }
    var progBar = formWrap && formWrap.querySelector('.aj-progress-bar');

    var nameEl = document.getElementById('First-Name');
    var lastEl = document.getElementById('Last-Name');
    var emailEl = document.getElementById('email');
    var selectEl = document.getElementById('required_service');
    var detailsEl = document.getElementById('project_details');
    var submitEl = form.querySelector('input[type="submit"]');

    // Remove Last Name & native dropdown (keep only single Name field)
    if (lastEl) lastEl.remove();
    if (selectEl) selectEl.remove();

    if (nameEl) {
      nameEl.name = 'Name';
      nameEl.setAttribute('data-name', 'Name');
      nameEl.placeholder = 'Name';
      nameEl.autocomplete = 'name';
    }

    // Move textarea out of .w-embed so spacing matches all other fields
    if (detailsEl && detailsEl.parentNode && detailsEl.parentNode.classList.contains('w-embed')) {
      var embedBox = detailsEl.parentNode;
      embedBox.parentNode.insertBefore(detailsEl, embedBox);
      embedBox.remove();
    }

    if (detailsEl) {
      detailsEl.removeAttribute('style');
      detailsEl.required = true;
      detailsEl.rows = 4;
      detailsEl.placeholder = 'Description of product you want';
    }

    // Create Reference URL (optional) input after textarea
    var refUrlEl = document.createElement('input');
    refUrlEl.type = 'url';
    refUrlEl.id = 'reference_url';
    refUrlEl.name = 'reference_url';
    refUrlEl.className = 'input is-dark w-input';
    refUrlEl.maxLength = 512;
    refUrlEl.placeholder = 'Reference URL (optional)';
    refUrlEl.autocomplete = 'url';
    if (detailsEl && detailsEl.parentNode) {
      detailsEl.parentNode.insertBefore(refUrlEl, detailsEl.nextSibling);
    } else if (submitEl) {
      form.insertBefore(refUrlEl, submitEl);
    }

    // State for interactive package / website type / APK type selectors
    var state = {
      packageType: '',
      websiteType: '',
      apkType: ''
    };

    var checkSvg =
      '<span class="aj-check" aria-hidden="true">' +
      '<svg width="12" height="12" viewBox="0 0 16 16" fill="none">' +
      '<path d="M3 8.5L6.5 12L13 4.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg></span>';

    var isName = function (v) { return v.length >= 2; };
    var isEmail = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); };
    var isDesc = function (v) { return v.length >= 10; };
    var isOptionalUrl = function (v) {
      if (!v) return false;
      return /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/i.test(v);
    };

    function updateProgress() {
      if (!progBar) return;
      var score = 0;
      if (nameEl && isName(nameEl.value.trim())) score += 20;
      if (emailEl && isEmail(emailEl.value.trim())) score += 20;
      if (state.packageType) score += 15;
      if (state.websiteType) score += 15;
      if (state.packageType === 'Website + APK') {
        if (state.apkType) score += 10;
      } else if (state.packageType === 'Website') {
        score += 10;
      }
      if (detailsEl && isDesc(detailsEl.value.trim())) score += 15;
      if (refUrlEl && isOptionalUrl(refUrlEl.value.trim())) score += 5;
      progBar.style.width = Math.min(100, score) + '%';
    }

    function wrapFloating(input, labelText, validator, opts) {
      if (!input) return null;
      opts = opts || {};
      var box = document.createElement('div');
      box.className = 'aj-field' + (opts.extraClass ? ' ' + opts.extraClass : '');
      input.parentNode.insertBefore(box, input);
      box.appendChild(input);

      var lbl = document.createElement('label');
      lbl.className = 'aj-label';
      lbl.setAttribute('for', input.id);
      lbl.textContent = labelText;
      box.appendChild(lbl);

      if (validator) {
        box.insertAdjacentHTML('beforeend', checkSvg);
      }

      function sync() {
        var val = input.value.trim();
        box.classList.toggle('has-value', val.length > 0);
        if (validator) {
          var ok = validator(val);
          box.classList.toggle('is-valid', ok);
          if (ok || (opts.optional && val.length === 0)) {
            box.classList.remove('is-invalid');
          }
        }
        updateProgress();
      }

      input.addEventListener('focus', function () { box.classList.add('is-focused'); });
      input.addEventListener('blur', function () {
        box.classList.remove('is-focused');
        var val = input.value.trim();
        if (validator && val.length > 0 && !validator(val)) {
          box.classList.add('is-invalid');
        }
      });
      input.addEventListener('input', sync);
      sync();
      return box;
    }

    // 2. Single Name + Work Email
    var nameBox = wrapFloating(nameEl, 'Name', isName);
    var emailBox = wrapFloating(emailEl, 'Work Email', isEmail);

    // 3. Package selector: Website vs Website + APK
    var pkgGroup = document.createElement('div');
    pkgGroup.className = 'aj-opt-group';
    pkgGroup.innerHTML =
      '<div class="aj-section-label"><span>What do you need?</span><span class="aj-section-hint">Required</span></div>' +
      '<div class="aj-pkg-grid">' +
        '<button type="button" class="aj-pkg-btn" data-pkg="Website">' +
          '<span class="aj-pkg-title">🌐 Website</span>' +
          '<span class="aj-pkg-sub">Responsive, fast &amp; SEO-ready</span>' +
        '</button>' +
        '<button type="button" class="aj-pkg-btn" data-pkg="Website + APK">' +
          '<span class="aj-pkg-title">📱 Website + APK</span>' +
          '<span class="aj-pkg-sub">Website plus Android APK</span>' +
        '</button>' +
      '</div>';

    // 4. Conditional: What kind of website? (Top 4 web design types)
    var webTypeGroup = document.createElement('div');
    webTypeGroup.className = 'aj-opt-group';
    webTypeGroup.hidden = true;
    webTypeGroup.innerHTML =
      '<div class="aj-section-label"><span>What kind of website?</span><span class="aj-section-hint">Top 4 types</span></div>' +
      '<div class="aj-chips">' +
        '<button type="button" class="aj-chip" data-web="Business / Corporate">🏢 Business / Corporate</button>' +
        '<button type="button" class="aj-chip" data-web="E-Commerce Store">🛒 E-Commerce Store</button>' +
        '<button type="button" class="aj-chip" data-web="Portfolio / Brand">✦ Portfolio / Brand</button>' +
        '<button type="button" class="aj-chip" data-web="SaaS / Web App">⚡ SaaS / Web App</button>' +
      '</div>';

    // 5. Conditional: What kind of APK? (Only shown for Website + APK)
    var apkTypeGroup = document.createElement('div');
    apkTypeGroup.className = 'aj-opt-group';
    apkTypeGroup.hidden = true;
    apkTypeGroup.innerHTML =
      '<div class="aj-section-label"><span>What kind of APK?</span><span class="aj-section-hint">Android build</span></div>' +
      '<div class="aj-pkg-grid">' +
        '<button type="button" class="aj-pkg-btn" data-apk="WebView APK">' +
          '<span class="aj-pkg-title">⚡ WebView APK</span>' +
          '<span class="aj-pkg-sub">Synced directly with your website</span>' +
        '</button>' +
        '<button type="button" class="aj-pkg-btn" data-apk="Full Native APK">' +
          '<span class="aj-pkg-title">🚀 Full APK</span>' +
          '<span class="aj-pkg-sub">Full-featured native Android app</span>' +
        '</button>' +
      '</div>';

    // Insert option groups right after Email
    if (emailBox && emailBox.parentNode) {
      emailBox.parentNode.insertBefore(pkgGroup, emailBox.nextSibling);
      pkgGroup.parentNode.insertBefore(webTypeGroup, pkgGroup.nextSibling);
      webTypeGroup.parentNode.insertBefore(apkTypeGroup, webTypeGroup.nextSibling);
    }

    function selectPackage(pkg) {
      state.packageType = pkg;
      pkgGroup.classList.remove('is-invalid');
      pkgGroup.querySelectorAll('.aj-pkg-btn').forEach(function (b) {
        b.classList.toggle('is-selected', b.getAttribute('data-pkg') === pkg);
      });
      webTypeGroup.hidden = !pkg;
      if (pkg === 'Website + APK') {
        apkTypeGroup.hidden = false;
      } else {
        apkTypeGroup.hidden = true;
        state.apkType = '';
        apkTypeGroup.classList.remove('is-invalid');
        apkTypeGroup.querySelectorAll('.aj-pkg-btn').forEach(function (b) {
          b.classList.remove('is-selected');
        });
      }
      updateProgress();
    }

    pkgGroup.querySelectorAll('.aj-pkg-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectPackage(btn.getAttribute('data-pkg'));
      });
    });

    webTypeGroup.querySelectorAll('.aj-chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.websiteType = btn.getAttribute('data-web');
        webTypeGroup.classList.remove('is-invalid');
        webTypeGroup.querySelectorAll('.aj-chip').forEach(function (b) {
          b.classList.toggle('is-selected', b === btn);
        });
        updateProgress();
      });
    });

    apkTypeGroup.querySelectorAll('.aj-pkg-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.apkType = btn.getAttribute('data-apk');
        apkTypeGroup.classList.remove('is-invalid');
        apkTypeGroup.querySelectorAll('.aj-pkg-btn').forEach(function (b) {
          b.classList.toggle('is-selected', b === btn);
        });
        updateProgress();
      });
    });

    // Clicking a Services dropdown card ("Website" or "Website + APK") opens drawer & pre-selects that package
    document.querySelectorAll('[data-aj-service]').forEach(function (card) {
      card.addEventListener('click', function (e) {
        e.preventDefault();
        var pkg = card.getAttribute('data-aj-service');
        var bg = document.querySelector('.nav_new-bg');
        if (bg) bg.click();
        var trigger = document.querySelector('[btn="contact"]');
        if (trigger) trigger.click();
        if (pkg) selectPackage(pkg);
      });
    });

    // 6. Description of product you want + Reference URL (optional)
    var detailsBox = wrapFloating(detailsEl, 'Description of product you want', isDesc, { extraClass: 'aj-field-textarea' });
    if (detailsBox && detailsEl) {
      var counter = document.createElement('span');
      counter.className = 'aj-char-count';
      counter.textContent = '0 / 1000';
      detailsBox.appendChild(counter);
      detailsEl.addEventListener('input', function () {
        counter.textContent = detailsEl.value.length + ' / 1000';
      });
    }
    var refUrlBox = wrapFloating(refUrlEl, 'Reference URL (optional)', isOptionalUrl, { optional: true });

    if (submitEl) {
      submitEl.value = 'Send Project Inquiry →';
    }

    updateProgress();

    // 7. Handle form submission -> Firebase Firestore + Email notification
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();

      var valid = true;
      [
        [nameEl, nameBox, isName, false],
        [emailEl, emailBox, isEmail, false],
        [detailsEl, detailsBox, isDesc, false],
        [refUrlEl, refUrlBox, isOptionalUrl, true]
      ].forEach(function (item) {
        var inp = item[0], bx = item[1], fn = item[2], opt = item[3];
        if (!inp || !bx) return;
        var val = inp.value.trim();
        var bad = opt ? (val.length > 0 && !fn(val)) : !fn(val);
        if (bad) {
          bx.classList.remove('is-invalid');
          void bx.offsetWidth;
          bx.classList.add('is-invalid');
          if (valid) inp.focus();
          valid = false;
        }
      });

      if (!state.packageType) {
        pkgGroup.classList.add('is-invalid');
        valid = false;
      }
      if (state.packageType && !state.websiteType) {
        webTypeGroup.classList.add('is-invalid');
        valid = false;
      }
      if (state.packageType === 'Website + APK' && !state.apkType) {
        apkTypeGroup.classList.add('is-invalid');
        valid = false;
      }
      if (!valid) return;

      var fullName = nameEl ? nameEl.value.trim() : 'there';
      var inquiryData = {
        name: fullName,
        email: emailEl ? emailEl.value.trim() : '',
        packageType: state.packageType,
        websiteType: state.websiteType,
        apkType: state.apkType,
        description: detailsEl ? detailsEl.value.trim() : '',
        referenceUrl: refUrlEl ? refUrlEl.value.trim() : ''
      };

      if (submitEl) {
        submitEl.disabled = true;
        submitEl.value = 'Sending...';
      }

      var savePromise = (window.AJFirebase && typeof window.AJFirebase.submitInquiry === 'function')
        ? window.AJFirebase.submitInquiry(inquiryData).catch(function (err) {
            console.warn('Firebase inquiry save warning:', err);
          })
        : Promise.resolve();

      savePromise.then(function () {
        if (progBar) progBar.style.width = '100%';
        form.style.display = 'none';

        var existing = formWrap.querySelector('.aj-success-card');
        if (existing) existing.remove();

        var summary = state.packageType + ' — ' + state.websiteType + (state.apkType ? ' (' + state.apkType + ')' : '');
        var card = document.createElement('div');
        card.className = 'aj-success-card';
        card.innerHTML =
          '<div class="aj-success-icon">' +
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="none">' +
          '<path d="M5 13L9 17L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
          '</svg></div>' +
          '<div class="aj-success-title">Thanks, ' + fullName.replace(/</g, '&lt;') + '!</div>' +
          '<div class="aj-success-sub">AJ Developers has received your inquiry for <strong>' +
          summary.replace(/</g, '&lt;') +
          '</strong>. We will get back to you within 24 hours.</div>' +
          '<button type="button" class="aj-reset-btn">Send another message</button>';

        card.querySelector('.aj-reset-btn').addEventListener('click', function () {
          card.remove();
          form.reset();
          state.packageType = '';
          state.websiteType = '';
          state.apkType = '';
          pkgGroup.querySelectorAll('.is-selected').forEach(function (el) { el.classList.remove('is-selected'); });
          webTypeGroup.querySelectorAll('.is-selected').forEach(function (el) { el.classList.remove('is-selected'); });
          apkTypeGroup.querySelectorAll('.is-selected').forEach(function (el) { el.classList.remove('is-selected'); });
          webTypeGroup.hidden = true;
          apkTypeGroup.hidden = true;
          form.querySelectorAll('.aj-field').forEach(function (f) {
            f.classList.remove('has-value', 'is-valid', 'is-invalid');
          });
          var cnt = form.querySelector('.aj-char-count');
          if (cnt) cnt.textContent = '0 / 1000';
          if (submitEl) {
            submitEl.disabled = false;
            submitEl.value = 'Send Project Inquiry →';
          }
          form.style.display = 'flex';
          updateProgress();
        });

        form.parentNode.insertBefore(card, form.nextSibling);
      });
    }, true);
  });
})();
