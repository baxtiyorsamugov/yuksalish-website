const { test, expect } = require("@playwright/test");
const fs = require("node:fs");

test("reading progress eases toward scroll position and respects resize and reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/ru/news_detail/938");
  const progress = page.locator(".header-progress");
  const fraction = () => progress.evaluate(el => el.getBoundingClientRect().width / (el.parentElement.clientWidth - parseFloat(getComputedStyle(el).insetInlineStart) * 2));
  const expected = () => page.evaluate(() => Math.max(0, Math.min(1, scrollY / (document.documentElement.scrollHeight - innerHeight))));
  await expect.poll(fraction).toBeLessThan(0.01);
  const samples = await page.evaluate(async () => {
    const indicator = document.querySelector(".header-progress");
    const width = indicator.parentElement.clientWidth - parseFloat(getComputedStyle(indicator).insetInlineStart) * 2;
    scrollTo({ top: (document.documentElement.scrollHeight - innerHeight) * 0.55, behavior: "instant" });
    const values = [];
    for (let frame = 0; frame < 20; frame++) {
      await new Promise(requestAnimationFrame);
      values.push(indicator.getBoundingClientRect().width / width);
    }
    return values;
  });
  expect(samples.some(value => value > 0 && value < 0.54)).toBe(true);
  await expect.poll(async () => Math.abs(await fraction() - await expected())).toBeLessThan(0.025);
  expect(await fraction()).toBeGreaterThan(0.45);
  await expect(progress).toHaveCSS("transform", "none");
  const geometry = await progress.evaluate(el => {
    const rect = el.getBoundingClientRect(), parent = el.parentElement.getBoundingClientRect(), style = getComputedStyle(el.parentElement);
    return { height: rect.height, stroke: parseFloat(style.borderBottomWidth), bottomDifference: rect.bottom - parent.bottom, leftDifference: rect.left - parent.left - parseFloat(style.borderBottomLeftRadius) };
  });
  expect(geometry.height).toBe(geometry.stroke);
  expect(Math.abs(geometry.bottomDifference)).toBeLessThan(0.1);
  expect(Math.abs(geometry.leftDifference)).toBeLessThan(0.1);
  const fade = await progress.evaluate(el => getComputedStyle(el).getPropertyValue("--progress-fade"));
  await page.setViewportSize({ width: 1280, height: 640 });
  await expect.poll(async () => Math.abs(await fraction() - await expected())).toBeLessThan(0.025);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => {
    scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
  });
  await expect.poll(fraction).toBeGreaterThan(0.99);
  expect(await progress.evaluate(el => getComputedStyle(el).getPropertyValue("--progress-fade"))).toBe(fade);
  await expect(page.locator(".back-to-top")).toBeVisible();
  await page.locator(".back-to-top").click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect.poll(fraction).toBeLessThan(0.01);
  await page.locator('.footer-links a[href="/ru/contacts"]').evaluate(link => link.click());
  await expect(page).toHaveURL(/\/ru\/contacts$/);
  await page.evaluate(() => scrollTo({ top: 200, behavior: "instant" }));
  await expect.poll(async () => Math.abs(await fraction() - await expected())).toBeLessThan(0.025);
  await page.locator("main").evaluate(main => { main.style.minHeight = "5000px"; });
  await expect.poll(async () => Math.abs(await fraction() - await expected())).toBeLessThan(0.025);
});

test("card light tracks the pointer and clears on reduced motion or touch layout", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto("/ru/projects");
  const card = page.locator(".content-card").first();
  await card.locator("h3").scrollIntoViewIfNeeded();
  const rect = await card.boundingBox();
  await page.mouse.move(rect.x + rect.width * 0.3, rect.y + rect.height * 0.7);
  await expect(card).toHaveClass(/is-pointed/);
  const first = await card.evaluate(el => el.style.getPropertyValue("--spot-x"));
  await page.mouse.move(rect.x + rect.width * 0.7, rect.y + rect.height * 0.7);
  await expect.poll(() => card.evaluate(el => el.style.getPropertyValue("--spot-x"))).not.toBe(first);
  await expect.poll(() => card.evaluate(el => getComputedStyle(el, "::before").opacity)).toBe("1");
  fs.mkdirSync("artifacts/powder-ui", { recursive: true });
  await page.screenshot({ path: "artifacts/powder-ui/card-light.png" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(card).not.toHaveClass(/is-pointed/);
  await expect.poll(() => card.evaluate(el => el.style.getPropertyValue("--spot-x"))).toBe("");
  await expect(page.locator(".ambient-ribbons")).toHaveCount(0);
  await card.locator("h3 a").focus();
  await expect(card).toHaveCSS("opacity", "1");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 390, height: 844 });
  await card.hover();
  await expect(card).not.toHaveClass(/is-pointed/);
});

test("icon animation respects the system motion preference without diagonal background layers", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/ru");
  const action = page.locator(".hero-actions .button");
  const icon = action.locator(":scope > .icon");
  const responding = () => icon.evaluate(el => el.getAnimations().filter(animation => animation.id === "icon-response").length);
  await action.hover();
  await expect.poll(responding).toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("body")).toHaveClass(/motion-paused/);
  await expect.poll(responding).toBe(0);
  await expect(page.locator(".ambient-ribbons")).toHaveCount(0);
  await action.hover();
  expect(await responding()).toBe(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("body")).not.toHaveClass(/motion-paused/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await action.focus();
  expect(await responding()).toBe(0);
  await action.click();
  await expect(page).toHaveURL(/\/ru\/projects$/);
  await expect(page.locator(".header-inner")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(page.locator(".header-inner")).toHaveCSS("backdrop-filter", "none");
});
