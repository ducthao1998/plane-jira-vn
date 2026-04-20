#!/usr/bin/env python3
"""
Seed 3 Backlogs (User Stories) cho du an E-Wallet theo Paper Outline v2.

Backlog la cap trung gian giua Epic va Task:
  Epic (Module) -> Backlog (Parent Issue) -> Task (Sub-issue)

Script nay:
  1. Tim project 'EWallet Platform' da duoc seed truoc
  2. Tao 3 backlog issue (EWALLET-101, EWALLET-102, EWALLET-201)
  3. Gan parent cho 6 task S1-S6 da ton tai

Usage:
    export PLANE_API_KEY="your-api-key"
    python seed/seed_dapd_backlogs.py

Environment variables:
    PLANE_API_KEY          (required)
    PLANE_API_URL          (optional) default http://localhost:8000
    PLANE_WORKSPACE_SLUG   (optional) default "ewallet"
    PLANE_PROJECT_NAME     (optional) default "EWallet Platform"
"""

import os
import sys
import requests

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
PLANE_API_URL = os.getenv("PLANE_API_URL", "http://localhost:8000").rstrip("/")
API_KEY = os.getenv("PLANE_API_KEY", "")
WORKSPACE_SLUG = os.getenv("PLANE_WORKSPACE_SLUG", "ewallet")
PROJECT_NAME = os.getenv("PLANE_PROJECT_NAME", "EWallet Platform")

if not API_KEY:
    print("[LOI] Bien moi truong PLANE_API_KEY chua duoc thiet lap.")
    sys.exit(1)

HEADERS = {
    "X-Api-Key": API_KEY,
    "Content-Type": "application/json",
}

BASE = f"{PLANE_API_URL}/api/v1/workspaces/{WORKSPACE_SLUG}"


# ---------------------------------------------------------------------------
# API helpers
# ---------------------------------------------------------------------------

def api_get(path: str):
    resp = requests.get(f"{BASE}/{path}", headers=HEADERS)
    resp.raise_for_status()
    return resp.json()


def api_post(path: str, data: dict):
    resp = requests.post(f"{BASE}/{path}", headers=HEADERS, json=data)
    if resp.status_code >= 400:
        print(f"  [DEBUG] POST {path} -> {resp.status_code}: {resp.text[:300]}")
    resp.raise_for_status()
    return resp.json()


def api_patch(path: str, data: dict):
    resp = requests.patch(f"{BASE}/{path}", headers=HEADERS, json=data)
    if resp.status_code >= 400:
        print(f"  [DEBUG] PATCH {path} -> {resp.status_code}: {resp.text[:300]}")
    resp.raise_for_status()
    return resp.json()


def get_list(path: str):
    data = api_get(path)
    if isinstance(data, dict) and "results" in data:
        return data["results"]
    if isinstance(data, list):
        return data
    return []


def find_by_name(items, name: str):
    for item in items:
        if item.get("name") == name:
            return item
    return None


# ---------------------------------------------------------------------------
# Danh sach Backlog (User Stories)
# ---------------------------------------------------------------------------

BACKLOGS_DATA = [
    {
        "code": "EWALLET-101",
        "name": "Chuyen diem quoc te",
        "description": (
            "Them kha nang chuyen diem giua cac vi quoc te voi validate IBAN/SWIFT. "
            "Bao gom: xay dung API backend, mo rong validator IBAN, tao giao dien frontend.\n\n"
            "Ma: EWALLET-101\n"
            "Do uu tien: HIGH\n"
            "Story Points: 8\n"
            "Nguoi phu trach: thailq\n"
            "Sprint: SPRINT-05\n"
            "Tasks: S1, S2, S3 + S6 (bo sung)"
        ),
        "priority": "high",
        "module": "Mo rong thanh toan",
        "cycle": "SPRINT-05",
        "labels": ["BACKLOG"],
        "child_tasks": [
            "Implement transferInternational API",
            "Validate IBAN quoc te",
            "Frontend trang chuyen diem quoc te",
            "Them tinh nang thanh toan QR Code",
        ],
    },
    {
        "code": "EWALLET-102",
        "name": "Nang cap Redeem Reward",
        "description": (
            "Cho phep doi diem thuong theo ty gia dong. "
            "Nang cap logic doi thuong trong PaymentService va RewardController.\n\n"
            "Ma: EWALLET-102\n"
            "Do uu tien: MEDIUM\n"
            "Story Points: 5\n"
            "Nguoi phu trach: thailq\n"
            "Sprint: SPRINT-06\n"
            "Tasks: Chua tao (nam ngoai pham vi thu nghiem)"
        ),
        "priority": "medium",
        "module": "Mo rong thanh toan",
        "cycle": "SPRINT-06",
        "labels": ["BACKLOG"],
        "child_tasks": [],
    },
    {
        "code": "EWALLET-201",
        "name": "Fix bug hien thi giao dich",
        "description": (
            "Giao dich khong hien thi dung ten vi nguon va vi dich. "
            "Nguyen nhan: thieu join query trong TransactionService "
            "va doc sai field trong frontend Transaction.js.\n\n"
            "Ma: EWALLET-201\n"
            "Do uu tien: HIGH\n"
            "Story Points: 3\n"
            "Nguoi phu trach: thailq\n"
            "Sprint: SPRINT-05\n"
            "Tasks: S4, S5"
        ),
        "priority": "high",
        "module": "Cai thien lich su giao dich",
        "cycle": "SPRINT-05",
        "labels": ["BACKLOG"],
        "child_tasks": [
            "Fix TransactionResponse mapping",
            "Fix frontend Transaction page",
        ],
    },
]

# Labels can them cho backlog
BACKLOG_LABELS = [
    {"name": "BACKLOG", "color": "#3F51B5"},
]


# ---------------------------------------------------------------------------
# Tim project va cac entity lien quan
# ---------------------------------------------------------------------------

def find_project():
    print(f"[DU AN] Tim project '{PROJECT_NAME}'...")
    projects = get_list("projects/")
    found = find_by_name(projects, PROJECT_NAME)
    if not found:
        print(f"  [LOI] Khong tim thay project '{PROJECT_NAME}'.")
        print(f"  Hay chay seed_dapd_scenarios.py truoc de tao project va tasks.")
        sys.exit(1)
    print(f"  -> Da tim thay (id={found['id']})")
    return found


def ensure_backlog_label(pid: str) -> dict:
    """Return dict label_name -> label_id."""
    print("\n[NHAN] Kiem tra/tao nhan BACKLOG...")
    existing = get_list(f"projects/{pid}/labels/")
    label_map = {}
    for lbl in BACKLOG_LABELS:
        found = None
        for ex in existing:
            if ex.get("name") == lbl["name"]:
                found = ex
                break
        if found:
            label_map[lbl["name"]] = found["id"]
            print(f"  -> Nhan '{lbl['name']}' da ton tai")
        else:
            try:
                result = api_post(f"projects/{pid}/labels/", lbl)
                label_map[lbl["name"]] = result["id"]
                print(f"  -> Tao nhan '{lbl['name']}'")
            except Exception as e:
                print(f"  -> LOI khi tao nhan: {e}")
    return label_map


def get_modules(pid: str) -> dict:
    print("\n[MODULE / EPIC] Tim cac module...")
    items = get_list(f"projects/{pid}/modules/")
    m = {it["name"]: it["id"] for it in items}
    for name, mid in m.items():
        print(f"  -> {name} (id={mid})")
    return m


def get_cycles(pid: str) -> dict:
    print("\n[CYCLE / SPRINT] Tim cac cycle...")
    items = get_list(f"projects/{pid}/cycles/")
    c = {it["name"]: it["id"] for it in items}
    for name, cid in c.items():
        print(f"  -> {name} (id={cid})")
    return c


def get_todo_state(pid: str) -> str:
    states = get_list(f"projects/{pid}/states/")
    for preferred in ["Todo", "Backlog"]:
        for s in states:
            if s.get("name", "").lower() == preferred.lower():
                return s["id"]
    return states[0]["id"] if states else ""


def get_all_issues(pid: str) -> list:
    """Lay tat ca issue trong project (ho tro phan trang)."""
    all_issues = []
    page = 1
    while True:
        try:
            data = api_get(f"projects/{pid}/issues/?per_page=100&cursor={page}")
        except Exception:
            break
        if isinstance(data, dict):
            items = data.get("results", [])
            all_issues.extend(items)
            if not data.get("next_cursor") and page > 1:
                break
            if len(items) < 100:
                break
            page += 1
        elif isinstance(data, list):
            all_issues.extend(data)
            break
        else:
            break
        if page > 10:
            break
    # Fallback: goi binh thuong
    if not all_issues:
        all_issues = get_list(f"projects/{pid}/issues/")
    return all_issues


# ---------------------------------------------------------------------------
# Tao Backlog (issue cha)
# ---------------------------------------------------------------------------

def create_or_find_backlog(pid, backlog, state_id, module_map, cycle_map, label_map):
    """Tao/tim backlog issue. Return dict backlog info."""
    print(f"\n[BACKLOG] {backlog['code']} - {backlog['name']}")

    # Tim issue co cung ten
    issues = get_all_issues(pid)
    found = find_by_name(issues, backlog["name"])

    if found:
        bid = found["id"]
        print(f"  -> Da ton tai (id={bid})")
    else:
        payload = {
            "name": backlog["name"],
            "description_html": (
                f"<p>{backlog['description'].replace(chr(10), '<br/>')}</p>"
            ),
            "priority": backlog["priority"],
        }
        if state_id:
            payload["state"] = state_id
        try:
            result = api_post(f"projects/{pid}/issues/", payload)
            bid = result["id"]
            print(f"  -> Da tao (id={bid})")
        except Exception as e:
            print(f"  -> LOI khi tao backlog: {e}")
            return None

    # Gan label BACKLOG
    label_ids = [label_map[l] for l in backlog["labels"] if l in label_map]
    if label_ids:
        try:
            api_patch(f"projects/{pid}/issues/{bid}/", {"labels": label_ids})
            print(f"     -> Gan nhan BACKLOG")
        except Exception as e:
            print(f"     -> LOI gan nhan: {e}")

    # Gan vao module
    mod_name = backlog["module"]
    if mod_name in module_map:
        mid = module_map[mod_name]
        try:
            api_post(
                f"projects/{pid}/modules/{mid}/module-issues/",
                {"issues": [bid]},
            )
            print(f"     -> Gan vao module '{mod_name}'")
        except requests.exceptions.HTTPError as e:
            if e.response is not None and e.response.status_code == 409:
                print(f"     -> Da gan module (bo qua)")
            else:
                print(f"     -> LOI gan module: {e}")
        except Exception as e:
            print(f"     -> LOI gan module: {e}")

    # Gan vao cycle
    cyc_name = backlog["cycle"]
    if cyc_name in cycle_map:
        cid = cycle_map[cyc_name]
        try:
            api_post(
                f"projects/{pid}/cycles/{cid}/cycle-issues/",
                {"issues": [bid]},
            )
            print(f"     -> Gan vao cycle '{cyc_name}'")
        except requests.exceptions.HTTPError as e:
            if e.response is not None and e.response.status_code == 409:
                print(f"     -> Da gan cycle (bo qua)")
            else:
                print(f"     -> LOI gan cycle: {e}")
        except Exception as e:
            print(f"     -> LOI gan cycle: {e}")

    return {"code": backlog["code"], "name": backlog["name"], "id": bid}


# ---------------------------------------------------------------------------
# Gan parent cho cac task S1-S6
# ---------------------------------------------------------------------------

def link_tasks_to_backlog(pid, backlog_info, child_task_names):
    """Update parent cua cac task con ve backlog."""
    if not backlog_info or not child_task_names:
        return

    print(f"\n[LINK] Gan parent cho tasks cua '{backlog_info['name']}'...")
    issues = get_all_issues(pid)

    for task_name in child_task_names:
        # Tim issue theo ten gan dung (co the khac dau, dau gach)
        task = None
        for it in issues:
            it_name = (it.get("name") or "").lower()
            if task_name.lower() in it_name or it_name in task_name.lower():
                task = it
                break

        if not task:
            # Tim chinh xac
            task = find_by_name(issues, task_name)

        if not task:
            print(f"  -> Khong tim thay task '{task_name}' (bo qua)")
            continue

        try:
            api_patch(
                f"projects/{pid}/issues/{task['id']}/",
                {"parent": backlog_info["id"]},
            )
            print(f"  -> '{task['name']}' -> parent = '{backlog_info['name']}'")
        except Exception as e:
            print(f"  -> LOI gan parent cho '{task_name}': {e}")


# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

def print_summary(project, backlogs_created):
    print("\n" + "=" * 80)
    print("  TONG KET SEED BACKLOG")
    print("=" * 80)
    print(f"\n  Du an: {project['name']} (id={project['id']})")
    print(f"\n  Backlogs da tao/xac nhan: {len(backlogs_created)}")
    for b in backlogs_created:
        if b:
            print(f"    - {b['code']} | {b['name']} (id={b['id']})")

    print("\n  Cau truc theo Paper:")
    print("    Epic (Module)")
    print("     |-- Backlog (Parent Issue)")
    print("          |-- Task (Sub-Issue)")
    print("=" * 80)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=" * 60)
    print("  SEED BACKLOGS cho E-Wallet Platform (Paper v2)")
    print(f"  API: {PLANE_API_URL} | Workspace: {WORKSPACE_SLUG}")
    print("=" * 60)

    try:
        project = find_project()
        pid = project["id"]

        label_map = ensure_backlog_label(pid)
        module_map = get_modules(pid)
        cycle_map = get_cycles(pid)
        state_id = get_todo_state(pid)

        backlogs_created = []
        for backlog in BACKLOGS_DATA:
            info = create_or_find_backlog(
                pid, backlog, state_id, module_map, cycle_map, label_map
            )
            backlogs_created.append(info)
            if info:
                link_tasks_to_backlog(pid, info, backlog.get("child_tasks", []))

        print_summary(project, backlogs_created)

    except requests.exceptions.ConnectionError:
        print(f"\n[LOI] Khong ket noi duoc {PLANE_API_URL}. Plane da chay chua?")
        sys.exit(1)
    except requests.exceptions.HTTPError as e:
        print(f"\n[LOI] HTTP Error: {e}")
        if e.response is not None:
            print(f"  Response: {e.response.text[:500]}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[LOI] Loi khong mong doi: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
