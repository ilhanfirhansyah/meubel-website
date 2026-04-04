(() => {
  const doc = document;
  const win = window;
  const isMobile = win.matchMedia("(max-width: 768px)").matches;
  const prefersReducedMotion = win.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const hero = doc.querySelector(".hero");
  const heroImage = doc.querySelector("[data-hero-parallax]");

  const revealTargets = doc.querySelectorAll(
    ".section__header, .card, .service-area-list li, .about__content, .about__image, .process-step, .testimonial-card, .faq-item, .cta > *, .contact__info, .contact__map, .footer__content > *"
  );

  const setHeroStagger = () => {
    if (!hero) return;

    const sequence = [
      ".hero__badge",
      ".hero__title",
      ".hero__subtitle",
      ".hero__actions",
      ".hero__stats",
      ".hero__image"
    ];

    sequence.forEach((selector, index) => {
      const el = hero.querySelector(selector);
      if (!el) return;
      el.classList.add("hero-reveal");
      el.style.setProperty("--hero-delay", `${index * 180}ms`);
    });

    requestAnimationFrame(() => hero.classList.add("is-loaded"));
  };

  const revealWordsCinematic = (el, options = {}) => {
    if (!el || el.dataset.cinematicDone === "true") return 0;

    const finalText = (el.dataset.finalText || el.textContent || "").trim();
    if (!finalText) return 0;

    const delay = options.delay ?? 0;
    const duration = options.duration ?? 760;
    const step = options.step ?? 84;
    const lockWidth = options.lockWidth ?? false;

    el.dataset.finalText = finalText;
    el.dataset.cinematicDone = "true";

    if (lockWidth) {
      const width = el.getBoundingClientRect().width;
      el.style.minWidth = `${Math.ceil(width)}px`;
    }

    const tokens = finalText.split(/(\s+)/);
    const fragment = doc.createDocumentFragment();
    let wordIndex = 0;

    el.classList.add("hero-text-cinematic");
    el.setAttribute("aria-label", finalText);
    el.textContent = "";

    tokens.forEach((token) => {
      if (!token) return;

      if (/^\s+$/.test(token)) {
        fragment.append(doc.createTextNode(token));
        return;
      }

      const span = doc.createElement("span");
      span.className = "hero-word";
      span.textContent = token;
      span.style.setProperty("--word-delay", `${delay + wordIndex * step}ms`);
      span.style.setProperty("--word-duration", `${duration}ms`);
      fragment.append(span);
      wordIndex += 1;
    });

    el.append(fragment);

    return delay + Math.max(wordIndex - 1, 0) * step + duration;
  };

  const setHeroGenerateSequence = () => {
    if (!hero || prefersReducedMotion) return;

    const title = hero.querySelector(".hero__title");
    const subtitle = hero.querySelector(".hero__subtitle");
    const buttons = Array.from(hero.querySelectorAll(".hero__actions .button"));

    hero.classList.add("hero--generating");

    const endTimes = [];
    endTimes.push(
      revealWordsCinematic(title, {
        delay: 160,
        duration: 820,
        step: 92
      })
    );

    endTimes.push(
      revealWordsCinematic(subtitle, {
        delay: 560,
        duration: 740,
        step: 72
      })
    );

    buttons.forEach((button, index) => {
      endTimes.push(
        revealWordsCinematic(button, {
          delay: 980 + index * 180,
          duration: 680,
          step: 78,
          lockWidth: true
        })
      );
    });

    const totalDuration = Math.max(0, ...endTimes);

    win.setTimeout(() => {
      hero.classList.remove("hero--generating");
      hero.classList.add("hero--generated");

      win.setTimeout(() => {
        hero.classList.remove("hero--generated");
      }, 900);
    }, totalDuration + 150);
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
    setHeroStagger();
    setHeroGenerateSequence();
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
