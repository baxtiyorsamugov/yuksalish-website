(() => {
  "use strict";
  const components = [];
  window.SitePage = {
    register(init) {
      const component = { init, dispose: init() };
      components.push(component);
    },
    unmount() {
      components.forEach(component => { component.dispose?.(); component.dispose = null; });
    },
    mount() {
      components.forEach(component => { component.dispose = component.init(); });
    },
    scope() {
      const controller = new AbortController();
      const disposers = [];
      return {
        on(target, type, listener, options = {}) {
          target.addEventListener(type, listener, { ...options, signal: controller.signal });
        },
        keep(dispose) { disposers.push(dispose); },
        dispose() {
          controller.abort();
          disposers.reverse().forEach(dispose => dispose());
        },
      };
    },
  };
})();
