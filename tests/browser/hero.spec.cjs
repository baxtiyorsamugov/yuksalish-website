const { test, expect } = require("@playwright/test");
const fs = require("node:fs");

test("Y stays responsive and retains parallax at smaller desktop widths", async ({
  page,
}) => {
  for (const width of [360, 390, 768, 1024, 1192, 1280, 1440, 1544])
    for (const language of ["uz", "uzc", "ru", "en"]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${language}`);
      await expect(page.locator(".y-face")).toBeVisible();
      const artwork = await page.locator(".y-face").boundingBox();
      const heroBounds = await page.locator(".hero").boundingBox();
      const clipMargin = await page.locator(".hero").evaluate(
        (el) => parseFloat(getComputedStyle(el).overflowClipMargin) || 0,
      );
      expect(
        artwork.x + artwork.width,
        `${width}px ${language}: right branch of Y`,
      ).toBeLessThanOrEqual(
        Math.min(width, heroBounds.x + heroBounds.width + clipMargin) - 4,
      );
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
    }
  for (const width of [1192, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/uz");
    const hero = page.locator(".hero");
    const sculpture = page.locator(".hero-sculpture");
    const rect = await hero.boundingBox();
    const initial = await sculpture.evaluate(
      (el) => getComputedStyle(el).transform,
    );
    await page.mouse.move(
      rect.x + rect.width * 0.8,
      rect.y + rect.height * 0.6,
    );
    await expect
      .poll(() => sculpture.evaluate((el) => getComputedStyle(el).transform))
      .not.toBe(initial);
    const movedArtwork = await page.locator(".y-face").boundingBox();
    expect(movedArtwork.x + movedArtwork.width).toBeLessThanOrEqual(width - 4);
    await page.mouse.move(0, 0);
    await expect
      .poll(() => hero.evaluate((el) => el.style.getPropertyValue("--mx")))
      .toBe("");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.mouse.move(
      rect.x + rect.width * 0.8,
      rect.y + rect.height * 0.6,
    );
    expect(await hero.evaluate((el) => el.style.getPropertyValue("--mx"))).toBe(
      "",
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
  }
});

test("capture local Y preview", async ({ page }) => {
  fs.mkdirSync("artifacts/y-preview", { recursive: true });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/uz");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "artifacts/y-preview/desktop.png" });
  await page
    .locator(".hero-sculpture")
    .screenshot({ path: "artifacts/y-preview/y-detail.png" });
  await page.setViewportSize({ width: 1544, height: 900 });
  await page.goto("/ru");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "artifacts/y-preview/desktop-ru.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "artifacts/y-preview/mobile.png" });
});
