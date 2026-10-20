const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const fs = require("node:fs");
const path = require("node:path");
const routes = [
  "",
  "about",
  "mission",
  "structure",
  "activity",
  "projects",
  "news",
  "news_detail/938",
  "news_detail/937",
  "project_detail/47",
  "region/tashkent",
  "regions",
  "team",
  "experts",
  "experts_detail/35",
  "events",
  "events_detail/4",
  "library",
  "reports",
  "newsletter",
  "contacts",
  "join",
  "partners",
  "councils",
  "missing-page",
];
const languages = ["uz", "uzc", "ru", "en"];

for (const width of [360, 390, 768, 1280, 1440]) {
  test(`all templates fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const language of languages)
      for (const route of routes) {
        const response = await page.goto(`/${language}/${route}`);
        expect(response.status(), route).toBe(
          route === "missing-page" ? 404 : 200,
        );
        await page.evaluate(() => document.fonts.ready);
        expect(await page.locator("h1").count(), route).toBe(1);
        const geometry = await page.evaluate(() => ({
          width: innerWidth,
          scroll: document.documentElement.scrollWidth,
        }));
        expect(geometry.scroll, route).toBeLessThanOrEqual(geometry.width);
        const clipped = await page
          .locator("h1,h2,h3")
          .evaluateAll((elements) =>
            elements
              .filter((el) => el.scrollWidth > el.clientWidth + 2)
              .map((el) => el.textContent),
          );
        expect(clipped, route).toEqual([]);
      }
  });
}

for (const language of languages) {
  test(`localized navigation and page identity: ${language}`, async ({
    page,
  }) => {
    await page.goto(`/${language}/news_detail/937`);
    const langTag = { uz: "uz-Latn", uzc: "uz-Cyrl", ru: "ru", en: "en" }[
      language
    ];
    await expect(page.locator("html")).toHaveAttribute("lang", langTag);
    const links = await page
      .locator(".language-options a")
      .evaluateAll((elements) => elements.map((el) => el.getAttribute("href")));
    expect(links).toEqual(languages.map((code) => `/${code}/news_detail/937`));
    for (const code of languages) {
      const response = await page.request.get(`/${code}/projects`);
      expect(response.status()).toBe(200);
    }
  });
}

test("filters, search, pagination and empty state", async ({ page }) => {
  await page.goto("/en/news");
  await page
    .getByRole("navigation", { name: "Pages", exact: true })
    .getByRole("link", { name: "2", exact: true })
    .click();
  await expect(page).toHaveURL(/p=2/);
  await expect(page.locator(".catalog-grid article")).toHaveCount(2);
  await page.goto("/en/projects?category=environment");
  await expect(page.locator(".catalog-grid article")).toHaveCount(1);
  await page.goto("/en/news?q=zzzz-no-result");
  await expect(page.locator(".empty-state")).toBeVisible();
  await page.getByRole("link", { name: "Clear filters" }).click();
  await expect(page.locator(".catalog-grid article")).toHaveCount(4);
  await page.getByRole("searchbox").fill("Halollik");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  // Search operates on the selected translation, so this Uzbek word has no English matches.
  await expect(page.locator(".empty-state")).toBeVisible();
});

test("mobile menu and keyboard escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en");
  const toggle = page.getByRole("button", { name: "Menu", exact: true });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await page.locator(".nav-group").first().locator("summary").click();
  await expect(
    page.getByRole("link", { name: "Our mission", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".nav-group").first()).not.toHaveAttribute("open");
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
});

test("keyboard navigation and source-language notice", async ({ page }) => {
  await page.goto("/en");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
  await page.goto("/en/news_detail/936");
  await expect(page.locator(".notice")).toContainText("source language");
  await expect(page.locator(".article-body")).toHaveAttribute(
    "lang",
    "uz-Latn",
  );
});

test("reduced motion and broken-image fallback", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en");
  expect(
    await page
      .locator(".orbit-one")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  expect(
    await page
      .locator("html")
      .evaluate((el) => getComputedStyle(el).scrollBehavior),
  ).toBe("auto");
  await page.route("**/assets/images/news-938.webp", (route) => route.abort());
  await page.goto("/en/news_detail/938");
  await expect(page.locator(".article-cover .image-fallback")).toBeVisible();
});

test("public pages work without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL: process.env.BASE_URL || "http://127.0.0.1:8090",
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto("/en/projects?category=environment");
  await expect(page.locator(".catalog-grid article")).toHaveCount(1);
  await expect(page.locator(".main-nav")).toBeVisible();
  await context.close();
});

test("WCAG A/AA checks for all template families", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of routes) {
    await page.goto(`/en/${route}`);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      route,
    ).toEqual([]);
  }
});

test("local assets and screenshot evidence", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const external = [];
  page.on("request", (request) => {
    if (
      new URL(request.url()).origin !==
      new URL(process.env.BASE_URL || "http://127.0.0.1:8090").origin
    )
      external.push(request.url());
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const output = path.resolve("artifacts/screenshots");
  fs.mkdirSync(output, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/uz");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(output, "home-desktop.png") });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 100));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
    await Promise.all(
      [...document.images].map((img) => img.decode().catch(() => {})),
    );
  });
  await page.screenshot({
    path: path.join(output, "home-full.png"),
    fullPage: true,
    animations: "disabled",
  });
  await page.goto("/ru/projects");
  await page.screenshot({
    path: path.join(output, "projects-desktop.png"),
    fullPage: true,
    animations: "disabled",
  });
  await page.goto("/uz/news_detail/937");
  await page.screenshot({
    path: path.join(output, "article-desktop.png"),
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/uz");
  await page.screenshot({
    path: path.join(output, "home-mobile.png"),
    animations: "disabled",
  });
  await page.screenshot({
    path: path.join(output, "home-mobile-full.png"),
    fullPage: true,
    animations: "disabled",
  });
  await page.goto("/en/join");
  await page.screenshot({
    path: path.join(output, "join-mobile.png"),
    fullPage: true,
    animations: "disabled",
  });
  const matrix = path.join(output, "templates");
  fs.mkdirSync(matrix, { recursive: true });
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(`/ru/${route}`);
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: path.join(
          matrix,
          `${width}-${(route || "home").replaceAll("/", "-")}.png`,
        ),
        animations: "disabled",
      });
    }
  }
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});
