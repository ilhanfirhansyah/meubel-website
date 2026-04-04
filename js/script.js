(() => {
  const doc = document;
  const win = window;
  const prefersReducedMotion = win.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const initNavbar = () => {
    const navToggle = doc.querySelector(".nav-toggle");
    const navMenu = doc.querySelector(".nav-menu");
    const navbar = doc.querySelector(".navbar");
    if (!navMenu || !navbar) return;

    if (navToggle) {
      navToggle.addEventListener("click", () => {
        const isOpen = navMenu.classList.toggle("is-open");
        navToggle.setAttribute("aria-expanded", String(isOpen));
      });

      navMenu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          navMenu.classList.remove("is-open");
          navToggle.setAttribute("aria-expanded", "false");
        });
      });
    }

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        navbar.classList.toggle("navbar--scrolled", win.scrollY > 10);
        ticking = false;
      });
    };

    win.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  };

  const initCounter = () => {
    const counters = doc.querySelectorAll(".hero__stats [data-target]");
    if (!counters.length) return;

    const run = (el, index) => {
      if (el.dataset.counted === "true") return;
      el.dataset.counted = "true";

      const target = Number(el.getAttribute("data-target") || "0");
      if (!target) return;

      const duration = 3000;
      const delay = 500 + index * 260;
      const start = performance.now();
      const loop = (now) => {
        const elapsed = now - start;
        if (elapsed < delay) {
          requestAnimationFrame(loop);
          return;
        }

        const progress = Math.min((elapsed - delay) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = String(Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    };

    if (!("IntersectionObserver" in win) || prefersReducedMotion) {
      counters.forEach((counter, index) => run(counter, index));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          counters.forEach((counter, index) => run(counter, index));
          obs.disconnect();
        });
      },
      { threshold: 0.35 }
    );

    const stats = doc.querySelector(".hero__stats");
    if (stats) observer.observe(stats);
  };

  const initFAQ = () => {
    const items = doc.querySelectorAll(".faq-item");
    if (!items.length) return;

    items.forEach((item) => {
      const toggle = item.querySelector(".faq-toggle");
      if (!toggle) return;

      toggle.addEventListener("click", () => {
        const open = item.hasAttribute("open");

        items.forEach((it) => {
          it.removeAttribute("open");
          it.querySelector(".faq-toggle")?.setAttribute("aria-expanded", "false");
        });

        if (!open) {
          item.setAttribute("open", "");
          toggle.setAttribute("aria-expanded", "true");
        }
      });
    });
  };

  const initGalleryFilter = () => {
    const buttons = doc.querySelectorAll(".filter-btn");
    const items = doc.querySelectorAll("#gallery-grid .gallery-item");
    const galleryGrid = doc.getElementById("gallery-grid");
    if (!buttons.length || !items.length || !galleryGrid) return;

    const apply = (filter) => {
      let visibleCount = 0;
      let visibleItem = null;

      items.forEach((item) => {
        const category = item.getAttribute("data-category") || "";
        const isHidden = filter !== "*" && category !== filter;
        item.classList.toggle("is-hidden", isHidden);
        item.classList.remove("gallery-item--single");

        if (!isHidden) {
          visibleCount += 1;
          visibleItem = item;
        }
      });

      const isSingle = visibleCount === 1;
      galleryGrid.classList.toggle("gallery-grid--single", isSingle);
      if (isSingle && visibleItem) {
        visibleItem.classList.add("gallery-item--single");
      }
    };

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        buttons.forEach((btn) => {
          btn.classList.remove("active");
          btn.setAttribute("aria-pressed", "false");
        });
        button.classList.add("active");
        button.setAttribute("aria-pressed", "true");
        apply(button.getAttribute("data-filter") || "*");
      });
    });

    apply("*");
  };

  const initLightbox = () => {
    const images = Array.from(doc.querySelectorAll(".gallery-item img"));
    const lightbox = doc.getElementById("gallery-lightbox");
    const lightboxImg = doc.getElementById("lightbox-img");
    const close = doc.querySelector(".gallery-lightbox__close");
    if (!images.length || !lightbox || !lightboxImg || !close) return;

    let index = 0;
    const open = (nextIndex) => {
      index = nextIndex;
      lightboxImg.src = images[index].src;
      lightboxImg.alt = images[index].alt;
      lightbox.classList.add("active");
      doc.body.style.overflow = "hidden";
    };

    const closeBox = () => {
      lightbox.classList.remove("active");
      doc.body.style.overflow = "";
    };

    images.forEach((img, i) => img.addEventListener("click", () => open(i)));
    close.addEventListener("click", closeBox);
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeBox();
    });

    doc.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("active")) return;
      if (e.key === "Escape") closeBox();
      if (e.key === "ArrowRight") open((index + 1) % images.length);
      if (e.key === "ArrowLeft") open((index - 1 + images.length) % images.length);
    });
  };

  const initSwiper = () => {
    if (typeof Swiper === "undefined") return;
    new Swiper(".testimonials-swiper", {
      slidesPerView: 1,
      spaceBetween: 20,
      loop: true,
      speed: 600,
      autoplay: prefersReducedMotion
        ? false
        : {
            delay: 5000,
            disableOnInteraction: false
          },
      pagination: { el: ".swiper-pagination", clickable: true },
      navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
      breakpoints: {
        768: { slidesPerView: 2 },
        1024: { slidesPerView: 3, spaceBetween: 24 }
      }
    });
  };

  const boot = () => {
    initNavbar();
    initCounter();
    initFAQ();
    initGalleryFilter();
    initLightbox();
    initSwiper();
  };

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
