(() => {
  "use strict";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)");
  const paused = () => reduced.matches || document.hidden || document.body.classList.contains("motion-paused");
  const selector = ".work-card,.content-card,.document-row,.person-card,.contact-card,.participation-card";
  const prepareCards = () => document.querySelectorAll(selector).forEach(card => card.classList.add("surface-spotlight"));
  prepareCards();

  let active = null;
  let frame = 0;
  let point = null;
  const animations = new Set();
  const icons = new WeakMap();
  const clearPointer = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    point = null;
    if (active) {
      active.classList.remove("is-pointed");
      active.style.removeProperty("--spot-x");
      active.style.removeProperty("--spot-y");
    }
    active = null;
  };
  const paintPointer = () => {
    frame = 0;
    if (!active || !point || paused() || !pointer.matches) return;
    const rect = active.getBoundingClientRect();
    active.style.setProperty("--spot-x", `${(point.x - rect.left).toFixed(1)}px`);
    active.style.setProperty("--spot-y", `${(point.y - rect.top).toFixed(1)}px`);
    active.classList.add("is-pointed");
  };
  document.addEventListener("pointermove", event => {
    if (event.pointerType === "touch" || paused() || !pointer.matches) return;
    const card = event.target.closest(".surface-spotlight");
    if (card !== active) {
      clearPointer();
      active = card;
    }
    if (!active) return;
    point = { x: event.clientX, y: event.clientY };
    if (!frame) frame = requestAnimationFrame(paintPointer);
  }, { passive: true });
  document.addEventListener("pointerout", event => {
    if (active && (!event.relatedTarget || !active.contains(event.relatedTarget))) clearPointer();
  }, { passive: true });
  // Animate only the decorative icon, keeping the button's hit area stationary.
  const respond = control => {
    if (!control || paused()) return;
    const icon = control.querySelector(":scope > .icon");
    if (!icon || typeof icon.animate !== "function") return;
    icons.get(icon)?.cancel();
    const animation = icon.animate([
      { translate: "0 0" },
      { translate: "3px -3px", offset: 0.42 },
      { translate: "-0.5px 0.5px", offset: 0.78 },
      { translate: "0 0" },
    ], { duration: 480, easing: "cubic-bezier(0.22, 1, 0.36, 1)", id: "icon-response" });
    icons.set(icon, animation);
    animations.add(animation);
    animation.onfinish = animation.oncancel = () => animations.delete(animation);
  };
  const controls = ".button,.share-button,.text-link";
  document.addEventListener("pointerover", event => {
    if (!pointer.matches || event.pointerType === "touch") return;
    const control = event.target.closest(controls);
    if (control && (!event.relatedTarget || !control.contains(event.relatedTarget))) respond(control);
  }, { passive: true });
  document.addEventListener("focusin", event => respond(event.target.closest(controls)));
  const reset = () => {
    clearPointer();
    animations.forEach(animation => animation.cancel());
    animations.clear();
  };
  reduced.addEventListener("change", reset);
  pointer.addEventListener("change", reset);
  document.addEventListener("site-motion-change", reset);
  document.addEventListener("visibilitychange", reset);
  addEventListener("pagehide", reset);
  document.addEventListener("site-page-before-change", reset);
  document.addEventListener("site-page-change", prepareCards);
})();
