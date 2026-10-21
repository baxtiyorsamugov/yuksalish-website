(() => {
  "use strict";
  if (!window.fetch || !window.DOMParser || !history.pushState) return;
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const animate = () => !reduced.matches && !document.body.classList.contains("motion-paused");
  const route = url => url.origin === location.origin && /^(?:\/(?:uz|uzc|ru|en)(?:\/|$)|\/$)/.test(url.pathname);
  const pageKey = url => url.pathname + url.search;
  let rendered = new URL(location.href);
  let request = null;
  let sequence = 0;
  let animation = null;
  let saving = false;
  let traversingHash = false;
  const positions = new Map();
  const entry = () => ({ id: `${Date.now()}-${Math.random()}`, x: scrollX, y: scrollY });
  const remember = () => {
    if (saving || rendered.href !== location.href || root.classList.contains("soft-navigation")) return;
    const position = { ...(history.state?.sitePage || entry()), x: scrollX, y: scrollY };
    positions.set(position.id, position);
    history.replaceState({ ...history.state, sitePage: position }, "", location.href);
  };
  history.scrollRestoration = "manual";
  if (!history.state?.sitePage) remember();
  let saveTimer = 0;
  addEventListener("scroll", () => {
    if (rendered.href !== location.href || saving || root.classList.contains("soft-navigation")) return;
    const position = history.state?.sitePage;
    if (position) positions.set(position.id, { ...position, x: scrollX, y: scrollY });
    clearTimeout(saveTimer);
    // Keep exact in-memory positions without exceeding browser History API limits.
    saveTimer = setTimeout(remember, 500);
  }, { passive: true });
  const cancelVisit = () => {
    ++sequence;
    request?.abort();
    animation?.cancel();
    animation = null;
    root.classList.remove("soft-navigation");
    document.querySelector("main").removeAttribute("aria-busy");
  };
  addEventListener("pagehide", () => { remember(); cancelVisit(); });
  addEventListener("hashchange", () => {
    const url = new URL(location.href);
    if (pageKey(url) !== pageKey(rendered)) return;
    if (!traversingHash) history.replaceState({ ...history.state, sitePage: entry() }, "", url);
    traversingHash = false;
    rendered = url;
    remember();
  });

  const prepareStyles = async (next, signal) => {
    const styles = [...next.querySelectorAll('link[rel="stylesheet"]')];
    const added = [];
    try {
      await Promise.all(styles.map(source => {
        const present = [...document.querySelectorAll('link[rel="stylesheet"]')].find(link => link.href === source.href);
        if (present) return Promise.resolve();
        return new Promise((resolve, reject) => {
          if (signal.aborted) { reject(new DOMException("Cancelled", "AbortError")); return; }
          const link = source.cloneNode();
          link.media = "not all";
          const cancel = () => { link.remove(); reject(new DOMException("Cancelled", "AbortError")); };
          const finish = callback => value => { signal.removeEventListener("abort", cancel); callback(value); };
          signal.addEventListener("abort", cancel, { once: true });
          link.onload = finish(resolve);
          link.onerror = finish(reject);
          added.push(link);
          document.head.append(link);
        });
      }));
      return () => {
        const desired = new Set(styles.map(source => source.href));
        document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
          if (!desired.has(link.href)) link.remove();
        });
        // Leave loaded sheets in place: moving their DOM nodes restarts CSS
        // animations. Only insert newly prepared sheets into the server order.
        [...styles].reverse().forEach((source, reverseIndex) => {
          const index = styles.length - 1 - reverseIndex;
          const link = [...document.querySelectorAll('link[rel="stylesheet"]')].find(link => link.href === source.href);
          link.media = source.media;
          if (added.includes(link)) {
            const nextHref = styles[index + 1]?.href;
            const before = [...document.querySelectorAll('link[rel="stylesheet"]')].find(node => node.href === nextHref) || document.head.querySelector("script");
            document.head.insertBefore(link, before);
          }
        });
      };
    } catch (error) {
      added.forEach(link => link.remove());
      throw error;
    }
  };
  const syncHeader = next => {
    const header = document.querySelector(".site-header");
    const incoming = next.querySelector(".site-header");
    if (root.lang !== next.documentElement.lang) {
      header.replaceChildren(...incoming.childNodes);
      return;
    }
    // Preserve the actual logo, buttons and header surface between section visits.
    const incomingLinks = [...incoming.querySelectorAll("a")];
    header.querySelectorAll("a").forEach((link, index) => {
      const source = incomingLinks[index];
      link.setAttribute("href", source.getAttribute("href"));
      if (source.hasAttribute("aria-current")) link.setAttribute("aria-current", source.getAttribute("aria-current"));
      else link.removeAttribute("aria-current");
    });
    const items = [...incoming.querySelectorAll(".nav-item")];
    header.querySelectorAll(".nav-item").forEach((item, index) => { item.className = items[index].className; });
  };
  const syncHead = next => {
    document.title = next.title;
    const metadata = 'meta[name="description"],meta[property^="og:"],meta[name="robots"],link[rel="alternate"]';
    document.head.querySelectorAll(metadata).forEach(node => node.remove());
    next.head.querySelectorAll(metadata).forEach(node => document.head.append(node));
  };
  const restorePosition = (url, position) => {
    if (position) scrollTo({ left: position.x, top: position.y, behavior: "instant" });
    else if (url.hash) {
      let target = null;
      try { target = document.getElementById(decodeURIComponent(url.hash.slice(1))); } catch { /* Malformed fragments stay harmless. */ }
      if (target) target.scrollIntoView({ behavior: "instant" });
      else scrollTo({ top: 0, behavior: "instant" });
    } else scrollTo({ top: 0, behavior: "instant" });
  };
  const visit = async (destination, { pop = false, position = null } = {}) => {
    if (!pop) remember();
    const id = ++sequence;
    request?.abort();
    request = new AbortController();
    const current = request;
    animation?.cancel();
    animation = null;
    document.querySelector("main").setAttribute("aria-busy", "true");
    const timeout = setTimeout(() => current.abort("timeout"), 12000);
    try {
      const response = await fetch(destination.href, { signal: current.signal, headers: { Accept: "text/html" }, credentials: "same-origin" });
      if ((!response.ok && response.status !== 404) || !response.headers.get("content-type")?.includes("text/html")) throw new Error("Not a public page");
      const next = new DOMParser().parseFromString(await response.text(), "text/html");
      // DOMParser parses noscript contents as markup; the live JS document does not.
      next.querySelectorAll("noscript").forEach(node => node.remove());
      if (!next.querySelector("main#main") || !next.querySelector(".site-header") || !next.querySelector(".site-footer")) throw new Error("Missing page shell");
      const scripts = document => [...document.querySelectorAll("script[src]")].map(script => new URL(script.getAttribute("src"), location.origin).href).join("\n");
      // Local edits or a future release must load their new runtime normally.
      if (scripts(next) !== scripts(document)) throw new Error("Runtime changed");
      const applyStyles = await prepareStyles(next, current.signal);
      if (id !== sequence) return;
      const url = new URL(response.url);
      if (!route(url)) throw new Error("Redirect left public site");
      url.hash = destination.hash;
      root.classList.add("soft-navigation");
      root.classList.remove("page-enter", "is-page-transition");
      document.dispatchEvent(new Event("site-page-before-change"));
      if (animate() && !pop) {
        animation = document.querySelector("main").animate([{ opacity: 1 }, { opacity: 0 }], { duration: 100, fill: "both" });
        await animation.finished.catch(() => {});
      }
      if (id !== sequence) return;
      animation?.cancel();
      animation = null;
      SitePage.unmount();
      applyStyles();
      syncHeader(next);
      syncHead(next);
      root.lang = next.documentElement.lang;
      [...document.body.classList].filter(name => name.startsWith("page-")).forEach(name => document.body.classList.remove(name));
      next.body.classList.forEach(name => document.body.classList.add(name));
      document.querySelector("main").replaceWith(next.querySelector("main"));
      document.querySelector(".site-footer").replaceWith(next.querySelector(".site-footer"));
      document.querySelector(".skip-link").textContent = next.querySelector(".skip-link").textContent;
      const top = document.querySelector(".back-to-top");
      const nextTop = next.querySelector(".back-to-top");
      ["aria-label", "title"].forEach(name => top.setAttribute(name, nextTop.getAttribute(name)));
      const toast = document.querySelector(".toast");
      toast.classList.remove("visible"); toast.textContent = "";
      if (pop) history.replaceState(history.state, "", url);
      else history.pushState({ sitePage: { ...entry(), x: 0, y: 0 } }, "", url);
      rendered = new URL(url);
      saving = true;
      restorePosition(url, position);
      SitePage.mount();
      restorePosition(url, position);
      const main = document.querySelector("main");
      main.focus({ preventScroll: true });
      root.classList.remove("soft-navigation");
      document.dispatchEvent(new Event("site-page-change"));
      root.dataset.pageTransition = pop ? "restored" : animate() ? "soft" : "reduced";
      if (animate() && !pop) {
        animation = main.animate([{ opacity: 0, transform: "translateY(18px)" }, { opacity: 1, transform: "none" }], {
          duration: 360, easing: "cubic-bezier(0.22, 1, 0.36, 1)", id: "page-arrive",
        });
        animation.finished.catch(() => {});
      }
      saving = false;
      remember();
    } catch (error) {
      if (id === sequence && (!current.signal.aborted || current.signal.reason === "timeout")) location.assign(destination.href);
    } finally {
      clearTimeout(timeout);
      if (id === sequence) {
        root.classList.remove("soft-navigation");
        document.querySelector("main").removeAttribute("aria-busy");
      }
    }
  };
  document.addEventListener("click", event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest("a[href]");
    if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
    const url = new URL(link.href);
    if (!route(url) || (pageKey(url) === pageKey(rendered) && url.hash)) return;
    event.preventDefault();
    visit(url);
  });
  document.addEventListener("submit", event => {
    const form = event.target;
    if (event.defaultPrevented || form.method.toLowerCase() !== "get" || (form.target && form.target !== "_self")) return;
    const url = new URL(form.action);
    if (!route(url)) return;
    const data = new FormData(form);
    if ([...data.values()].some(value => typeof value !== "string")) return;
    if (event.submitter?.name) data.append(event.submitter.name, event.submitter.value);
    url.search = new URLSearchParams(data).toString();
    event.preventDefault();
    visit(url);
  });
  addEventListener("popstate", event => {
    cancelVisit();
    const url = new URL(location.href);
    const position = positions.get(event.state?.sitePage?.id) || event.state?.sitePage || null;
    if (pageKey(url) === pageKey(rendered)) {
      traversingHash = url.hash !== rendered.hash;
      document.dispatchEvent(new Event("site-page-before-change"));
      rendered = url;
      restorePosition(url, position);
      document.dispatchEvent(new Event("site-page-change"));
    } else visit(url, { pop: true, position });
  });
  addEventListener("pageshow", event => {
    const type = performance.getEntriesByType("navigation")[0]?.type;
    if ((event.persisted || type === "reload" || type === "back_forward") && history.state?.sitePage)
      restorePosition(new URL(location.href), history.state.sitePage);
  });
})();
