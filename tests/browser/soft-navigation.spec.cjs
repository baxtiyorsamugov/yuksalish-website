const { test, expect } = require("@playwright/test");

const markShell = page => page.evaluate(() => {
  window.shellProof = {
    canvas: document.querySelector(".ambient-waves"),
    header: document.querySelector(".header-inner"),
    logo: document.querySelector(".brand"),
    initial: performance.timeOrigin,
  };
});
const sameShell = async page => expect(await page.evaluate(() => ({
  document: window.shellProof?.initial === performance.timeOrigin,
  canvas: window.shellProof?.canvas === document.querySelector(".ambient-waves"),
  header: window.shellProof?.header === document.querySelector(".header-inner"),
  logo: window.shellProof?.logo === document.querySelector(".brand"),
}))).toEqual({ document: true, canvas: true, header: true, logo: true });

test("sections, contacts and repeated home visits preserve the document and animated shell", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const documents = [];
  const errors = [];
  page.on("request", request => { if (request.isNavigationRequest()) documents.push(request.url()); });
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/ru");
  await markShell(page);
  for (let cycle = 0; cycle < 3; cycle++) {
    await page.locator('[aria-controls="nav-activity"]').click();
    await page.locator('#nav-activity a[href="/ru/activity"]').click();
    await expect(page).toHaveURL(/\/ru\/activity$/);
    await expect(page.locator("h1")).toHaveText("Деятельность");
    await sameShell(page);
    await page.locator(".header-contact").click();
    await expect(page).toHaveURL(/\/ru\/contacts$/);
    await expect(page.locator("main")).toBeFocused();
    await sameShell(page);
    await page.locator(".brand").click();
    await expect(page).toHaveURL(/\/ru$/);
    await expect(page.locator(".hero")).toBeVisible();
    await expect(page.locator(".partner-clone")).toHaveCount(1);
    await sameShell(page);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("body")).toHaveClass(/motion-paused/);
  await page.locator(".header-contact").click();
  await expect(page).toHaveURL(/\/ru\/contacts$/);
  await expect(page.locator("body")).toHaveClass(/motion-paused/);
  await expect(page.locator(".motion-toggle")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("body")).not.toHaveClass(/motion-paused/);
  expect(documents).toHaveLength(1);
  expect(errors).toEqual([]);
});

test("soft search, article language changes and reading controls initialize on the new content", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ru/projects");
  await markShell(page);
  await page.locator('input[name="q"]').fill("неттакогопроекта");
  await page.locator('input[name="q"]').press("Enter");
  await expect(page).toHaveURL(/q=/);
  await expect(page.locator(".empty-state")).toBeVisible();
  await sameShell(page);
  await page.locator(".brand").click();
  await expect(page).toHaveURL(/\/ru$/);
  const article = page.locator('main a[href="/ru/news_detail/938"]').first();
  await article.click();
  await expect(page).toHaveURL(/\/ru\/news_detail\/938$/);
  await page.locator(".language-switch summary").click();
  await page.locator('.language-options a[hreflang="en"]').click();
  await expect(page).toHaveURL(/\/en\/news_detail\/938$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  expect(await page.evaluate(() => window.shellProof.initial === performance.timeOrigin && window.shellProof.canvas === document.querySelector("canvas"))).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator(".article-contents summary").click();
  await page.evaluate(() => scrollTo({ top: 300, behavior: "instant" }));
  await page.waitForTimeout(30);
  await page.locator('.article-contents a[href^="#"]').last().evaluate(link => link.click());
  await expect(page).toHaveURL(/#article-source$/);
  await expect(page.locator(".article-contents")).not.toHaveAttribute("open");
  await page.goBack();
  await expect(page).toHaveURL(/\/en\/news_detail\/938$/);
  await expect.poll(async () => Math.abs(await page.evaluate(() => scrollY) - 300)).toBeLessThanOrEqual(2);
});

test("back and forward restore reading positions without another document load", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/ru/about");
  await markShell(page);
  await page.evaluate(() => scrollTo({ top: 280, behavior: "instant" }));
  await page.waitForTimeout(50);
  const start = await page.evaluate(() => scrollY);
  await page.locator(".header-contact").evaluate(link => link.click());
  await expect(page).toHaveURL(/\/ru\/contacts$/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.goBack();
  await expect(page).toHaveURL(/\/ru\/about$/);
  await expect.poll(async () => Math.abs(await page.evaluate(() => scrollY) - start)).toBeLessThanOrEqual(2);
  await sameShell(page);
  await page.goForward();
  await expect(page).toHaveURL(/\/ru\/contacts$/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await sameShell(page);
  await page.goBack();
  await expect(page).toHaveURL(/\/ru\/about$/);
  await expect.poll(async () => Math.abs(await page.evaluate(() => scrollY) - start)).toBeLessThanOrEqual(2);
  await page.reload();
  await expect.poll(async () => Math.abs(await page.evaluate(() => scrollY) - start)).toBeLessThanOrEqual(2);
});

test("a later navigation wins over an unfinished request", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/ru");
  await markShell(page);
  await page.route("**/ru/contacts", async route => {
    if (route.request().resourceType() !== "fetch") return route.continue();
    await new Promise(resolve => setTimeout(resolve, 500));
    await route.continue().catch(() => {});
  });
  await page.locator(".header-contact").click();
  await page.locator('[aria-controls="nav-projects"]').click();
  await page.locator('#nav-projects a[href="/ru/projects"]').click();
  await expect(page).toHaveURL(/\/ru\/projects$/);
  await page.waitForTimeout(650);
  await expect(page).toHaveURL(/\/ru\/projects$/);
  await sameShell(page);
});

test("a failed partial request falls back to a normal working page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/ru");
  await page.route("**/ru/contacts", route => route.request().resourceType() === "fetch" ? route.abort() : route.continue());
  await page.locator(".header-contact").click();
  await expect(page).toHaveURL(/\/ru\/contacts$/);
  await expect(page.locator("h1")).toHaveText("Контакты");
  await expect(page.locator("main[aria-busy]")).toHaveCount(0);
});
