const { test, expect } = require("@playwright/test");
test("source text and table of contents remain accessible at every width", async ({
  page,
}) => {
  for (const width of [360, 390, 768, 1280, 1440])
    for (const language of ["uz", "uzc", "ru", "en"]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${language}/news_detail/938`);
      expect(await page.locator(".article-body p").count()).toBeGreaterThan(10);
      await expect(page.locator(".article-aside nav")).toBeVisible();
      const missing = await page
        .locator(".article-aside nav a")
        .evaluateAll((links) =>
          links
            .filter((link) => !document.getElementById(link.hash.slice(1)))
            .map((link) => link.hash),
        );
      expect(missing).toEqual([]);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
    }
});
