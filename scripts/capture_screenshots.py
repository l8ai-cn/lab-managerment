#!/usr/bin/env python3
"""Capture UI screenshots for functional delivery report."""

from __future__ import annotations

import asyncio
import os
from pathlib import Path

from playwright.async_api import async_playwright

FRONTEND = os.environ.get("FRONTEND_URL", "http://127.0.0.1:5173")
OUT_DIR = Path(os.environ.get("SCREENSHOT_DIR", "/opt/cursor/artifacts/screenshots"))
OUT_DIR.mkdir(parents=True, exist_ok=True)

PAGES: list[tuple[str, str, bool, int]] = [
    ("01-login-ui.png", "/login", False, 1500),
    ("02-dashboard.png", "/dashboard", True, 2000),
    ("03-labs.png", "/labs", True, 1500),
    ("05-spaces.png", "/spaces", True, 1500),
    ("06-lab-changes.png", "/lab-changes", True, 1500),
    ("07-lab-staff.png", "/lab-staff", True, 1500),
    ("08-instruments.png", "/instruments", True, 1500),
    ("09-instrument-bookings.png", "/instrument-bookings", True, 1500),
    ("10-lab-bookings.png", "/lab-bookings", True, 1500),
    ("11-lab-booking-rules.png", "/lab-bookings/rules", True, 1500),
    ("12-instrument-rules.png", "/instruments/rules", True, 1500),
    ("13-experiment-projects.png", "/experiment-projects", True, 1500),
    ("14-faults.png", "/faults", True, 1500),
    ("15-fault-report.png", "/fault-report", False, 1500),
    ("16-data-reporting.png", "/data-reporting", True, 1500),
    ("17-statistics.png", "/statistics", True, 2000),
    ("19-payments.png", "/payments", True, 1500),
    ("20-users.png", "/users", True, 1500),
    ("21-courses.png", "/courses", True, 1500),
    ("22-mobile.png", "/mobile/dashboard", True, 1500),
    ("24-knowledge.png", "/knowledge", True, 1500),
    ("25-usage-approval.png", "/lab-bookings/usage-approval", True, 1500),
    ("26-class-boards.png", "/class-boards", True, 1500),
    ("27-experiments.png", "/experiments", True, 1500),
]


async def ensure_login(page) -> None:
    await page.goto(f"{FRONTEND}/dashboard", wait_until="networkidle")
    if "/login" in page.url:
        await page.locator('input[placeholder="admin"]').fill("admin")
        await page.locator('input[placeholder="admin123"]').fill("admin123")
        await page.get_by_role("button", name="登 录").click()
        await page.wait_for_url("**/dashboard**", timeout=15000)


async def shot(page, filename: str, path: str, *, auth: bool, wait_ms: int) -> None:
    if auth:
        await ensure_login(page)
    await page.goto(f"{FRONTEND}{path}", wait_until="networkidle")
    await page.wait_for_timeout(wait_ms)
    await page.screenshot(path=str(OUT_DIR / filename), full_page=True)
    print(f"saved {filename}")


async def main() -> None:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        for filename, path, needs_auth, wait_ms in PAGES:
            await shot(page, filename, path, auth=needs_auth, wait_ms=wait_ms)

        await ensure_login(page)
        await page.goto(f"{FRONTEND}/labs", wait_until="networkidle")
        link = page.locator("table tbody tr a").first
        if await link.count():
            await link.click()
            await page.wait_for_timeout(1500)
            await page.screenshot(path=str(OUT_DIR / "04-lab-detail.png"), full_page=True)
            print("saved 04-lab-detail.png")

        await ensure_login(page)
        await page.goto(f"{FRONTEND}/instrument-bookings", wait_until="networkidle")
        cal_tab = page.get_by_text("日历视图")
        if await cal_tab.count():
            await cal_tab.first.click()
            await page.wait_for_timeout(1000)
        await page.screenshot(path=str(OUT_DIR / "09-instrument-bookings-calendar.png"), full_page=True)
        print("saved 09-instrument-bookings-calendar.png")

        await ensure_login(page)
        await page.goto(f"{FRONTEND}/dashboard", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.screenshot(path=str(OUT_DIR / "23-copilot.png"), full_page=True)
        print("saved 23-copilot.png")

        await ensure_login(page)
        await page.goto(f"{FRONTEND}/data-reporting", wait_until="networkidle")
        stats_tab = page.get_by_text("统计图表")
        if await stats_tab.count():
            await stats_tab.first.click()
            await page.wait_for_timeout(1000)
            await page.screenshot(path=str(OUT_DIR / "16-data-reporting-stats.png"), full_page=True)
            print("saved 16-data-reporting-stats.png")

        await browser.close()
    print(f"Done. Screenshots in {OUT_DIR}")


if __name__ == "__main__":
    asyncio.run(main())
