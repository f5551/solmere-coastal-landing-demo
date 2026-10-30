(() => {
  const header = document.querySelector('#siteHeader');
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#siteNav');
  const mobileMenu = window.matchMedia('(max-width: 700px)');

  function responsiveImageSet(source, widths = [480, 768, 1200, 1600]) {
    if (source.startsWith('assets/moment-')) {
      const stem = source.replace(/-\d+\.avif$/, '');
      const availableWidths = source.includes('moment-01-') ? [768] : [480, 768];
      return availableWidths.map(width => `${stem}-${width}.avif ${width}w`).join(', ');
    }

    try {
      return widths.map(width => {
        const url = new URL(source, window.location.href);
        url.searchParams.set('w', String(width));
        return `${url.href} ${width}w`;
      }).join(', ');
    } catch {
      return '';
    }
  }

  const setMenuOpen = (open, { restoreFocus = false } = {}) => {
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    nav.classList.toggle('open', open);
    if (restoreFocus) menuToggle.focus();
  };

  menuToggle.addEventListener('click', () => {
    setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
  });

  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    setMenuOpen(false);
    if (!mobileMenu.matches) return;
    const target = document.querySelector(link.hash);
    if (!target) return;
    target.setAttribute('tabindex', '-1');
    requestAnimationFrame(() => target.focus({ preventScroll: true }));
  }));

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
      event.preventDefault();
      setMenuOpen(false, { restoreFocus: true });
    }
  });

  window.addEventListener('resize', () => {
    if (!mobileMenu.matches && menuToggle.getAttribute('aria-expanded') === 'true') {
      const menuHadFocus = document.activeElement === menuToggle;
      setMenuOpen(false);
      if (menuHadFocus) nav.querySelector('a')?.focus();
    } else if (mobileMenu.matches && !nav.classList.contains('open') && nav.contains(document.activeElement)) {
      menuToggle.focus();
    }
  }, { passive: true });

  const updateHeader = () => header.classList.toggle('scrolled', window.scrollY > 40);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  }), { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  function fallbackFrame(image) {
    return image.closest('figure, .hero') || image.parentElement;
  }

  function clearImageFallback(image) {
    const frame = fallbackFrame(image);
    frame?.querySelector(':scope > .image-fallback')?.remove();
    frame?.classList.remove('image-unavailable');
    image.hidden = false;
  }

  function showImageFallback(image) {
    const frame = fallbackFrame(image);
    if (!frame) return;

    image.hidden = true;
    frame.classList.add('image-unavailable');
    let fallback = frame.querySelector(':scope > .image-fallback');
    if (!fallback) {
      fallback = document.createElement('span');
      fallback.className = 'image-fallback';
      fallback.setAttribute('role', 'img');
      frame.append(fallback);
    }
    fallback.setAttribute('aria-label', `${image.alt || 'Sample image'}. Sample image unavailable.`);
    fallback.textContent = 'Sample image unavailable';
  }

  document.querySelectorAll('img').forEach(image => {
    image.addEventListener('error', () => showImageFallback(image));
    image.addEventListener('load', () => clearImageFallback(image));
    if (image.complete && image.naturalWidth === 0) showImageFallback(image);
  });

  const momentButtons = [...document.querySelectorAll('.moment')];
  const momentFigure = document.querySelector('.moment-photo');
  const momentImg = momentFigure.querySelector('img');
  let momentRequest = 0;

  function activateMoment(button) {
    momentButtons.forEach(item => {
      const selected = item === button;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });

    const title = button.querySelector('b').textContent.trim();
    momentFigure.setAttribute('aria-labelledby', button.id);
    momentFigure.setAttribute('aria-label', title);
    momentImg.alt = button.dataset.alt;
    momentImg.classList.add('changing');
    const requestId = ++momentRequest;
    const nextImage = new Image();
    const imageSizes = '(max-width: 700px) 86vw, 46vw';
    const imageSrcset = responsiveImageSet(button.dataset.image);
    nextImage.sizes = imageSizes;
    if (imageSrcset) nextImage.srcset = imageSrcset;

    nextImage.onload = () => {
      if (requestId !== momentRequest) return;
      momentImg.sizes = imageSizes;
      if (imageSrcset) momentImg.srcset = imageSrcset;
      momentImg.src = button.dataset.image;
      requestAnimationFrame(() => momentImg.classList.remove('changing'));
    };

    nextImage.onerror = () => {
      if (requestId !== momentRequest) return;
      showImageFallback(momentImg);
      requestAnimationFrame(() => momentImg.classList.remove('changing'));
    };

    nextImage.src = button.dataset.image;
  }

  momentButtons.forEach((button, index) => {
    button.id = `moment-tab-${index + 1}`;
    button.tabIndex = index === 0 ? 0 : -1;
    button.addEventListener('mouseenter', () => activateMoment(button));
    button.addEventListener('focus', () => activateMoment(button));
    button.addEventListener('click', () => activateMoment(button));
    button.addEventListener('keydown', event => {
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === 'ArrowDown') next = (index + 1) % momentButtons.length;
      if (event.key === 'ArrowUp') next = (index - 1 + momentButtons.length) % momentButtons.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = momentButtons.length - 1;
      momentButtons[next].focus();
    });
  });

  momentFigure.setAttribute('aria-labelledby', momentButtons[0].id);

  const carousel = document.querySelector('.carousel');
  const track = document.querySelector('.carousel-track');
  const slides = [...document.querySelectorAll('.slide')];
  const dots = document.querySelector('.slide-dots');
  const current = document.querySelector('.slide-current');
  let activeIndex = 1;

  carousel.setAttribute('role', 'region');
  carousel.setAttribute('tabindex', '0');
  carousel.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goToSlide(activeIndex + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goToSlide(activeIndex - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      goToSlide(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      goToSlide(slides.length - 1);
    }
  });

  let touchStartX = null;
  carousel.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch' || event.pointerType === 'pen') touchStartX = event.clientX;
  });
  carousel.addEventListener('pointerup', event => {
    if (touchStartX === null) return;
    const distance = event.clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(distance) < 45) return;
    goToSlide(activeIndex + (distance < 0 ? 1 : -1));
  });
  carousel.addEventListener('pointercancel', () => { touchStartX = null; });

  slides.forEach((slide, index) => {
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'slide-dot';
    dot.setAttribute('aria-label', `Go to image ${index + 1}`);
    dot.addEventListener('click', () => goToSlide(index));
    dots.append(dot);
  });

  function goToSlide(index) {
    activeIndex = (index + slides.length) % slides.length;
    const activeSlide = slides[activeIndex];
    const left = activeSlide.offsetLeft - (track.parentElement.clientWidth - activeSlide.clientWidth) / 2;
    track.style.transform = `translateX(${-left}px)`;

    slides.forEach((slide, slideIndex) => {
      const selected = slideIndex === activeIndex;
      slide.classList.toggle('active', selected);
      slide.setAttribute('aria-current', String(selected));
      slide.setAttribute('aria-label', `Image ${slideIndex + 1} of ${slides.length}: ${slide.querySelector('figcaption span').textContent.trim()}`);
    });

    [...dots.children].forEach((dot, dotIndex) => {
      const selected = dotIndex === activeIndex;
      dot.classList.toggle('active', selected);
      dot.setAttribute('aria-pressed', String(selected));
    });

    current.textContent = String(activeIndex + 1).padStart(2, '0');
    current.setAttribute('aria-label', `Slide ${activeIndex + 1} of ${slides.length}`);
  }

  document.querySelector('.carousel-arrow.prev').addEventListener('click', () => goToSlide(activeIndex - 1));
  document.querySelector('.carousel-arrow.next').addEventListener('click', () => goToSlide(activeIndex + 1));
  window.addEventListener('resize', () => goToSlide(activeIndex), { passive: true });
  goToSlide(activeIndex);

  const form = document.querySelector('#enquiryForm');
  const status = document.querySelector('#formStatus');
  const privacyNote = document.querySelector('#privacyNote');
  const submitButton = form.querySelector('[type="submit"]');
  const formMode = form.dataset.mode || 'demo';
  const endpointValue = form.dataset.endpoint || '';
  const turnstileSiteKey = form.dataset.turnstileSiteKey || '';
  const productionPrivacyMessage = form.dataset.privacyMessage?.trim() || '';
  let turnstileWidgetId = null;
  let isSubmitting = false;

  function resolveSameOriginEndpoint(value) {
    try {
      const endpoint = new URL(value, window.location.href);
      if (endpoint.origin !== window.location.origin || !/^https?:$/.test(endpoint.protocol)) return '';
      if (window.location.protocol === 'https:' && endpoint.protocol !== 'https:') return '';
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && endpoint.protocol !== 'https:') return '';
      return endpoint.href;
    } catch {
      return '';
    }
  }

  const productionEndpoint = resolveSameOriginEndpoint(endpointValue);
  const productionReady = formMode === 'production'
    && Boolean(productionEndpoint && turnstileSiteKey && productionPrivacyMessage);
  let requestId = '';

  function createRequestId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    if (!window.crypto?.getRandomValues) return '';
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  if (formMode === 'production' && productionReady) {
    requestId = createRequestId();
    if (!requestId) {
      status.classList.add('error');
      status.textContent = 'Secure browser support is unavailable. No details were sent.';
      submitButton.disabled = true;
    }
    privacyNote.textContent = productionPrivacyMessage;
    submitButton.disabled = true;
    submitButton.setAttribute('aria-busy', 'true');
    status.textContent = 'Preparing secure spam protection…';
    const turnstileScript = document.createElement('script');
    turnstileScript.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    turnstileScript.async = true;
    turnstileScript.defer = true;
    turnstileScript.onload = () => {
      if (!window.turnstile) {
        status.classList.add('error');
        status.textContent = 'Spam protection could not be started. No details were sent.';
        submitButton.removeAttribute('aria-busy');
        return;
      }
      turnstileWidgetId = window.turnstile.render('#turnstileWidget', {
        sitekey: turnstileSiteKey,
        action: 'enquiry',
        callback: token => {
          form.elements.turnstileToken.value = token;
          submitButton.disabled = !requestId;
          submitButton.removeAttribute('aria-busy');
          status.textContent = requestId ? '' : 'Secure browser support is unavailable. No details were sent.';
          status.classList.toggle('error', !requestId);
        },
        'expired-callback': () => {
          form.elements.turnstileToken.value = '';
          submitButton.disabled = true;
          submitButton.setAttribute('aria-busy', 'true');
          status.textContent = 'Spam protection expired. Please complete it again.';
        },
        'error-callback': () => {
          form.elements.turnstileToken.value = '';
          submitButton.disabled = true;
          submitButton.removeAttribute('aria-busy');
          status.classList.add('error');
          status.textContent = 'Spam protection is unavailable. No details were sent.';
        }
      });
    };
    turnstileScript.onerror = () => {
      status.classList.add('error');
      status.textContent = 'Spam protection could not be loaded. No details were sent.';
      submitButton.removeAttribute('aria-busy');
    };
    document.head.append(turnstileScript);
  } else if (formMode !== 'demo') {
    submitButton.disabled = true;
    status.classList.add('error');
    status.textContent = 'Secure enquiry delivery is not configured. No details were sent or stored.';
  }

  const validators = {
    firstName: value => value.trim().length >= 2 ? '' : 'Please enter your first name (at least 2 characters).',
    surname: value => value.trim().length >= 2 ? '' : 'Please enter your surname (at least 2 characters).',
    phone: value => {
      const phone = value.trim();
      const digits = phone.replace(/\D/g, '').length;
      return /^\+?[\d\s().-]+$/.test(phone) && digits >= 7 && digits <= 15
        ? ''
        : 'Enter a valid phone number with 7 to 15 digits.';
    },
    email: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? '' : 'Enter a valid email address.',
    source: value => value ? '' : 'Please choose how you heard about us.'
  };

  Object.keys(validators).forEach(name => {
    const field = form.elements[name];
    const errorMessage = field.closest('label').querySelector('.field-error');
    errorMessage.id = `error-${name}`;
    field.setAttribute('aria-describedby', errorMessage.id);
    field.setAttribute('aria-invalid', 'false');
  });

  function validateField(field) {
    const error = validators[field.name](field.value);
    const label = field.closest('label');
    label.classList.toggle('invalid', Boolean(error));
    label.querySelector('.field-error').textContent = error;
    field.setAttribute('aria-invalid', String(Boolean(error)));
    return !error;
  }

  Object.keys(validators).forEach(name => {
    const field = form.elements[name];
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener(field.tagName === 'SELECT' ? 'change' : 'input', () => {
      if (field.closest('label').classList.contains('invalid')) validateField(field);
      if (formMode === 'production' && !isSubmitting) requestId = createRequestId();
      status.textContent = '';
      status.classList.remove('error');
    });
  });

  function clearValidatedFields(fields) {
    fields.forEach(field => {
      field.closest('label').classList.remove('invalid');
      field.setAttribute('aria-invalid', 'false');
      field.closest('label').querySelector('.field-error').textContent = '';
    });
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (isSubmitting) return;
    if (formMode !== 'demo' && !productionReady) {
      status.className = 'form-status error';
      status.textContent = 'Secure enquiry delivery is not configured. No details were sent or stored.';
      return;
    }
    status.className = 'form-status';
    status.textContent = '';

    const fields = Object.keys(validators).map(name => form.elements[name]);
    const invalidFields = fields.filter(field => !validateField(field));
    if (invalidFields.length) {
      status.classList.add('error');
      status.textContent = `Please check the ${invalidFields.length} highlighted field${invalidFields.length === 1 ? '' : 's'} and try again.`;
      invalidFields[0].focus();
      return;
    }

    if (formMode === 'demo') {
      status.textContent = 'Thank you. This is a demo form; your details have not been sent or stored.';
      form.reset();
      clearValidatedFields(fields);
      return;
    }

    if (!form.elements.turnstileToken.value) {
      status.classList.add('error');
      status.textContent = 'Please complete the spam protection check. No details were sent.';
      return;
    }
    if (!requestId) {
      status.classList.add('error');
      status.textContent = 'A secure request could not be prepared. No details were sent.';
      return;
    }

    isSubmitting = true;
    submitButton.disabled = true;
    submitButton.setAttribute('aria-busy', 'true');
    status.textContent = 'Submitting securely…';
    const payload = Object.fromEntries(fields.map(field => [field.name, field.value.trim()]));
    payload.website = form.elements.website.value;
    payload.turnstileToken = form.elements.turnstileToken.value;
    payload.requestId = requestId;

    try {
      const response = await fetch(productionEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'same-origin',
        cache: 'no-store'
      });
      let result = {};
      try { result = await response.json(); } catch { /* Safe generic failure below. */ }
      if (!response.ok || result.accepted !== true) {
        if (response.status === 429) {
          status.textContent = 'Please wait before sending another enquiry. Your details were not accepted.';
        } else if (response.status >= 500) {
          status.textContent = 'Secure submission is temporarily unavailable. Please try again later.';
        } else {
          status.textContent = 'Your enquiry could not be accepted. Please check the form and try again.';
        }
        status.classList.add('error');
        return;
      }
      status.textContent = 'Your enquiry has been accepted for processing. This does not guarantee delivery or a response.';
      form.reset();
      clearValidatedFields(fields);
      requestId = createRequestId();
      if (window.turnstile && turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId);
    } catch {
      status.classList.add('error');
      status.textContent = 'A connection error prevented submission. Your enquiry was not confirmed; please try again.';
    } finally {
      isSubmitting = false;
      form.elements.turnstileToken.value = '';
      if (formMode === 'production' && window.turnstile && turnstileWidgetId !== null) {
        window.turnstile.reset(turnstileWidgetId);
        submitButton.disabled = true;
        submitButton.setAttribute('aria-busy', 'true');
      } else {
        submitButton.disabled = false;
        submitButton.removeAttribute('aria-busy');
      }
    }
  });

  document.querySelector('#year').textContent = new Date().getFullYear();
})();
