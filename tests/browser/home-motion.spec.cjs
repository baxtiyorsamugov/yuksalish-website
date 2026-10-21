const { test, expect } = require("@playwright/test");
const fs = require("node:fs");

test("home motion follows the system preference without manual pause buttons", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/ru");
  const canvas = page.locator(".ambient-waves");
  const pixels = () => canvas.evaluate((el) => el.toDataURL());
  const initial = await pixels();
  await expect.poll(pixels).not.toBe(initial);
  const controls = page.locator(".motion-toggle");
  await expect(controls).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const paused = await pixels();
  await page.waitForTimeout(250);
  expect(await pixels()).toBe(paused);
  const hero = page.locator(".hero");
  const bounds = await hero.boundingBox();
  await page.mouse.move(bounds.x + bounds.width * 0.8, bounds.y + 200);
  expect(await hero.evaluate((el) => el.style.getPropertyValue("--mx"))).toBe(
    "",
  );
  await expect(page.locator("#hero-title")).toBeVisible();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect.poll(pixels).not.toBe(paused);
});

test("partner logos loop in one row with a seamless repeat and accessible keyboard links", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/en");
  const strip = page.locator(".partner-strip");
  await strip.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  const track = strip.locator(".partner-track");
  await expect(strip).toHaveClass(/is-in-view/);
  const matrix = () => track.evaluate((el) => getComputedStyle(el).transform);
  const initial = await matrix();
  await expect.poll(matrix).not.toBe(initial);
  const originals = strip.locator(".partner-group").first();
  const partners = require("../../app/src/data/content.json").partners;
  await expect(originals.locator("a")).toHaveCount(partners.length);
  await expect.poll(() => originals.locator("img").evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
  expect(
    await originals.evaluate(
      (el) =>
        new Set(
          [...el.children].map((link) =>
            Math.round(link.getBoundingClientRect().y),
          ),
        ).size,
    ),
  ).toBe(1);
  const width = await originals.evaluate(
    (el) => el.getBoundingClientRect().width,
  );
  expect(
    await track.evaluate((el) =>
      parseFloat(el.style.getPropertyValue("--partner-distance")),
    ),
  ).toBe(width);
  const duration = parseFloat(await track.evaluate(el => el.style.getPropertyValue("--partner-duration")));
  expect(width / duration).toBeCloseTo(32, 1);
  for (const clone of await strip.locator(".partner-clone").all()) {
    await expect(clone).toHaveAttribute("aria-hidden", "true");
    for (const link of await clone.locator("a").all())
      await expect(link).toHaveAttribute("tabindex", "-1");
  }
  const rate = () => track.evaluate(el => el.getAnimations().find(animation => animation.animationName === "partner-flow")?.playbackRate);
  await expect.poll(rate).toBeLessThan(1.06);
  await page.mouse.wheel(0, 180);
  await expect.poll(rate).toBeGreaterThan(1.15);
  await expect.poll(rate, { timeout: 6000 }).toBeLessThan(1.06);
  await strip.locator(".partner-window").hover();
  await page.waitForTimeout(100);
  expect(await rate()).toBeGreaterThan(0.9);
  await page.waitForTimeout(220);
  expect(await rate()).toBeGreaterThan(0);
  expect(await rate()).toBeLessThan(0.95);
  await expect.poll(rate).toBe(0);
  await page.mouse.move(0, 0);
  await expect.poll(rate).toBeGreaterThan(0.99);
  await originals.locator("a").nth(4).focus();
  await expect(track).toHaveCSS("animation-name", "none");
  const focused = await originals.locator("a").nth(4).boundingBox();
  expect(focused.x).toBeGreaterThanOrEqual(0);
  expect(focused.x + focused.width).toBeLessThanOrEqual(1440);
});

test("reduced motion is static and responds to a changed device preference", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/uzc");
  const canvas = page.locator(".ambient-waves");
  const pixels = () => canvas.evaluate((el) => el.toDataURL());
  const initial = await pixels();
  await page.waitForTimeout(200);
  expect(await pixels()).toBe(initial);
  await expect(page.locator(".motion-toggle")).toHaveCount(0);
  await expect(page.locator(".partner-track")).toHaveCSS(
    "animation-name",
    "none",
  );
  await expect(page.locator(".partner-clone").first()).toBeHidden();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator(".motion-toggle")).toHaveCount(0);
  await expect.poll(pixels).not.toBe(initial);
});

test("canvas failure leaves home navigation and partner links working", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ru");
  await expect(page.locator("#hero-title")).toBeVisible();
  await page.getByRole("button", { name: "Меню", exact: true }).click();
  await expect(page.locator(".main-nav")).toBeVisible();
  await page.getByRole("button", { name: "Меню", exact: true }).click();
  await expect(page.locator(".partner-strip")).toHaveClass(/is-enhanced/);
  await page
    .locator(".footer-links")
    .getByRole("link", { name: "Проекты", exact: true })
    .click();
  await expect(page.locator("h1")).toHaveText("Проекты");
  expect(errors).toEqual([]);
});

test("capture home, partner ribbon and footer at key sizes", async ({
  page,
}) => {
  fs.mkdirSync("artifacts/home-motion", { recursive: true });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto("/ru");
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `artifacts/home-motion/hero-${width}.png` });
    await page
      .locator(".partners-section")
      .screenshot({ path: `artifacts/home-motion/partners-${width}.png` });
    await page
      .locator(".site-footer")
      .screenshot({ path: `artifacts/home-motion/footer-${width}.png` });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  }
});
