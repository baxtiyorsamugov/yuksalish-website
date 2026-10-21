SitePage.register(() => {
  "use strict";
  const scope = SitePage.scope();
  const on = scope.on;
  document.documentElement.classList.remove("no-js");
  const desktop = matchMedia("(min-width:1024px)");
  const reduced = matchMedia("(prefers-reduced-motion:reduce)");
  const hero = document.querySelector(".hero");
  if (hero && matchMedia("(pointer:fine)").matches) {
    const resetParallax = () => {
      hero.style.removeProperty("--mx");
      hero.style.removeProperty("--my");
    };
    on(hero, "pointermove", (event) => {
      if (
        reduced.matches ||
        !desktop.matches ||
        document.body.classList.contains("motion-paused")
      )
        return;
      const rect = hero.getBoundingClientRect();
      hero.style.setProperty(
        "--mx",
        `${((event.clientX - rect.left) / rect.width - 0.5) * 20}px`,
      );
      hero.style.setProperty(
        "--my",
        `${((event.clientY - rect.top) / rect.height - 0.5) * 16}px`,
      );
    });
    on(hero, "pointerleave", resetParallax);
    on(desktop, "change", resetParallax);
    on(reduced, "change", resetParallax);
    on(document, "site-motion-change", resetParallax);
  }
  if (!reduced.matches && desktop.matches && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }),
      { threshold: 0.08 },
    );
    scope.keep(() => observer.disconnect());
    document
      .querySelectorAll(
        ".section-heading,.work-card,.region-panel,.join-panel,.content-card,.partners-heading,.footer-invitation,.page-heading,.article-hero,.project-facts,.article-cover-editorial,.document-row,.person-card",
      )
      .forEach((element, index) => {
        const bounds = element.getBoundingClientRect();
        if (bounds.top < innerHeight && bounds.bottom > 0) return;
        element.style.setProperty("--reveal-delay", `${(index % 3) * 65}ms`);
        element.classList.add("reveal");
        observer.observe(element);
      });
  }
  let toastTimeout;
  scope.keep(() => clearTimeout(toastTimeout));
  document.querySelectorAll(".copy-link").forEach((button) =>
    on(button, "click", async () => {
      const toast = document.querySelector(".toast");
      try {
        const address = new URL(location.href);
        address.hash = "";
        await navigator.clipboard.writeText(address.href);
        toast.textContent = button.dataset.success;
      } catch {
        toast.textContent = button.dataset.error;
      }
      toast.classList.add("visible");
      clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => toast.classList.remove("visible"), 3500);
    }),
  );
  const contents = document.querySelector(".article-contents");
  if (contents) {
    const fitContents = () => {
      contents.open = desktop.matches;
    };
    fitContents();
    on(desktop, "change", fitContents);
    const links = [...contents.querySelectorAll('nav a[href^="#"]')];
    const sections = links.map((link) => ({
      link,
      target: document.getElementById(link.hash.slice(1)),
    }));
    links.forEach((link) =>
      on(link, "click", () => {
        if (!desktop.matches) contents.open = false;
      }),
    );
    let scheduled = false;
    let contentsFrame = 0;
    scope.keep(() => cancelAnimationFrame(contentsFrame));
    const updateContents = () => {
      scheduled = false;
      let current = sections[0];
      const offset =
        document.querySelector(".site-header").getBoundingClientRect().height +
        30;
      sections.forEach((section) => {
        if (
          section.target &&
          section.target.getBoundingClientRect().top <= offset
        )
          current = section;
      });
      links.forEach((link) => {
        if (link === current.link)
          link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    };
    const queueContents = () => {
      if (scheduled) return;
      scheduled = true;
      contentsFrame = requestAnimationFrame(updateContents);
    };
    on(window, "scroll", queueContents, { passive: true });
    on(window, "resize", queueContents);
    updateContents();
  }
  const replaceBrokenImage = (img) => {
    const placeholder = document.createElement("div");
    placeholder.className = "image-fallback";
    const logo = document.createElement("img");
    logo.src = "/assets/images/yuksalish-logo.png";
    logo.alt = "";
    placeholder.append(logo);
    img.replaceWith(placeholder);
  };
  document
    .querySelectorAll(".card-image img,.article-cover img")
    .forEach((img) => {
      on(img, "error", () => replaceBrokenImage(img), {
        once: true,
      });
      if (img.complete && img.naturalWidth === 0) replaceBrokenImage(img);
    });
  return scope.dispose;
});
