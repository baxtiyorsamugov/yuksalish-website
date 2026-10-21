SitePage.register(() => {
  "use strict";
  const scope = SitePage.scope();
  const on = scope.on;
  const root = document.documentElement;
  const header = document.querySelector(".site-header");
  const navigation = header.querySelector(".main-nav");
  const menuButton = header.querySelector(".menu-toggle");
  const sectionButtons = [...header.querySelectorAll(".nav-toggle")];
  const language = header.querySelector(".language-switch");
  const languageButton = language.querySelector("summary");
  const scrim = header.querySelector(".nav-scrim");
  const desktop = matchMedia("(min-width: 1200px)");
  const background = [...document.querySelectorAll("main,footer")];
  let savedInert = null;
  const panelFor = button => document.getElementById(button.getAttribute("aria-controls"));
  const openButton = () => sectionButtons.find(button => button.getAttribute("aria-expanded") === "true");
  const syncScrim = () => { scrim.hidden = !(navigation.classList.contains("is-open") || openButton() || language.open); };
  const closeSections = () => {
    sectionButtons.forEach(button => {
      button.setAttribute("aria-expanded", "false");
      panelFor(button).hidden = true;
    });
  };
  const setMobileOpen = open => {
    open = open && !desktop.matches;
    const changed = root.classList.contains("navigation-open") !== open;
    navigation.classList.toggle("is-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    root.classList.toggle("navigation-open", open);
    if (open && !savedInert) {
      savedInert = background.map(element => [element, element.inert]);
      background.forEach(element => { element.inert = true; });
    } else if (!open && savedInert) {
      savedInert.forEach(([element, inert]) => { element.inert = inert; });
      savedInert = null;
    }
    if (changed) document.dispatchEvent(new Event("site-navigation-change"));
    syncScrim();
  };
  const closeNavigation = () => {
    closeSections();
    language.open = false;
    setMobileOpen(false);
  };
  const expand = (button, focusEdge) => {
    closeSections();
    language.open = false;
    button.setAttribute("aria-expanded", "true");
    const panel = panelFor(button);
    panel.hidden = false;
    syncScrim();
    if (focusEdge) {
      const links = [...panel.querySelectorAll("a")];
      (focusEdge === "last" ? links.at(-1) : links[0])?.focus();
    }
  };
  sectionButtons.forEach(button => on(button, "click", () => {
    if (button.getAttribute("aria-expanded") === "true") {
      closeSections();
      syncScrim();
    } else expand(button);
  }));
  on(menuButton, "click", () => {
    const open = !navigation.classList.contains("is-open");
    closeSections();
    language.open = false;
    setMobileOpen(open);
  });
  on(languageButton, "click", () => {
    // Close the other panel before the native details default action opens this one.
    closeSections();
    setMobileOpen(false);
    queueMicrotask(syncScrim);
  });
  on(language, "toggle", () => {
    if (language.open) {
      closeSections();
      setMobileOpen(false);
    }
    syncScrim();
  });
  on(document, "pointerdown", event => {
    if (event.target === scrim || !header.contains(event.target)) {
      const mobileWasOpen = navigation.classList.contains("is-open");
      closeNavigation();
      if (mobileWasOpen) menuButton.focus({ preventScroll: true });
    }
  });
  on(header, "focusout", event => {
    if (event.relatedTarget && !header.contains(event.relatedTarget)) closeNavigation();
  });
  on(header, "click", event => {
    if (event.target.closest("a[href]") && event.button === 0 &&
      !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) closeNavigation();
  });
  on(document, "keydown", event => {
    if (event.key !== "Escape") return;
    const button = openButton();
    if (language.open) { language.open = false; languageButton.focus({ preventScroll: true }); syncScrim(); }
    else if (button) { closeSections(); button.focus({ preventScroll: true }); syncScrim(); }
    else if (navigation.classList.contains("is-open")) { closeNavigation(); menuButton.focus({ preventScroll: true }); }
    else return;
    event.preventDefault();
  });
  on(header, "keydown", event => {
    const trigger = event.target.closest(".nav-toggle");
    if (trigger && ["ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      expand(trigger.closest(".nav-item").querySelector(".nav-toggle"), event.key === "ArrowUp" ? "last" : "first");
      return;
    }
    if (trigger && desktop.matches && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      const index = sectionButtons.indexOf(trigger);
      closeSections(); syncScrim();
      sectionButtons[(index + (event.key === "ArrowRight" ? 1 : sectionButtons.length - 1)) % sectionButtons.length].focus();
      return;
    }
    if (event.target === languageButton && ["ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      closeSections(); setMobileOpen(false); language.open = true; syncScrim();
      const links = [...language.querySelectorAll("a")];
      (event.key === "ArrowUp" ? links.at(-1) : links[0]).focus();
      return;
    }
    const panel = event.target.closest(".nav-dropdown,.language-options");
    if (panel && ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const links = [...panel.querySelectorAll("a")];
      const index = links.indexOf(document.activeElement);
      const next = event.key === "Home" ? 0 : event.key === "End" ? links.length - 1 :
        (index + (event.key === "ArrowDown" ? 1 : links.length - 1)) % links.length;
      links[next]?.focus();
    }
  });
  on(desktop, "change", closeNavigation);
  on(window, "pageswap", closeNavigation);
  scope.keep(closeNavigation);
  return scope.dispose;
});
