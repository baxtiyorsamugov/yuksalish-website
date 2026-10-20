(() => {
  "use strict";
  document.documentElement.classList.remove("no-js");
  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".main-nav");
  const details = [...document.querySelectorAll(".site-header details")];
  const closeMenus = () =>
    details.forEach((detail) => {
      detail.open = false;
    });
  const closeNavigation = () => {
    navigation.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
    closeMenus();
  };
  menuButton.addEventListener("click", () => {
    const open = !navigation.classList.contains("is-open");
    navigation.classList.toggle("is-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    if (!open) closeMenus();
  });
  details.forEach((detail) =>
    detail.addEventListener("toggle", () => {
      if (detail.open)
        details
          .filter((other) => other !== detail)
          .forEach((other) => {
            other.open = false;
          });
    }),
  );
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".site-header")) closeNavigation();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const open = details.find((detail) => detail.open);
    if (open) {
      open.open = false;
      open.querySelector("summary").focus();
    } else if (navigation.classList.contains("is-open")) {
      closeNavigation();
      menuButton.focus();
    }
  });
  const desktop = matchMedia("(min-width:1024px)");
  desktop.addEventListener("change", closeNavigation);
  const reduced = matchMedia("(prefers-reduced-motion:reduce)");
  const hero = document.querySelector(".hero");
  if (hero && matchMedia("(pointer:fine)").matches) {
    hero.addEventListener("pointermove", (event) => {
      if (reduced.matches || !desktop.matches) return;
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
    hero.addEventListener("pointerleave", () => {
      hero.style.removeProperty("--mx");
      hero.style.removeProperty("--my");
    });
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
    document
      .querySelectorAll(".section-heading,.work-card,.region-panel,.join-panel")
      .forEach((element) => {
        element.classList.add("reveal");
        observer.observe(element);
      });
  }
  let toastTimeout;
  document.querySelectorAll(".copy-link").forEach((button) =>
    button.addEventListener("click", async () => {
      const toast = document.querySelector(".toast");
      try {
        await navigator.clipboard.writeText(location.href);
        toast.textContent = button.dataset.success;
      } catch {
        toast.textContent = button.dataset.error;
      }
      toast.classList.add("visible");
      clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => toast.classList.remove("visible"), 3500);
    }),
  );
  const replaceBrokenImage = (img) => {
    const placeholder = document.createElement("div");
    placeholder.className = "image-fallback";
    const logo = document.createElement("img");
    logo.src = "/assets/images/yuksalish-logo.svg";
    logo.alt = "";
    placeholder.append(logo);
    img.replaceWith(placeholder);
  };
  document
    .querySelectorAll(".card-image img,.article-cover img")
    .forEach((img) => {
      img.addEventListener("error", () => replaceBrokenImage(img), {
        once: true,
      });
      if (img.complete && img.naturalWidth === 0) replaceBrokenImage(img);
    });
})();
