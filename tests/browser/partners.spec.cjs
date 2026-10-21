const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const partners = require("../../app/src/data/content.json").partners;

test("partner artwork is local, visible and rendered without a white matte", async ({ page }) => {
  await page.goto("/ru/partners");
  await expect(page.locator(".partner-directory img")).toHaveCount(partners.length);
  const artwork = await page.locator(".partner-directory img").evaluateAll(async images => {
    await Promise.all(images.map(image => image.decode()));
    return images.map(image => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
      return { name: image.alt, cornerAlpha: rgba[3], visible: rgba.some((value, index) => index % 4 === 3 && value > 200) };
    });
  });
  for (const image of artwork) {
    expect(image.visible, image.name).toBe(true);
    // The EU flag's blue field is part of the original mark.
    if (image.name !== "European Union") expect(image.cornerAlpha, image.name).toBeLessThanOrEqual(10);
  }
  expect(new Set(partners.map(partner => partner.name)).size).toBe(partners.length);
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/ru");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator(".partner-strip").scrollIntoViewIfNeeded();
    await page.locator(".partner-group").first().locator("img").first().evaluate(image => image.decode());
    fs.mkdirSync("artifacts/partners", { recursive: true });
    await page.locator(".partners-section").screenshot({ path: `artifacts/partners/ribbon-${width}.png` });
  }
});
