(() => {
  "use strict";
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(pointer: fine)");
  const paused = () => document.body?.classList.contains("motion-paused");
  const canAnimate = () => !reduced.matches && !paused();
  const historyRestore = () => performance.getEntriesByType("navigation")[0]?.type === "back_forward";
  let scroller = null;
  let revealed = false;
  let capturingTransition = null;
  const captureHeader = (transition) => {
    // A permanently named ancestor isolates backdrop sampling in Chromium.
    // Keep snapshot names only while the transition captures its two frames.
    root.classList.add("is-page-transition");
    capturingTransition = transition;
    const release = () => {
      if (capturingTransition !== transition) return;
      capturingTransition = null;
      root.classList.remove("is-page-transition");
    };
    transition.ready.then(release, release);
    transition.finished.then(release, release);
  };

  // Register in the head before the incoming document's first paint.
  addEventListener("pagereveal", (event) => {
    const restoring = revealed || historyRestore();
    revealed = true;
    capturingTransition = null;
    root.classList.remove("page-enter", "is-page-transition");
    const transition = event.viewTransition;
    if (transition) {
      captureHeader(transition);
      root.dataset.pageTransition = canAnimate() ? "native" : "reduced";
      transition.ready.catch(() => {});
      transition.finished.catch(() => {});
      if (!canAnimate()) transition.skipTransition();
    } else if (canAnimate() && !restoring) {
      root.dataset.pageTransition = "entry";
      root.classList.add("page-enter");
    } else root.dataset.pageTransition = canAnimate() ? "restored" : "reduced";
  });

  addEventListener("pageswap", (event) => {
    scroller?.destroy();
    scroller = null;
    root.classList.remove("page-enter");
    if (event.viewTransition) {
      captureHeader(event.viewTransition);
      event.viewTransition.ready.catch(() => {});
      event.viewTransition.finished.catch(() => {});
      if (!canAnimate()) event.viewTransition.skipTransition();
    }
  });

  addEventListener("DOMContentLoaded", () => {
    document.querySelector("main")?.addEventListener("animationend", event => {
      if (event.target.id === "main" && event.animationName === "page-arrive")
        root.classList.remove("page-enter");
    });
    if (!("onpagereveal" in window) && canAnimate() && !historyRestore()) {
      root.dataset.pageTransition = "entry";
      root.classList.add("page-enter");
    }
    const syncScroller = () => {
      root.classList.toggle("motion-is-paused", Boolean(paused()));
      const enabled =
        canAnimate() && finePointer.matches && !document.hidden &&
        !root.classList.contains("navigation-open") && !root.classList.contains("soft-navigation") && window.Lenis;
      if (!enabled) {
        scroller?.destroy();
        scroller = null;
      } else if (!scroller) {
        scroller = new Lenis({
          autoRaf: true,
          lerp: 0.14,
          smoothWheel: true,
          syncTouch: false,
          anchors: false,
          allowNestedScroll: true,
          stopInertiaOnNavigate: true,
        });
      }
    };
    syncScroller();
    reduced.addEventListener("change", syncScroller);
    finePointer.addEventListener("change", syncScroller);
    document.addEventListener("site-motion-change", syncScroller);
    document.addEventListener("site-navigation-change", syncScroller);
    document.addEventListener("site-page-before-change", () => {
      scroller?.destroy();
      scroller = null;
    });
    document.addEventListener("site-page-change", syncScroller);
    document.addEventListener("visibilitychange", syncScroller);
    addEventListener("pageshow", syncScroller);
    addEventListener("pagehide", () => {
      scroller?.destroy();
      scroller = null;
    });

    // Let native anchors retain their URL, focus, offsets and history semantics.
    // Discard wheel momentum first so it cannot pull the page away from a target.
    document.addEventListener("click", (event) => {
      if (
        event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
      ) return;
      const link = event.target.closest("a[href]");
      if (!link || link.hasAttribute("download") ||
          (link.target && link.target !== "_self")) return;
      const url = new URL(link.href, location.href);
      if (url.origin === location.origin && url.pathname === location.pathname &&
          url.search === location.search && url.hash) scroller?.reset();
    });
    document.addEventListener("keydown", (event) => {
      if (["Tab", "PageDown", "PageUp", "Home", "End", " ", "ArrowDown", "ArrowUp"].includes(event.key))
        scroller?.reset();
    });

    const button = document.querySelector(".back-to-top");
    if (!button) return;
    let scheduled = false;
    const updateButton = () => {
      scheduled = false;
      const range = document.documentElement.scrollHeight - innerHeight;
      const progress = range > 0 ? Math.max(0, Math.min(1, scrollY / range)) : 0;
      root.style.setProperty("--scroll-progress", progress.toFixed(4));
      const visible = scrollY > Math.min(520, innerHeight * 0.65);
      button.classList.toggle("is-visible", visible);
      const unavailable = !visible || root.classList.contains("navigation-open");
      button.inert = unavailable;
      button.setAttribute("aria-hidden", String(unavailable));
    };
    const queueButton = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(updateButton);
    };
    button.hidden = false;
    updateButton();
    addEventListener("scroll", queueButton, { passive: true });
    addEventListener("resize", queueButton);
    addEventListener("pageshow", queueButton);
    document.addEventListener("site-navigation-change", queueButton);
    document.addEventListener("site-page-change", queueButton);
    addEventListener("load", queueButton, { once: true });
    if ("ResizeObserver" in window) {
      const geometry = new ResizeObserver(queueButton);
      const observePage = () => {
        geometry.disconnect();
        [document.querySelector("main"), document.querySelector("footer")]
          .filter(Boolean).forEach(element => geometry.observe(element));
      };
      observePage();
      document.addEventListener("site-page-change", observePage);
    }
    button.addEventListener("click", () => {
      document.querySelector(".brand")?.focus({ preventScroll: true });
      if (scroller) scroller.scrollTo(0, { duration: 0.85, lerp: null });
      else scrollTo({ top: 0, behavior: canAnimate() ? "smooth" : "instant" });
    });
  });
})();
