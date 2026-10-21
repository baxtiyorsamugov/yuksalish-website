(() => {
  "use strict";
  const body = document.body;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const controllers = [];
  const isPaused = () => reduced.matches;
  const syncPreference = () => body.classList.toggle("motion-paused", isPaused());
  const updateMotion = () => {
    syncPreference();
    controllers.forEach((update) => update());
    document.dispatchEvent(new Event("site-motion-change"));
  };
  reduced.addEventListener("change", updateMotion);
  document.addEventListener("visibilitychange", () =>
    controllers.forEach((update) => update()),
  );

  SitePage.register(() => {
    syncPreference();
    const strip = document.querySelector(".partner-strip");
    if (!strip) return;
    const scope = SitePage.scope();
    const viewport = strip.querySelector(".partner-window");
    const track = strip.querySelector(".partner-track");
    const group = strip.querySelector(".partner-group");
    let visible = false;
    let lastSize = "";
    let rate = 1, boost = 0, frame = 0, lastFrame = 0;
    let held = false, hoverTimer = 0;
    let scrollPosition = scrollY, scrollTime = performance.now();
    const running = () => visible && !document.hidden && !isPaused();
    const animation = () => track.getAnimations().find(item => item.animationName === "partner-flow");
    const tick = time => {
      frame = 0;
      if (!running()) return;
      const motion = animation();
      if (!motion) return; // Focused links use the native, stationary strip.
      const delta = lastFrame ? Math.min((time - lastFrame) / 1000, 0.064) : 1 / 60;
      lastFrame = time;
      boost *= Math.exp(-delta * 2.8);
      const target = held ? 0 : 1 + boost;
      rate += (target - rate) * (1 - Math.exp(-delta * 10));
      if (Math.abs(rate - target) < 0.005 && (held || boost < 0.005)) {
        rate = held ? 0 : 1;
        motion.updatePlaybackRate(rate);
        lastFrame = 0;
        return;
      }
      motion.updatePlaybackRate(rate);
      frame = requestAnimationFrame(tick);
    };
    const queueRate = () => {
      if (!frame && running()) frame = requestAnimationFrame(tick);
    };
    scope.on(viewport, "pointerenter", event => {
      if (event.pointerType === "touch") return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => { held = true; queueRate(); }, 250);
    });
    scope.on(viewport, "pointerleave", () => {
      clearTimeout(hoverTimer);
      held = false;
      boost = 0;
      queueRate();
    });
    scope.on(viewport, "focusout", queueRate);
    scope.on(window, "scroll", () => {
      const now = performance.now();
      const velocity = Math.abs(scrollY - scrollPosition) / Math.max(16, now - scrollTime);
      scrollPosition = scrollY; scrollTime = now;
      if (!running() || held) return;
      boost = Math.max(boost, Math.min(velocity / 2.4, 1) * 3);
      queueRate();
    }, { passive: true });
    scope.keep(() => { cancelAnimationFrame(frame); clearTimeout(hoverTimer); });
    const fitPartners = () => {
      const width = group.getBoundingClientRect().width;
      if (!width || !group.children.length) return;
      const size = `${width}/${viewport.clientWidth}`;
      if (size === lastSize) return;
      lastSize = size;
      track
        .querySelectorAll(".partner-clone")
        .forEach((clone) => clone.remove());
      // Repeat enough identical groups to cover the window through a full cycle.
      const copies = Math.max(1, Math.ceil(viewport.clientWidth / width));
      for (let index = 0; index < copies; index++) {
        const clone = group.cloneNode(true);
        clone.classList.add("partner-clone");
        clone.setAttribute("aria-hidden", "true");
        clone.querySelectorAll("a").forEach((link) => (link.tabIndex = -1));
        track.append(clone);
      }
      track.style.setProperty("--partner-distance", `${width}px`);
      track.style.setProperty("--partner-duration", `${Math.max(30, width / 32)}s`);
      strip.classList.add("is-enhanced");
    };
    const updatePartners = () => {
      strip.classList.toggle(
        "is-in-view",
        visible && !document.hidden && !isPaused(),
      );
      if (running()) queueRate();
      else {
        cancelAnimationFrame(frame);
        frame = 0; lastFrame = 0; boost = 0;
      }
    };
    if ("ResizeObserver" in window) {
      const resize = new ResizeObserver(fitPartners);
      resize.observe(viewport);
      resize.observe(group);
      scope.keep(() => resize.disconnect());
    } else scope.on(window, "resize", fitPartners, { passive: true });
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          // Preload the full lane once it approaches the viewport. Horizontal
          // lazy loading otherwise leaves distant marks waiting during a loop.
          if (visible) strip.querySelectorAll('img[loading="lazy"]').forEach(image => { image.loading = "eager"; });
          updatePartners();
        },
        { rootMargin: "100px" },
      );
      observer.observe(strip);
      scope.keep(() => observer.disconnect());
    } else visible = true;
    controllers.push(updatePartners);
    scope.keep(() => controllers.splice(controllers.indexOf(updatePartners), 1));
    fitPartners();
    updatePartners();
    return scope.dispose;
  });

  const initWaves = () => {
    const canvas = document.querySelector(".ambient-waves");
    if (!canvas) return;
    let context;
    try {
      context = canvas.getContext("2d", { alpha: true });
    } catch {
      return;
    }
    if (!context) return; // The CSS glow remains when canvas is unavailable.
    // Port of Workspace's AuthWaves: full translucent surfaces below each
    // gently curved boundary, rather than blurred ribbons around a centerline.
    const waveLayers = [
      { amplitude: 42, baseline: 0.2, color: [0, 145, 168], offset: 0.2, opacity: 0.1, speed: 0.00012, wavelength: 440 },
      { amplitude: 52, baseline: 0.77, color: [61, 113, 180], offset: 1.8, opacity: 0.075, speed: -0.00009, wavelength: 520 },
      { amplitude: 25, baseline: 0.51, color: [0, 145, 168], offset: 3.4, opacity: 0.05, speed: 0.00007, wavelength: 360 },
    ];
    const fine = matchMedia("(pointer: fine)");
    let width = 0,
      height = 0,
      frame = 0,
      last = 0,
      phase = 0;
    let pointerX = 0,
      pointerY = 0,
      driftX = 0,
      driftY = 0;
    let scrollImpulse = 0;
    let speed = 1;
    let scrollPosition = window.scrollY;
    let scrollTime = performance.now();
    document.addEventListener("site-page-change", () => {
      scrollPosition = scrollY;
      scrollTime = performance.now();
      scrollImpulse = 0;
    });
    window.addEventListener(
      "scroll",
      () => {
        const now = performance.now();
        const distance = Math.abs(window.scrollY - scrollPosition);
        const elapsed = Math.max(16, now - scrollTime);
        scrollPosition = window.scrollY;
        scrollTime = now;
        if (isPaused() || document.hidden) return;
        scrollImpulse = Math.max(
          scrollImpulse,
          Math.min(distance / elapsed / 1.8, 1),
        );
      },
      { passive: true },
    );
    const draw = () => {
      context.clearRect(0, 0, width, height);
      for (const layer of waveLayers) {
        const [red, green, blue] = layer.color;
        const baseline = height * layer.baseline;
        const gradient = context.createLinearGradient(0, baseline - layer.amplitude * 2, width, baseline + layer.amplitude * 2);
        gradient.addColorStop(0, `rgba(${red},${green},${blue},0)`);
        gradient.addColorStop(0.3, `rgba(${red},${green},${blue},${layer.opacity})`);
        gradient.addColorStop(0.7, `rgba(${red},${green},${blue},${layer.opacity * 0.72})`);
        gradient.addColorStop(1, `rgba(${red},${green},${blue},0)`);
        const angle = phase * layer.speed + layer.offset;
        const yAt = x => baseline +
          Math.sin(x / layer.wavelength + angle) * layer.amplitude +
          Math.sin(x / (layer.wavelength * 0.48) + angle * 1.5) * layer.amplitude * 0.16 +
          driftY * 3 + driftX * x / width * 3;
        context.beginPath();
        context.moveTo(-24, yAt(-24));
        for (let x = -8; x <= width + 24; x += 16) context.lineTo(x, yAt(x));
        context.lineTo(width + 24, height + 28);
        context.lineTo(-24, height + 28);
        context.closePath();
        context.fillStyle = gradient;
        context.fill();
        context.beginPath();
        context.moveTo(-24, yAt(-24));
        for (let x = -8; x <= width + 24; x += 16) context.lineTo(x, yAt(x));
        context.strokeStyle = `rgba(${red},${green},${blue},${layer.opacity * 1.15})`;
        context.lineWidth = 1;
        context.stroke();
      }
    };
    const loop = (time) => {
      frame = requestAnimationFrame(loop);
      const interval = width < 768 ? 1000 / 20 : 1000 / 30;
      if (last && time - last < interval) return;
      const delta = last ? Math.min((time - last) / 1000, 0.08) : 0;
      last = time;
      scrollImpulse *= Math.exp(-delta * 2.8);
      const targetSpeed = 1 + scrollImpulse * (width < 768 ? 4 : 7);
      speed += (targetSpeed - speed) * (1 - Math.exp(-delta * 7));
      phase += delta * 1265 * speed;
      canvas.dataset.waveSpeed = speed.toFixed(3);
      driftX += (pointerX - driftX) * 0.025;
      driftY += (pointerY - driftY) * 0.025;
      draw();
    };
    const updateWaves = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      scrollImpulse = 0;
      speed = 1;
      canvas.dataset.waveSpeed = "1.000";
      if (!document.hidden && !isPaused()) frame = requestAnimationFrame(loop);
    };
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      if (!width || !height) return;
      const ratio = Math.min(
        devicePixelRatio || 1,
        width < 768 ? 1.25 : 1.5,
        Math.sqrt(1800000 / (width * height)),
      );
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw();
    };
    if (fine.matches) {
      window.addEventListener(
        "pointermove",
        (event) => {
          if (isPaused() || width < 1024) return;
          pointerX = event.clientX / width - 0.5;
          pointerY = event.clientY / height - 0.5;
        },
        { passive: true },
      );
      document.documentElement.addEventListener("pointerleave", () => {
        pointerX = 0;
        pointerY = 0;
      });
    }
    let resizeFrame = 0;
    window.addEventListener(
      "resize",
      () => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(resize);
      },
      { passive: true },
    );
    controllers.push(updateWaves);
    resize();
  };
  initWaves();
  updateMotion();
})();
