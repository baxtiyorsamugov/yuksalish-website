const { test, expect } = require("@playwright/test");
const fs = require("node:fs");

// Playwright's automatic scrollIntoView can move a sticky header to its layout
// position. A real pointer click preserves the user's current reading position.
const clickInPlace = async (page, locator) => {
  await expect(locator).toBeVisible();
  const bounds = await locator.boundingBox();
  await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
};

test("section navigation uses fade and slide in the same document while the header stays in place", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/ru/about");
    await page.evaluate(() => { window.softDocument = document; });
    await page.evaluate(() => scrollTo({ top: 200, behavior: "instant" }));
    const restoredPosition = await page.evaluate(() => scrollY);
    expect(restoredPosition).toBeGreaterThan(0);
    const before = await page.locator(".header-inner").boundingBox();
    if (width === 390) await clickInPlace(page, page.locator(".menu-toggle"));
    await clickInPlace(page, page.locator('.nav-toggle[aria-controls="nav-projects"]'));
    await clickInPlace(page, page.locator('#nav-projects a[href="/ru/projects"]'));
    await expect(page).toHaveURL(/\/ru\/projects$/);
    expect(await page.evaluate(() => window.softDocument === document)).toBe(true);
    await expect(page.locator("html")).toHaveAttribute("data-page-transition", "soft");
    expect(await page.locator("main").evaluate(main => main.getAnimations().some(animation => animation.id === "page-arrive"))).toBe(true);
    const after = await page.locator(".header-inner").boundingBox();
    expect(Math.abs(after.y - before.y)).toBeLessThan(1);
    expect(Math.abs(after.width - before.width)).toBeLessThan(1);
    await expect(page.locator(".main-nav")).not.toHaveClass(/is-open/);
    await page.goBack();
    await expect(page).toHaveURL(/\/ru\/about$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("О движении");
    await expect.poll(async () => Math.abs(await page.evaluate(() => scrollY) - restoredPosition)).toBeLessThanOrEqual(2);
  }
  expect(errors).toEqual([]);
});

test("one corner control returns to absolute page top on all long page types", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["", "projects", "project_detail/47", "news_detail/937", "news_detail/938"]) {
    await page.goto(`/ru/${route}`);
    const top = page.locator(".back-to-top");
    await expect(top).toHaveCount(1);
    await expect(top).not.toBeVisible();
    await expect(page.locator('.footer-top, a[href="#article-top"]')).toHaveCount(0);
    await page.evaluate(() => scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
    await expect(top).toBeVisible();
    const bounds = await top.boundingBox();
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(390 - 16);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(844 - 16);
    await top.focus();
    await page.keyboard.press("Enter");
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    await expect(page.locator(".brand")).toBeFocused();
    await expect(top).not.toBeVisible();
    await expect(top).toHaveAttribute("inert", "");
  }
});

test("wheel inertia is smooth and native reading anchors interrupt it without drift", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/ru/news_detail/938");
  await expect(page.locator("html")).toHaveClass(/lenis/);
  await page.mouse.move(700, 500);
  await page.mouse.wheel(0, 600);
  const positions = await page.evaluate(async () => {
    const values = [];
    for (let frame = 0; frame < 20; frame++) {
      await new Promise(requestAnimationFrame);
      values.push(scrollY);
    }
    return values;
  });
  expect(positions.some((value) => value > 0 && value < 590)).toBe(true);
  expect(positions.every((value, index) => !index || value >= positions[index - 1])).toBe(true);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(595);
  await page.locator(".back-to-top").click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.mouse.wheel(0, 120);
  await page.getByRole("link", { name: "Читать материал", exact: true }).click();
  await expect(page.locator("#article-text")).toBeFocused();
  await expect(page).toHaveURL(/#article-text$/);
  await page.waitForTimeout(900);
  const atAnchor = await page.evaluate(() => scrollY);
  await page.waitForTimeout(250);
  expect(Math.abs(await page.evaluate(() => scrollY) - atAnchor)).toBeLessThan(2);
  await page.goBack();
  await expect(page).not.toHaveURL(/#article-text$/);
});

test("reduced motion keeps scrolling available without smoothing", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/ru/projects");
  await expect(page.locator("html")).toHaveClass(/lenis/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("html")).not.toHaveClass(/lenis/);
  await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
  await page.locator('.nav-toggle[aria-controls="nav-media"]').click();
  await page.locator('#nav-media a[href="/ru/news"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-page-transition", "reduced");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("html")).toHaveClass(/lenis/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("html")).not.toHaveClass(/lenis/);
  await expect(page.locator("html")).toHaveClass(/motion-is-paused/);
  await page.evaluate(() => scrollTo({ top: 800, behavior: "instant" }));
  const pausedAt = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, -600);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(pausedAt - 300);
  expect(errors).toEqual([]);
});

test("fallback navigation and scrolling work without Lenis or native transitions", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/assets/vendor/lenis.min.js*", (route) => route.abort());
  await page.route("**/assets/navigation.css*", async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace("navigation: auto", "navigation: none") });
  });
  await page.goto("/ru/projects");
  await expect(page.locator("html")).not.toHaveClass(/lenis/);
  await page.evaluate(() => scrollTo({ top: 150, behavior: "instant" }));
  const restoredPosition = await page.evaluate(() => scrollY);
  await clickInPlace(page, page.locator('.nav-toggle[aria-controls="nav-media"]'));
  await clickInPlace(page, page.locator('#nav-media a[href="/ru/news"]'));
  await expect(page.locator("html")).toHaveAttribute("data-page-transition", "soft");
  expect(await page.locator("main").evaluate(main => main.getAnimations().some(animation => animation.id === "page-arrive"))).toBe(true);
  await page.evaluate(() => scrollTo({ top: 900, behavior: "instant" }));
  await page.locator(".back-to-top").click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.goBack();
  await expect.poll(async () => Math.abs(await page.evaluate(() => scrollY) - restoredPosition)).toBeLessThanOrEqual(2);
  await expect(page.locator("html")).toHaveAttribute("data-page-transition", "restored");
  await expect(page.locator("html")).not.toHaveClass(/page-enter/);
  expect(errors).toEqual([]);
});

test("capture the single floating control on desktop and mobile", async ({ page }) => {
  fs.mkdirSync("artifacts/navigation-motion", { recursive: true });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.goto("/ru/project_detail/47");
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => scrollTo({ top: 850, behavior: "instant" }));
    await expect(page.locator(".back-to-top")).toBeVisible();
    await page.screenshot({ path: `artifacts/navigation-motion/project-${width}.png` });
    await page.evaluate(() => scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
    await page.screenshot({ path: `artifacts/navigation-motion/footer-${width}.png` });
  }
});
