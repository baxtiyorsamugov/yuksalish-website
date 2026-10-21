const { test, expect } = require("@playwright/test");
const fs = require("node:fs");

test("inner pages share waves that accelerate with scrolling and settle afterward", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const route of [
    "projects",
    "project_detail/47",
    "news",
    "news_detail/937",
    "news_detail/938",
  ]) {
    await page.goto(`/ru/${route}`);
    const canvas = page.locator(".ambient-waves");
    await expect(canvas).toBeVisible();
    const pixels = await canvas.evaluate((el) => el.toDataURL());
    await expect
      .poll(() => canvas.evaluate((el) => el.toDataURL()))
      .not.toBe(pixels);
  }
  const canvas = page.locator(".ambient-waves");
  const speed = () => canvas.evaluate((el) => Number(el.dataset.waveSpeed));
  await page.mouse.wheel(0, 800);
  await expect.poll(speed).toBeGreaterThan(2);
  await expect.poll(speed, { timeout: 6000 }).toBeLessThan(1.1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const paused = await canvas.evaluate((el) => el.toDataURL());
  await page.mouse.wheel(0, -500);
  await page.waitForTimeout(200);
  expect(await canvas.evaluate((el) => el.toDataURL())).toBe(paused);
  expect(await speed()).toBe(1);
  const related = page.locator(".related-section .content-card").first();
  await related.locator("h3 a").focus();
  await expect(related).toHaveCSS("opacity", "1");
});

test("home projects preserve the continuous wave background at section edges", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [360, 390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/ru");
    await page.evaluate(() => document.fonts.ready);
    const section = page.locator(".projects-section");
    await expect(section).toHaveCSS("background-image", "none");
    await expect(section).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    for (const edge of ["top", "bottom"]) {
      const boundary = await section.evaluate((el, edge) => {
        const rect = el.getBoundingClientRect();
        scrollTo({ top: scrollY + rect[edge] - 32, behavior: "instant" });
        return el.getBoundingClientRect()[edge];
      }, edge);
      const screenshot = await page.screenshot();
      const difference = await page.evaluate(async ({ png, boundary }) => {
        const bytes = Uint8Array.from(atob(png), value => value.charCodeAt(0));
        const image = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
        const canvas = document.createElement("canvas");
        canvas.width = image.width; canvas.height = image.height;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0);
        image.close();
        let maximum = 0;
        for (const x of [4, 10, innerWidth - 10, innerWidth - 4]) {
          const before = context.getImageData(x, Math.floor(boundary) - 2, 1, 1).data;
          const after = context.getImageData(x, Math.ceil(boundary) + 2, 1, 1).data;
          for (let channel = 0; channel < 3; channel++) maximum = Math.max(maximum, Math.abs(before[channel] - after[channel]));
        }
        return maximum;
      }, { png: screenshot.toString("base64"), boundary });
      expect(difference, `${width}px ${edge} edge`).toBeLessThanOrEqual(2);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});

test("hover is distinct from the selected filter and its active outline is uniform", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/ru/projects");
  const current = page.locator(".filter-tabs a[aria-current]");
  const environment = page
    .locator(".filter-tabs a")
    .filter({ hasText: "Экология" });
  await environment.hover();
  await expect(current).toHaveCount(1);
  const activeColor = await current.evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  expect(
    await environment.evaluate((el) => getComputedStyle(el).backgroundColor),
  ).not.toBe(activeColor);
  await expect(current).toHaveCSS("background-image", "none");
  await expect(current).toHaveCSS("border-top-color", activeColor);
  await environment.click();
  await expect(page).toHaveURL(/category=environment/);
  await expect(page.locator(".filter-tabs a[aria-current]")).toHaveText(
    /Экология/,
  );
  await page.locator(".filter-tabs a").filter({ hasText: "Все" }).hover();
  await expect(page.locator(".filter-tabs a[aria-current]")).toHaveCount(1);
});

test("opaque white surfaces stay readable above content without glass effects", async ({
  page,
}) => {
  fs.mkdirSync("artifacts/white-ui", { recursive: true });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/ru/projects");
  await expect(page.locator(".header-inner")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(page.locator(".header-inner")).toHaveCSS("backdrop-filter", "none");
  await expect(page.locator('.header-glass, feDisplacementMap, script[src*="/glass.js"], link[href*="/glass.css"]')).toHaveCount(0);
  await expect(page.locator(".brand img")).toHaveAttribute("src", /yuksalish-logo\.png/);
  await expect(page.locator(".footer-brand img")).toHaveAttribute("src", /yuksalish-logo\.png/);
  expect(await page.locator(".brand img").evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true);
  await expect(page.locator(".nav-toggle").first()).toHaveCSS("filter", "none");
  await expect(page.locator(".search-form .button")).toHaveCSS("backdrop-filter", "none");
  await expect(page.locator(".header-actions .button")).toHaveCSS("backdrop-filter", "none");
  await expect(page.locator(".filter-tabs a:not([aria-current])").first()).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await page.evaluate(() => scrollTo({ top: 460, behavior: "instant" }));
  const toggle = page.getByRole("button", { name: "Меню раздела: О движении", exact: true });
  const bounds = await toggle.boundingBox();
  await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await expect(page.locator("#nav-about")).toBeVisible();
  await expect(page.locator("#nav-about")).toHaveCSS("backdrop-filter", "none");
  await expect(page.locator("#nav-about")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await page.screenshot({ path: "artifacts/white-ui/menu-desktop.png" });
  await expect(page.locator(".header-inner")).toHaveCSS("view-transition-name", "none");
  await page.keyboard.press("Escape");
  await expect(page.locator("#nav-about")).toBeHidden();
  await expect(toggle).toBeFocused();
  await page.emulateMedia({ forcedColors: "active" });
  await expect(page.locator(".header-inner")).toHaveCSS("backdrop-filter", "none");
  await expect(page.locator(".search-form .button")).toHaveCSS("backdrop-filter", "none");
  await page.emulateMedia({ forcedColors: "none" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ru/projects");
  await page.locator(".menu-toggle").click();
  await expect(page.locator(".main-nav")).toHaveCSS("backdrop-filter", "none");
  await expect(page.locator(".main-nav")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await page.getByRole("button", { name: "Меню раздела: О движении", exact: true }).click();
  await expect(page.locator("#nav-about")).toHaveCSS("backdrop-filter", "none");
  await page.screenshot({ path: "artifacts/white-ui/menu-mobile.png" });
  await page.locator(".language-switch summary").click();
  await expect(page.locator(".main-nav")).not.toHaveClass(/is-open/);
  await expect(page.locator(".language-options")).toBeVisible();
  await expect(page.locator(".language-options")).toHaveCSS("backdrop-filter", "none");
  await expect(page.locator(".language-options")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await page.screenshot({ path: "artifacts/white-ui/languages-mobile.png" });
});

test("capture shared waves, filters, white header and complete Y", async ({
  page,
}) => {
  fs.mkdirSync("artifacts/shared-motion", { recursive: true });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    for (const [name, route] of [
      ["home", ""],
      ["catalog", "projects"],
      ["project", "project_detail/47"],
      ["news", "news_detail/937"],
      ["article", "news_detail/938"],
    ]) {
      await page.goto(`/ru/${route}`);
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: `artifacts/shared-motion/${name}-${width}.png`,
      });
      if (name === "project" && width === 1440) {
        await page.evaluate(() => window.scrollTo(0, 330));
        await page.screenshot({
          path: "artifacts/shared-motion/project-scrolled-1440.png",
        });
      }
    }
    await page.goto("/ru/projects");
    await page
      .locator(".filter-tabs")
      .screenshot({ path: `artifacts/shared-motion/filters-${width}.png` });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  }
});
