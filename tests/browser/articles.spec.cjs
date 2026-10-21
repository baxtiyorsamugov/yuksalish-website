const { test, expect } = require("@playwright/test");
const content = require("../../app/src/data/content.json");
const fs = require("node:fs");
test("source text and table of contents remain accessible at every width", async ({
  page,
}) => {
  for (const width of [360, 390, 768, 1280, 1440])
    for (const language of ["uz", "uzc", "ru", "en"]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${language}/news_detail/938`);
      expect(await page.locator(".article-body p").count()).toBeGreaterThan(10);
      if (width < 1024) await page.locator(".article-contents summary").click();
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

test("project facts, full source text and long titles work in every locale", async ({
  page,
}) => {
  for (const width of [360, 390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const language of ["uz", "uzc", "ru", "en"]) {
      for (const item of content.projects) {
        await page.goto("/" + language + "/project_detail/" + item.id);
        const translation = item.translations[language] || item.translations.uz;
        expect((await page.locator("h1").innerText()).toLocaleLowerCase()).toBe(
          translation.title.toLocaleLowerCase(),
        );
        await expect(page.locator(".project-facts")).toContainText(
          translation.project_period,
        );
        const normalize = (text) => text.replace(/\s+/gu, " ").trim();
        expect(normalize(await page.locator(".article-body").innerText())).toBe(
          normalize(translation.blocks.map((block) => block.text).join(" ")),
        );
        const geometry = await page.evaluate(() => ({
          width: innerWidth,
          scroll: document.documentElement.scrollWidth,
          clipped: [...document.querySelectorAll("h1,h2,h3")].some(
            (el) => el.scrollWidth > el.clientWidth + 2,
          ),
        }));
        expect(geometry.scroll).toBeLessThanOrEqual(geometry.width);
        expect(geometry.clipped).toBe(false);
      }
    }
  }
});

test("mobile contents, reading anchors and copy feedback support the reading flow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (value) => {
          window.copiedStory = value;
        },
      },
    });
  });
  await page.goto("/en/news_detail/938");
  const contents = page.locator(".article-contents");
  await expect(contents).not.toHaveAttribute("open");
  await page.getByRole("link", { name: "Read the story", exact: true }).click();
  await expect(page.locator("#article-text")).toBeFocused();
  await contents.locator("summary").press("Enter");
  await contents
    .getByRole("link", { name: "Original source", exact: true })
    .click();
  await expect(page.locator("#article-source")).toBeFocused();
  await expect(contents).not.toHaveAttribute("open");
  await page.locator(".article-reading-footer .copy-link").click();
  await expect(page.getByRole("status")).toHaveText("Link copied");
  expect(await page.evaluate(() => window.copiedStory)).toMatch(
    /\/en\/news_detail\/938$/,
  );
  await page.getByRole("button", { name: "Back to top", exact: true }).click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(page.locator(".brand")).toBeFocused();
  await page.locator(".related-section h3 a").first().click();
  await expect(page).not.toHaveURL(/news_detail\/938/);
});

test("capture the updated project and editorial layouts", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  fs.mkdirSync("artifacts/stories", { recursive: true });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const [name, route] of [
      ["project", "project_detail/47"],
      ["project-long", "project_detail/45"],
      ["project-environment", "project_detail/46"],
      ["news", "news_detail/937"],
      ["article", "news_detail/938"],
    ]) {
      await page.goto("/ru/" + route);
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: "artifacts/stories/" + name + "-" + width + ".png",
        fullPage: true,
        animations: "disabled",
      });
      await page.screenshot({
        path: "artifacts/stories/" + name + "-hero-" + width + ".png",
        animations: "disabled",
      });
    }
  }
});
