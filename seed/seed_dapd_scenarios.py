#!/usr/bin/env python3
"""
Seed Plane with DAPD paper's 6 test scenarios (S1-S6) for E-Wallet project.

Usage:
    export PLANE_API_KEY="your-api-key"
    python scripts/seed_dapd_scenarios.py

Environment variables:
    PLANE_API_KEY          (required) API key for Plane
    PLANE_API_URL          (optional) default http://localhost:8000
    PLANE_WORKSPACE_SLUG   (optional) default "ewallet"
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

if not API_KEY:
    print("[LOI] Bien moi truong PLANE_API_KEY chua duoc thiet lap.")
    sys.exit(1)

HEADERS = {
    "X-Api-Key": API_KEY,
    "Content-Type": "application/json",
}

BASE = f"{PLANE_API_URL}/api/v1/workspaces/{WORKSPACE_SLUG}"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def api_get(path: str):
    url = f"{BASE}/{path}"
    resp = requests.get(url, headers=HEADERS)
    resp.raise_for_status()
    return resp.json()


def api_post(path: str, data: dict):
    url = f"{BASE}/{path}"
    resp = requests.post(url, headers=HEADERS, json=data)
    if resp.status_code >= 400:
        print(f"  [DEBUG] POST {path} -> {resp.status_code}: {resp.text[:300]}")
    resp.raise_for_status()
    return resp.json()


def api_patch(path: str, data: dict):
    url = f"{BASE}/{path}"
    resp = requests.patch(url, headers=HEADERS, json=data)
    if resp.status_code >= 400:
        print(f"  [DEBUG] PATCH {path} -> {resp.status_code}: {resp.text[:300]}")
    resp.raise_for_status()
    return resp.json()


def find_by_name(items, name: str):
    """Find an item in a list (or paginated results) by name."""
    # Plane API may return {"results": [...]} or just a list
    if isinstance(items, dict) and "results" in items:
        items = items["results"]
    if not isinstance(items, list):
        return None
    for item in items:
        if item.get("name") == name:
            return item
    return None


# ---------------------------------------------------------------------------
# Project
# ---------------------------------------------------------------------------

PROJECT_DATA = {
    "name": "EWallet Platform",
    "description": "He thong vi dien tu eWallet kien truc microservices 7 services Spring Boot va React",
    "network": 2,
    "identifier": "EWLT",
}


def get_or_create_project() -> dict:
    print("[DU AN] Kiem tra du an 'E-Wallet Platform'...")
    projects = api_get("projects/")
    existing = find_by_name(projects, PROJECT_DATA["name"])
    if existing:
        pid = existing["id"]
        print(f"  -> Da ton tai (id={pid})")
    else:
        print("  -> Tao moi du an...")
        result = api_post("projects/", PROJECT_DATA)
        pid = result["id"]
        print(f"  -> Da tao (id={pid})")

    # Enable module & cycle views
    print("  -> Bat tinh nang Module va Cycle...")
    try:
        api_patch(f"projects/{pid}/", {"module_view": True, "cycle_view": True})
        print("  -> Da bat module_view va cycle_view")
    except Exception as e:
        print(f"  -> Luu y: Khong the bat module/cycle view: {e}")

    return {"id": pid, "name": PROJECT_DATA["name"]}


# ---------------------------------------------------------------------------
# Labels
# ---------------------------------------------------------------------------

LABELS_DATA = [
    {"name": "FEATURE", "color": "#4CAF50"},
    {"name": "BUG_FIX", "color": "#F44336"},
    {"name": "SECURITY", "color": "#FF9800"},
    {"name": "HIGH_RISK", "color": "#E91E63"},
    {"name": "MEDIUM_RISK", "color": "#FFC107"},
    {"name": "LOW_RISK", "color": "#8BC34A"},
]


def get_or_create_labels(pid: str) -> dict:
    """Return dict of label_name -> label_id."""
    print("\n[NHAN] Kiem tra va tao nhan (labels)...")
    existing = api_get(f"projects/{pid}/labels/")
    if isinstance(existing, dict) and "results" in existing:
        existing_list = existing["results"]
    elif isinstance(existing, list):
        existing_list = existing
    else:
        existing_list = []

    label_map = {}
    for lbl in LABELS_DATA:
        found = None
        for ex in existing_list:
            if ex.get("name") == lbl["name"]:
                found = ex
                break
        if found:
            label_map[lbl["name"]] = found["id"]
            print(f"  -> Nhan '{lbl['name']}' da ton tai (id={found['id']})")
        else:
            try:
                result = api_post(f"projects/{pid}/labels/", lbl)
                label_map[lbl["name"]] = result["id"]
                print(f"  -> Da tao nhan '{lbl['name']}' (id={result['id']})")
            except Exception as e:
                print(f"  -> LOI khi tao nhan '{lbl['name']}': {e}")

    return label_map


# ---------------------------------------------------------------------------
# Modules (= Epics)
# ---------------------------------------------------------------------------

MODULES_DATA = [
    {
        "name": "Mo rong thanh toan",
        "description": "Epic 1: Mo rong he thong thanh toan — chuyen diem quoc te, QR Code (SPRINT-05/06, HIGH priority)",
    },
    {
        "name": "Cai thien lich su giao dich",
        "description": "Epic 2: Fix bug hien thi giao dich, cai thien UX lich su giao dich (SPRINT-05, MEDIUM priority)",
    },
]


def get_or_create_modules(pid: str) -> dict:
    """Return dict of module_name -> module_id."""
    print("\n[MODULE / EPIC] Kiem tra va tao modules...")
    existing = api_get(f"projects/{pid}/modules/")
    module_map = {}
    for mod in MODULES_DATA:
        found = find_by_name(existing, mod["name"])
        if found:
            module_map[mod["name"]] = found["id"]
            print(f"  -> Module '{mod['name']}' da ton tai (id={found['id']})")
        else:
            try:
                result = api_post(f"projects/{pid}/modules/", mod)
                module_map[mod["name"]] = result["id"]
                print(f"  -> Da tao module '{mod['name']}' (id={result['id']})")
            except Exception as e:
                print(f"  -> LOI khi tao module '{mod['name']}': {e}")
    return module_map


# ---------------------------------------------------------------------------
# Cycles (= Sprints)
# ---------------------------------------------------------------------------

CYCLES_DATA = [
    {
        "name": "SPRINT-05",
        "start_date": "2026-04-01",
        "end_date": "2026-04-30",
        "description": "Sprint 05: Chuyen diem quoc te + Fix bug giao dich (S1-S5)",
    },
    {
        "name": "SPRINT-06",
        "start_date": "2026-05-01",
        "end_date": "2026-05-15",
        "description": "Sprint 06: Tinh nang QR Code (S6)",
    },
]


def get_or_create_cycles(pid: str) -> dict:
    """Return dict of cycle_name -> cycle_id."""
    print("\n[CYCLE / SPRINT] Kiem tra va tao cycles...")
    existing = api_get(f"projects/{pid}/cycles/")
    cycle_map = {}
    for cyc in CYCLES_DATA:
        found = find_by_name(existing, cyc["name"])
        if found:
            cycle_map[cyc["name"]] = found["id"]
            print(f"  -> Cycle '{cyc['name']}' da ton tai (id={found['id']})")
        else:
            try:
                payload = {**cyc, "project_id": pid}
                result = api_post(f"projects/{pid}/cycles/", payload)
                cycle_map[cyc["name"]] = result["id"]
                print(f"  -> Da tao cycle '{cyc['name']}' (id={result['id']})")
            except Exception as e:
                print(f"  -> LOI khi tao cycle '{cyc['name']}': {e}")
    return cycle_map


# ---------------------------------------------------------------------------
# States — find Todo / Backlog state
# ---------------------------------------------------------------------------

def get_todo_state(pid: str) -> str:
    """Return the ID of the 'Todo' or 'Backlog' state."""
    print("\n[TRANG THAI] Tim trang thai 'Todo' hoac 'Backlog'...")
    states = api_get(f"projects/{pid}/states/")
    if isinstance(states, dict) and "results" in states:
        states = states["results"]

    for preferred in ["Todo", "todo", "Backlog", "backlog"]:
        for s in states:
            if s.get("name", "").lower() == preferred.lower():
                print(f"  -> Tim thay trang thai '{s['name']}' (id={s['id']})")
                return s["id"]

    # Fallback: first state
    if states:
        s = states[0]
        print(f"  -> Dung trang thai mac dinh '{s['name']}' (id={s['id']})")
        return s["id"]

    print("  -> CANH BAO: Khong tim thay trang thai nao!")
    return ""


# ---------------------------------------------------------------------------
# Issues (= Tasks / Scenarios S1-S6)
# ---------------------------------------------------------------------------

ISSUES_DATA = [
    {
        "scenario": "S1",
        "name": "Implement transferInternational API",
        "description": (
            "Them API POST /api/v1/payments/transfer-international trong "
            "PaymentController va PaymentService. Can validate IBAN quoc te, "
            "tuong thich SWIFT, xu ly da tien te.\n\n"
            "* taskType: FEATURE\n"
            "* riskLevel: HIGH\n"
            "* Impacts: payment-service (DIRECT), wallet-service (INDIRECT), "
            "12 impacts xuyen 2 services\n"
            "* assigneeDev: thailq\n"
            "* plannedDays: 10 (2025-02-10 -> 2025-02-20)"
        ),
        "priority": "high",
        "estimate_point": 8,
        "module": "Mo rong thanh toan",
        "cycle": "SPRINT-05",
        "labels": ["FEATURE", "HIGH_RISK"],
    },
    {
        "scenario": "S2",
        "name": "Validate IBAN quoc te",
        "description": (
            "Mo rong ValidIban annotation ho tro SWIFT/BIC code cho chuyen tien "
            "quoc te. Phai backward compatible voi IBAN hien tai.\n\n"
            "* taskType: FEATURE\n"
            "* riskLevel: MEDIUM\n"
            "* Impacts: common-service (DIRECT), ValidIban.java, "
            "IbanValidator.java — 3 impacts\n"
            "* plannedDays: 10 (2025-02-15 -> 2025-02-25)"
        ),
        "priority": "medium",
        "estimate_point": 5,
        "module": "Mo rong thanh toan",
        "cycle": "SPRINT-05",
        "labels": ["FEATURE", "MEDIUM_RISK"],
    },
    {
        "scenario": "S3",
        "name": "Frontend — trang chuyen diem quoc te",
        "description": (
            "Them tab International Transfer trong WalletToWallet.js. "
            "Tuong thich voi UI hien tai, responsive.\n\n"
            "* taskType: FEATURE\n"
            "* riskLevel: LOW\n"
            "* Impacts: frontend (DIRECT), WalletToWallet.js, "
            "HttpService.js (INDIRECT) — 3 impacts\n"
            "* plannedDays: 8 (2025-02-20 -> 2025-02-28)"
        ),
        "priority": "medium",
        "estimate_point": 5,
        "module": "Mo rong thanh toan",
        "cycle": "SPRINT-05",
        "labels": ["FEATURE", "LOW_RISK"],
    },
    {
        "scenario": "S4",
        "name": "Fix TransactionResponse mapping",
        "description": (
            "TransactionResponse tra ve fromWallet.user.firstName null do thieu "
            "join trong TransactionService. Khong lam thay doi response structure.\n\n"
            "* taskType: BUG_FIX\n"
            "* riskLevel: MEDIUM\n"
            "* Impacts: transaction-service (DIRECT), TransactionService.java, "
            "Transaction entity (INDIRECT) — 5 impacts\n"
            "* plannedDays: 3 (2025-02-12 -> 2025-02-15)"
        ),
        "priority": "high",
        "estimate_point": 3,
        "module": "Cai thien lich su giao dich",
        "cycle": "SPRINT-05",
        "labels": ["BUG_FIX", "MEDIUM_RISK"],
    },
    {
        "scenario": "S5",
        "name": "Fix frontend Transaction page",
        "description": (
            "Transaction.js khong hien thi ten vi do doc sai field tu response. "
            "Chi sua frontend, khong anh huong backend.\n\n"
            "* taskType: BUG_FIX\n"
            "* riskLevel: LOW\n"
            "* Impacts: frontend (DIRECT), Transaction.js — 2 impacts\n"
            "* plannedDays: 3 (2025-02-15 -> 2025-02-18)"
        ),
        "priority": "high",
        "estimate_point": 3,
        "module": "Cai thien lich su giao dich",
        "cycle": "SPRINT-05",
        "labels": ["BUG_FIX", "LOW_RISK"],
    },
    {
        "scenario": "S6",
        "name": "Them tinh nang thanh toan QR Code",
        "description": (
            "Nguoi dung tao QR chua thong tin vi (IBAN), nguoi khac quet QR de "
            "chuyen diem. Tich hop payment-service va wallet-service, su dung "
            "CreateQRCode.js o frontend.\n\n"
            "* taskType: FEATURE\n"
            "* riskLevel: HIGH (AI danh gia real-time)\n"
            "* Impacts: payment-service (DIRECT), wallet-service (INDIRECT), "
            "transaction-service (INDIRECT), frontend (DIRECT) — 10-15 impacts\n"
            "* plannedDays: 14 (2025-03-01 -> 2025-03-15)"
        ),
        "priority": "medium",
        "estimate_point": 8,
        "module": "Mo rong thanh toan",
        "cycle": "SPRINT-06",
        "labels": ["FEATURE", "HIGH_RISK"],
    },
]


def get_or_create_issues(pid, state_id, module_map, cycle_map, label_map):
    """Create issues and assign them to modules/cycles. Return list of created info."""
    print("\n[ISSUE / TASK] Kiem tra va tao issues (S1-S6)...")
    existing = api_get(f"projects/{pid}/issues/")
    created = []

    for issue in ISSUES_DATA:
        scenario = issue["scenario"]
        found = find_by_name(existing, issue["name"])

        if found:
            iid = found["id"]
            print(f"  -> [{scenario}] '{issue['name']}' da ton tai (id={iid})")
        else:
            payload = {
                "name": issue["name"],
                "description_html": f"<p>{issue['description'].replace(chr(10), '<br/>')}</p>",
                "priority": issue["priority"],
            }
            if state_id:
                payload["state"] = state_id
            try:
                result = api_post(f"projects/{pid}/issues/", payload)
                iid = result["id"]
                print(f"  -> [{scenario}] Da tao '{issue['name']}' (id={iid})")
            except Exception as e:
                print(f"  -> [{scenario}] LOI khi tao issue: {e}")
                created.append({"scenario": scenario, "name": issue["name"], "status": "LOI"})
                continue

        # Assign labels via PATCH
        issue_label_ids = [label_map[l] for l in issue["labels"] if l in label_map]
        if issue_label_ids:
            try:
                api_patch(f"projects/{pid}/issues/{iid}/", {"labels": issue_label_ids})
                label_names = ", ".join(issue["labels"])
                print(f"     -> Gan nhan: {label_names}")
            except Exception as e:
                print(f"     -> LOI khi gan nhan: {e}")

        # Assign to module
        mod_name = issue["module"]
        if mod_name in module_map:
            mid = module_map[mod_name]
            try:
                api_post(f"projects/{pid}/modules/{mid}/module-issues/", {"issues": [iid]})
                print(f"     -> Gan vao module '{mod_name}'")
            except requests.exceptions.HTTPError as e:
                if e.response is not None and e.response.status_code == 409:
                    print(f"     -> Da gan vao module '{mod_name}' (bo qua)")
                else:
                    print(f"     -> LOI khi gan module: {e}")
            except Exception as e:
                print(f"     -> LOI khi gan module: {e}")

        # Assign to cycle
        cyc_name = issue["cycle"]
        if cyc_name in cycle_map:
            cid = cycle_map[cyc_name]
            try:
                api_post(f"projects/{pid}/cycles/{cid}/cycle-issues/", {"issues": [iid]})
                print(f"     -> Gan vao cycle '{cyc_name}'")
            except requests.exceptions.HTTPError as e:
                if e.response is not None and e.response.status_code == 409:
                    print(f"     -> Da gan vao cycle '{cyc_name}' (bo qua)")
                else:
                    print(f"     -> LOI khi gan cycle: {e}")
            except Exception as e:
                print(f"     -> LOI khi gan cycle: {e}")

        created.append({
            "scenario": scenario,
            "name": issue["name"],
            "id": iid,
            "module": mod_name,
            "cycle": cyc_name,
            "labels": issue["labels"],
            "priority": issue["priority"],
            "estimate": issue["estimate_point"],
            "status": "OK",
        })

    return created


# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

def print_summary(project, module_map, cycle_map, label_map, issues):
    print("\n" + "=" * 80)
    print("  TONG KET SEED DU LIEU DAPD SCENARIOS")
    print("=" * 80)

    print(f"\n  Du an:     {project['name']} (id={project['id']})")
    print(f"  Workspace: {WORKSPACE_SLUG}")
    print(f"  API URL:   {PLANE_API_URL}")

    print(f"\n  Modules (Epics): {len(module_map)}")
    for name, mid in module_map.items():
        print(f"    - {name} (id={mid})")

    print(f"\n  Cycles (Sprints): {len(cycle_map)}")
    for name, cid in cycle_map.items():
        print(f"    - {name} (id={cid})")

    print(f"\n  Labels: {len(label_map)}")
    for name, lid in label_map.items():
        print(f"    - {name} (id={lid})")

    print(f"\n  Issues (Tasks): {len(issues)}")
    print(f"  {'SC':<4} {'Ten':<45} {'Priority':<8} {'Est':<4} {'Module':<28} {'Cycle':<12} {'Labels'}")
    print(f"  {'--':<4} {'--':<45} {'--------':<8} {'---':<4} {'------':<28} {'-----':<12} {'------'}")
    for i in issues:
        labels_str = ", ".join(i.get("labels", []))
        print(
            f"  {i['scenario']:<4} "
            f"{i['name'][:44]:<45} "
            f"{i.get('priority', '-'):<8} "
            f"{i.get('estimate', '-'):<4} "
            f"{i.get('module', '-')[:27]:<28} "
            f"{i.get('cycle', '-'):<12} "
            f"{labels_str}"
        )

    ok_count = sum(1 for i in issues if i.get("status") == "OK")
    err_count = len(issues) - ok_count
    print(f"\n  Ket qua: {ok_count} thanh cong, {err_count} loi")
    print("=" * 80)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=" * 60)
    print("  SEED DAPD SCENARIOS — E-Wallet Platform")
    print(f"  API: {PLANE_API_URL} | Workspace: {WORKSPACE_SLUG}")
    print("=" * 60)

    try:
        project = get_or_create_project()
        pid = project["id"]

        label_map = get_or_create_labels(pid)
        module_map = get_or_create_modules(pid)
        cycle_map = get_or_create_cycles(pid)
        state_id = get_todo_state(pid)
        issues = get_or_create_issues(pid, state_id, module_map, cycle_map, label_map)

        print_summary(project, module_map, cycle_map, label_map, issues)

    except requests.exceptions.ConnectionError:
        print(f"\n[LOI] Khong the ket noi den {PLANE_API_URL}. Kiem tra Plane da chay chua.")
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
