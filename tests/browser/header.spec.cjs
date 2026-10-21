const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const clickInPlace = async (page, locator) => {
  const box = await locator.boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
};

test("header panels support whole-button disclosure, directional keys and focus return", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/ru/project_detail/47");
  const about = page.locator('.nav-toggle[aria-controls="nav-about"]');
  const toggle = page.getByRole("button", { name: "Меню раздела: О движении", exact: true });
  await about.focus();
  await about.press("ArrowDown");
  const panel = page.locator("#nav-about");
  await expect(panel).toBeVisible();
  await expect(panel.locator(".nav-menu-intro")).toBeVisible();
  await expect(panel.locator("a").first()).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(panel.getByRole("link", { name: "Миссия и задачи", exact: true })).toBeFocused();
  await page.keyboard.press("End");
  await expect(panel.getByRole("link", { name: "Отчётность", exact: true })).toBeFocused();
  const box = await panel.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(1280);
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(toggle).toBeFocused();
  await toggle.press("Enter");
  await page.evaluate(() => {
    window.headerOverlap = false;
    new MutationObserver(() => {
      if (document.querySelector(".language-switch").open && document.querySelector('.nav-toggle[aria-expanded="true"]'))
        window.headerOverlap = true;
    }).observe(document.querySelector(".site-header"), { subtree: true, attributes: true, attributeFilter: ["open", "hidden", "aria-expanded"] });
  });
  await page.locator(".language-switch summary").click();
  await expect(panel).toBeHidden();
  await expect(page.locator(".language-options")).toBeVisible();
  expect(await page.evaluate(() => window.headerOverlap)).toBe(false);
  await page.keyboard.press("Escape");
  await toggle.press("ArrowRight");
  await expect(page.locator('.nav-toggle[aria-controls="nav-activity"]')).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/ru\/project_detail\/47$/);
  await expect(page.locator("#nav-activity")).toBeVisible();
  await page.locator('#nav-activity a[href="/ru/activity"]').click();
  await expect(page).toHaveURL(/\/ru\/activity$/);
});

test("mobile menu preserves page position, blocks the background and releases it", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ru/projects");
  await page.locator("main").evaluate(el => Promise.all(el.getAnimations().map(animation => animation.finished.catch(() => {}))));
  await page.evaluate(() => scrollTo({ top: 240, behavior: "instant" }));
  const position = await page.evaluate(() => scrollY);
  await clickInPlace(page, page.locator(".menu-toggle"));
  await expect(page.locator("html")).toHaveClass(/navigation-open/);
  await expect(page.locator("html")).not.toHaveClass(/lenis/);
  expect(await page.locator("main").evaluate(el => el.inert)).toBe(true);
  await expect(page.locator(".nav-mobile-title")).toBeInViewport();
  expect(Math.abs(await page.evaluate(() => scrollY) - position)).toBeLessThanOrEqual(2);
  const toggle = page.getByRole("button", { name: "Меню раздела: О движении", exact: true });
  await clickInPlace(page, toggle);
  await expect(page.locator("#nav-about")).toBeVisible();
  await expect(page.locator(".mobile-join")).toBeInViewport({ ratio: 1 });
  await page.mouse.move(3, 500);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(100);
  expect(Math.abs(await page.evaluate(() => scrollY) - position)).toBeLessThanOrEqual(2);
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator(".menu-toggle")).toBeFocused();
  await expect(page.locator("html")).not.toHaveClass(/navigation-open/);
  expect(await page.locator("main").evaluate(el => el.inert)).toBe(false);
  expect(Math.abs(await page.evaluate(() => scrollY) - position)).toBeLessThanOrEqual(2);
  await clickInPlace(page, page.locator(".menu-toggle"));
  await clickInPlace(page, page.locator(".language-switch summary"));
  await expect(page.locator(".main-nav")).not.toHaveClass(/is-open/);
  await expect(page.locator(".language-options")).toBeVisible();
  expect(await page.locator("main").evaluate(el => el.inert)).toBe(false);
  await page.mouse.click(3, 500);
  await expect(page.locator(".language-options")).toBeHidden();
});

test("language keyboard navigation retains the current material", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/uz/project_detail/47");
  const language = page.locator(".language-switch summary");
  await language.focus();
  await language.press("ArrowDown");
  await expect(page.locator(".language-options a").first()).toBeFocused();
  await page.keyboard.press("End");
  await expect(page.locator('.language-options a[hreflang="en"]')).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/en\/project_detail\/47$/);
  await language.press("ArrowUp");
  await expect(page.locator('.language-options a[aria-current="true"]')).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(language).toBeFocused();
});

test("header fits all languages and captures desktop and mobile navigation", async ({ page }) => {
  fs.mkdirSync("artifacts/header", { recursive: true });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [360, 390, 768, 1192, 1200, 1280, 1440]) {
    for (const lang of ["uz", "uzc", "ru", "en"]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${lang}/projects`);
      await expect(page.locator(".language-switch summary > span")).toHaveText(lang === "uzc" ? "ЎЗ" : lang.toUpperCase());
      await expect(page.locator('.language-options a[lang="uz-Cyrl"] .language-code')).toHaveText("ЎЗ");
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      if (width < 1200) await page.locator(".menu-toggle").click();
      await expect(page.locator(".nav-toggle").last()).toBeVisible();
      const triggerGeometry = await page.locator(".nav-toggle").evaluateAll(buttons => buttons.every(button => {
        const bounds = button.getBoundingClientRect();
        return [...button.children].filter(child => !child.classList.contains("nav-highlight")).every(child => {
          const rect = child.getBoundingClientRect();
          return rect.left >= bounds.left && rect.right <= bounds.right && rect.top >= bounds.top && rect.bottom <= bounds.bottom;
        });
      }));
      expect(triggerGeometry).toBe(true);
      await page.locator(".nav-toggle").first().click();
      await expect(page.locator("#nav-about a").last()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  }
  for (const width of [390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/ru");
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `artifacts/header/home-${width}.png` });
    if (width < 1200) await page.locator(".menu-toggle").click();
    await page.screenshot({ path: `artifacts/header/navigation-${width}.png` });
    await page.locator(".nav-toggle").first().click();
    await page.screenshot({ path: `artifacts/header/about-${width}.png` });
    await page.locator(".language-switch summary").click();
    await expect(page.locator("#nav-about")).toBeHidden();
    await expect(page.locator(".language-options")).toBeVisible();
    await page.screenshot({ path: `artifacts/header/language-${width}.png` });
  }
});
