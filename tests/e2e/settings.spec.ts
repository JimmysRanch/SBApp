import { test, expect } from "@playwright/test";
test.describe("Settings UI end-to-end", () => {
  test("loads, edits, saves, persists, and self-tests", async ({ page }) => {
    await page.context().addCookies([
      { name: "e2e-bypass", value: "true", url: "http://localhost:3000" }
    ]);
    await page.goto("/settings");
    await expect(page.getByText("Business name")).toBeVisible();
    const nameInput = page.getByRole("textbox", { name: "Business name" });
    await nameInput.fill("Super Duper Grooming");
    await page.getByRole("button", { name: "Save" }).click();
    await page.reload();
    await expect(page.getByRole("textbox", { name: "Business name" })).toHaveValue("Super Duper Grooming");
    await page.getByRole("button", { name: "Scheduling" }).click();
    await page.getByRole("combobox", { name: "Slot minutes" }).selectOption("10");
    await page.getByRole("button", { name: "Save" }).click();
    await page.reload();
    await page.getByRole("button", { name: "Scheduling" }).click();
    await expect(page.getByRole("combobox", { name: "Slot minutes" })).toHaveValue("10");
    const [st] = await Promise.all([page.waitForEvent("popup"), page.getByRole("button", { name: "Run Self-Test" }).click()]);
    await st.waitForSelector("h1");
    await st.waitForSelector("text=Self-test complete", { timeout: 30000 });
  });
});
