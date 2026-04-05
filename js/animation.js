(() => {
  const doc = document;
  const win = window;
  const isMobile = win.matchMedia("(max-width: 768px)").matches;
  const prefersReducedMotion = win.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const deviceMemory = Number(win.navigator.deviceMemory || 0);
  const cpuCores = Number(win.navigator.hardwareConcurrency || 0);
  const isLowPowerDevice = (deviceMemory && deviceMemory <= 4) || (cpuCores && cpuCores <= 4);
  const shouldUseLightHeroMotion = prefersReducedMotion || isMobile || isLowPowerDevice;

  const hero = doc.querySelector(".hero");
  const heroImage = doc.querySelector("[data-hero-parallax]");
  const heroTitle = doc.querySelector(".hero__title");

  const revealTargets = doc.querySelectorAll(
    ".section__header, .card, .service-area-list li, .about__content, .about__image, .process-step, .testimonial-card, .faq-item, .cta > *, .contact__info, .contact__map, .footer__content > *"
  );

  const initHeroTitleGeneration = () => {
    if (!heroTitle) return;

    if (prefersReducedMotion || shouldUseLightHeroMotion) {
      hero?.classList.add("hero--no-title-split");
      return;
    }

    const rawText = (heroTitle.textContent || "").replace(/\s+/g, " ").trim();
    if (!rawText) return;

    const words = rawText.split(" ");
    if (words.length <= 1) {
      hero?.classList.add("hero--no-title-split");
      return;
    }

    const fragment = doc.createDocumentFragment();
    words.forEach((word, index) => {
      const span = doc.createElement("span");
      span.className = "hero__title-word";
      span.style.setProperty("--word-delay", `${index * 55}ms`);
      span.textContent = word;
      fragment.appendChild(span);

      if (index < words.length - 1) {
        fragment.appendChild(doc.createTextNode(" "));
      }
    });

    heroTitle.textContent = "";
    heroTitle.setAttribute("aria-label", rawText);
    heroTitle.appendChild(fragment);
    heroTitle.classList.add("hero__title--generated");
  };

  const setHeroStagger = () => {
    if (!hero) return;

    const sequence = [
      ".hero__badge",
      ".hero__title",
      ".hero__processing-line",
      ".hero__subtitle",
      ".hero__stats",
      ".hero__image",
      ".hero__actions"
    ];

    const baseDelay = shouldUseLightHeroMotion ? 90 : 130;

    sequence.forEach((selector, index) => {
      const el = hero.querySelector(selector);
      if (!el) return;
      el.classList.add("hero-reveal");
      el.style.setProperty("--hero-delay", `${index * baseDelay}ms`);
    });

    requestAnimationFrame(() => {
      hero.classList.add("is-loaded");
      if (shouldUseLightHeroMotion) {
        hero.classList.add("hero--light-motion");
      }
    });
  };

  const setHeroSecondaryReveal = () => {
    if (!hero || prefersReducedMotion) return;

    const delay = shouldUseLightHeroMotion ? 160 : 300;
    win.setTimeout(() => {
      hero.classList.add("hero--generated");

      win.setTimeout(() => {
        hero.classList.remove("hero--generated");
      }, 500);
    }, delay);
  };

  const setRevealObserver = () => {
    revealTargets.forEach((el, index) => {
      if (hero && hero.contains(el)) return;
      el.classList.add("reveal-item");
      el.style.setProperty("--reveal-delay", `${(index % 4) * 70}ms`);
    });

    if (prefersReducedMotion || !("IntersectionObserver" in win)) {
      doc.querySelectorAll(".reveal-item").forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );

    doc.querySelectorAll(".reveal-item").forEach((el) => observer.observe(el));
  };

  const setHeroParallax = () => {
    if (!hero || !heroImage || isMobile || prefersReducedMotion) return;

    let ticking = false;
    const update = () => {
      const rect = hero.getBoundingClientRect();
      const progress = (win.innerHeight - rect.top) / (win.innerHeight + rect.height);
      const clamped = Math.max(0, Math.min(1, progress));
      const shift = (clamped - 0.5) * 16;
      heroImage.style.setProperty("--hero-parallax", `${shift.toFixed(2)}px`);
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    win.addEventListener("scroll", onScroll, { passive: true });
    win.addEventListener("resize", onScroll, { passive: true });
    update();
  };

  const setBackgroundPointer = () => {
    if (isMobile || prefersReducedMotion) return;

    const shapes = doc.querySelectorAll(".global-bg .shape");
    if (!shapes.length) return;

    let px = 0;
    let py = 0;
    let raf = 0;

    const render = () => {
      const x = (px - 0.5) * 12;
      const y = (py - 0.5) * 10;

      shapes.forEach((shape, index) => {
        const factor = (index + 1) * 0.45;
        shape.style.transform = `translate3d(${(x * factor).toFixed(2)}px, ${(y * factor).toFixed(2)}px, 0)`;
      });

      raf = 0;
    };

    win.addEventListener(
      "pointermove",
      (event) => {
        px = event.clientX / win.innerWidth;
        py = event.clientY / win.innerHeight;

        if (raf) return;
        raf = requestAnimationFrame(render);
      },
      { passive: true }
    );
  };

  const boot = () => {
    initHeroTitleGeneration();
    setHeroStagger();
    setHeroSecondaryReveal();
    setRevealObserver();
    setHeroParallax();
    setBackgroundPointer();
  };

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
