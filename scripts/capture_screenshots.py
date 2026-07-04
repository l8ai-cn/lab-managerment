#!/usr/bin/env python3
"""Capture detailed UI screenshots for functional delivery report (55+ shots)."""

from __future__ import annotations

import asyncio
import os
from pathlib import Path

from playwright.async_api import Page, async_playwright

FRONTEND = os.environ.get("FRONTEND_URL", "http://127.0.0.1:5173")
BACKEND = os.environ.get("BACKEND_URL", "http://127.0.0.1:8000")
OUT_DIR = Path(os.environ.get("SCREENSHOT_DIR", "/opt/cursor/artifacts/screenshots"))
OUT_DIR.mkdir(parents=True, exist_ok=True)

VIEWPORT = {"width": 1920, "height": 1080}


async def api_token() -> str:
    import httpx

    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{BACKEND}/api/v1/auth/login",
            json={"username": "admin", "password": "admin123"},
        )
        r.raise_for_status()
        return r.json()["access_token"]


async def first_lab_id(token: str) -> str | None:
    import httpx

    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{BACKEND}/api/v1/labs?limit=1",
            headers={"Authorization": f"Bearer {token}"},
        )
        r.raise_for_status()
        items = r.json().get("items") or []
        return items[0]["id"] if items else None


async def ensure_login(page: Page) -> None:
    await page.goto(f"{FRONTEND}/dashboard", wait_until="networkidle")
    if "/login" in page.url:
        await page.locator('input[placeholder="请输入用户名"]').fill("admin")
        await page.locator('input[placeholder="请输入密码"]').fill("admin123")
        await page.get_by_role("button", name="登 录").click()
        await page.wait_for_url("**/dashboard**", timeout=20000)


async def save(page: Page, name: str, *, full_page: bool = True) -> None:
    await page.wait_for_timeout(800)
    path = OUT_DIR / name
    await page.screenshot(path=str(path), full_page=full_page)
    print(f"  ✓ {name}")


async def goto(page: Page, path: str) -> None:
    await ensure_login(page)
    await page.goto(f"{FRONTEND}{path}", wait_until="networkidle")
    await page.wait_for_timeout(1200)


async def capture_all(page: Page) -> None:
    # --- 登录 & 大屏 ---
    await page.goto(f"{FRONTEND}/login", wait_until="networkidle")
    await page.wait_for_timeout(1500)
    await save(page, "01-login.png")

    await ensure_login(page)
    await page.goto(f"{FRONTEND}/dashboard", wait_until="networkidle")
    await page.wait_for_timeout(2500)
    await save(page, "02-dashboard.png")

    # --- 实验室 ---
    await goto(page, "/labs")
    await save(page, "03-labs-list.png")
    create_btn = page.get_by_role("button", name="新建实验室")
    if await create_btn.count():
        await create_btn.first.click()
        await page.wait_for_timeout(1000)
        await save(page, "03-labs-create-form.png")
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(500)

    token = await api_token()
    lab_id = await first_lab_id(token)
    if lab_id:
        await goto(page, f"/labs/{lab_id}")
        await save(page, "04-lab-detail.png")
        qr_btn = page.get_by_role("button", name="故障二维码")
        if await qr_btn.count():
            await qr_btn.click()
            await page.wait_for_timeout(800)
            await save(page, "04-lab-fault-qr-modal.png")
            await page.keyboard.press("Escape")

    # --- 空间 ---
    await goto(page, "/spaces")
    await save(page, "05-spaces.png")

    # --- 变更 ---
    await goto(page, "/lab-changes")
    await save(page, "06-lab-changes-list.png")
    change_link = page.locator("table tbody tr a").first
    if await change_link.count():
        await change_link.click()
        await page.wait_for_timeout(1500)
        await save(page, "06-lab-change-detail.png")

    # --- 实验员 ---
    await goto(page, "/lab-staff")
    await save(page, "07-lab-staff-list.png")
    staff_add = page.get_by_role("button", name="新增实验员")
    if await staff_add.count():
        await staff_add.click()
        await page.wait_for_timeout(1000)
        await save(page, "07-lab-staff-create-modal.png")
        await page.keyboard.press("Escape")

    # --- 仪器 ---
    await goto(page, "/instruments")
    await save(page, "08-instruments-list.png")
    inst_add = page.get_by_role("button", name="新增仪器")
    if await inst_add.count():
        await inst_add.click()
        await page.wait_for_timeout(1000)
        await save(page, "08-instruments-create-form.png")
        await page.keyboard.press("Escape")
    edit_btn = page.get_by_role("button", name="编辑").first
    if await edit_btn.count():
        await edit_btn.click()
        await page.wait_for_timeout(1000)
        await save(page, "08-instruments-edit-form.png")
        await page.keyboard.press("Escape")

    await goto(page, "/instruments/rules")
    inst_sel = page.locator(".ant-select").first
    if await inst_sel.count():
        await inst_sel.click()
        await page.wait_for_timeout(400)
        opt = page.locator(".ant-select-item-option").first
        if await opt.count():
            await opt.click()
            await page.wait_for_timeout(1500)
    await save(page, "12-instrument-rules.png")

    # --- 仪器预约 ---
    await goto(page, "/instrument-bookings")
    await save(page, "09-instrument-bookings-list.png")
    cal = page.get_by_text("日历视图")
    if await cal.count():
        await cal.first.click()
        await page.wait_for_timeout(1200)
        await save(page, "09-instrument-bookings-calendar.png")
    book_add = page.get_by_role("button", name="新建预约")
    if await book_add.count():
        await book_add.click()
        await page.wait_for_timeout(1000)
        await save(page, "09-instrument-bookings-create-modal.png")
        await page.keyboard.press("Escape")

    # --- 实验室预约 ---
    await goto(page, "/lab-bookings")
    await save(page, "10-lab-bookings-list.png")
    lab_cal = page.get_by_text("日历视图")
    if await lab_cal.count():
        await lab_cal.first.click()
        await page.wait_for_timeout(1200)
        await save(page, "10-lab-bookings-calendar.png")
    lab_add = page.get_by_role("button", name="新建预约")
    if await lab_add.count():
        await lab_add.click()
        await page.wait_for_timeout(1000)
        await save(page, "10-lab-bookings-create-modal.png")
        await page.keyboard.press("Escape")

    list_tab = page.locator(".ant-tabs-tab").filter(has_text="预约列表")
    if await list_tab.count():
        await list_tab.first.click()
        await page.wait_for_timeout(1000)
    status_sel = page.locator('.ant-select').filter(has=page.locator('[placeholder="状态"]')).first
    if not await status_sel.count():
        status_sel = page.locator(".ant-select").nth(1)
    if await status_sel.count():
        try:
            await status_sel.click(timeout=5000)
            await page.wait_for_timeout(400)
            approved_opt = page.get_by_text("已通过", exact=True)
            if await approved_opt.count():
                await approved_opt.first.click()
                await page.wait_for_timeout(1500)
        except Exception as exc:
            print(f"  ⚠ skip status filter: {exc}")
    expand = page.locator(".ant-table-row-expand-icon:not(.ant-table-row-expand-icon-spaced)").first
    if await expand.count():
        try:
            await expand.scroll_into_view_if_needed()
            await expand.click(timeout=5000)
            await page.wait_for_timeout(1000)
            await save(page, "10-lab-bookings-usage-panel.png")
        except Exception as exc:
            print(f"  ⚠ skip 10-lab-bookings-usage-panel: {exc}")

    await goto(page, "/lab-bookings/rules")
    lab_rule_sel = page.locator(".ant-select").first
    if await lab_rule_sel.count():
        await lab_rule_sel.click()
        await page.wait_for_timeout(400)
        opt = page.locator(".ant-select-item-option").first
        if await opt.count():
            await opt.click()
            await page.wait_for_timeout(1500)
    await save(page, "11-lab-booking-rules.png")

    await goto(page, "/lab-bookings/usage-approval")
    await save(page, "25-usage-approval.png")

    # --- 教学科研 ---
    await goto(page, "/courses")
    await save(page, "21-courses.png")

    await goto(page, "/experiment-projects")
    await save(page, "13-experiment-projects-list.png")
    proj_add = page.get_by_role("button", name="新建项目")
    if await proj_add.count():
        await proj_add.click()
        await page.wait_for_timeout(1500)
        await save(page, "13-experiment-projects-create.png")
        await page.go_back()
        await page.wait_for_timeout(1000)

    await goto(page, "/experiments")
    await save(page, "27-experiments-list.png")
    exp_link = page.locator("table tbody tr a").first
    if await exp_link.count():
        await exp_link.click()
        await page.wait_for_timeout(1500)
        await save(page, "27-experiment-detail.png")

    # --- 故障 ---
    await goto(page, "/faults")
    await save(page, "14-faults-list.png")
    fault_add = page.get_by_role("button", name="上报故障")
    if await fault_add.count():
        await fault_add.click()
        await page.wait_for_timeout(1000)
        await save(page, "14-faults-report-modal.png")
        await page.keyboard.press("Escape")
    fault_link = page.locator("table tbody tr a").first
    if await fault_link.count():
        await fault_link.click()
        await page.wait_for_timeout(1500)
        await save(page, "14-fault-detail.png")

    await page.goto(f"{FRONTEND}/fault-report", wait_until="networkidle")
    await page.wait_for_timeout(1500)
    await save(page, "15-fault-report-landing.png")

    # --- 数据填报 ---
    await goto(page, "/data-reporting")
    await save(page, "16-data-reporting-templates.png")
    sub_tab = page.get_by_text("填报记录")
    if await sub_tab.count():
        await sub_tab.first.click()
        await page.wait_for_timeout(1200)
        await save(page, "16-data-reporting-submissions.png")
    stats_tab = page.get_by_text("统计图表")
    if await stats_tab.count():
        await stats_tab.first.click()
        await page.wait_for_timeout(1200)
        await save(page, "16-data-reporting-stats.png")
    tpl_add = page.get_by_text("填报模板")
    if await tpl_add.count():
        await tpl_add.first.click()
        await page.wait_for_timeout(800)
    tpl_create = page.get_by_role("button", name="新建模板")
    if await tpl_create.count():
        await tpl_create.click()
        await page.wait_for_timeout(1000)
        await save(page, "16-data-reporting-template-create.png")
        await page.keyboard.press("Escape")

    # --- 统计 ---
    await goto(page, "/statistics")
    await page.wait_for_timeout(2000)
    await save(page, "17-statistics.png")

    # --- 用户 ---
    await goto(page, "/users")
    await save(page, "20-users-list.png")
    user_add = page.get_by_role("button", name="新增用户")
    if await user_add.count():
        await user_add.click()
        await page.wait_for_timeout(1000)
        await save(page, "20-users-create-modal.png")
        await page.keyboard.press("Escape")

    # --- 知识库 ---
    await goto(page, "/knowledge")
    await save(page, "24-knowledge-list.png")
    know_add = page.get_by_role("button", name="新建文档")
    if await know_add.count():
        await know_add.click()
        await page.wait_for_timeout(1000)
        await save(page, "24-knowledge-create-modal.png")
        await page.keyboard.press("Escape")
    search = page.locator(".ant-input-search input")
    if await search.count():
        await search.first.fill("实验室")
        await search.first.press("Enter")
        await page.wait_for_timeout(1500)
        await save(page, "24-knowledge-search.png")

    # --- 支付 ---
    await goto(page, "/payments")
    await save(page, "19-payments.png")

    # --- 班牌 ---
    await goto(page, "/class-boards")
    await save(page, "26-class-boards.png")

    # --- 移动端 ---
    await goto(page, "/mobile/dashboard")
    await save(page, "22-mobile-dashboard.png")
    await goto(page, "/mobile/bookings")
    await save(page, "22-mobile-bookings.png")

    # --- Copilot ---
    await goto(page, "/dashboard")
    await page.wait_for_timeout(2000)
    await save(page, "23-copilot-dashboard.png")

    # --- OpenAPI ---
    await page.goto("http://127.0.0.1:8000/docs", wait_until="networkidle")
    await page.wait_for_timeout(2000)
    await save(page, "30-openapi-docs.png")


async def main() -> None:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport=VIEWPORT, device_scale_factor=1)
        page = await context.new_page()
        print(f"Capturing to {OUT_DIR} ...")
        await capture_all(page)
        count = len(list(OUT_DIR.glob("*.png")))
        await browser.close()
    print(f"Done — {count} screenshots.")


if __name__ == "__main__":
    asyncio.run(main())
