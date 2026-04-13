# Copyright (c) 2024 DAPD Integration
# Tích hợp Plane với DAPD Engine (Data-driven Agile Project Development)
#
# Khi PM tạo/sửa/xóa issue trên Plane → tự động đồng bộ sang DAPD API
# Luồng: Plane Issue → DAPD Layer P (Task) → Transform h→f→g → Trace Records
#
# DAPD API: http://localhost:8090
# Tài liệu: DAPD_Planning_Layer_Integration_Guide.md

import json
import logging
import os

import requests
from celery import shared_task
from django.conf import settings

from plane.db.models import (
    Issue,
    Project,
    Module,
    Cycle,
    State,
)
from plane.utils.exception_logger import log_exception

logger = logging.getLogger("plane.worker")

# Cấu hình DAPD Engine
DAPD_BASE_URL = os.environ.get("DAPD_API_URL", "http://localhost:8090")
DAPD_ENABLED = os.environ.get("DAPD_ENABLED", "1") in ("1", "true", "True", "yes")
DAPD_TIMEOUT = int(os.environ.get("DAPD_TIMEOUT", "10"))


def dapd_api(method, path, data=None):
    """Gọi DAPD API — helper chung"""
    url = f"{DAPD_BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    try:
        if method == "POST":
            resp = requests.post(url, json=data, headers=headers, timeout=DAPD_TIMEOUT)
        elif method == "PUT":
            resp = requests.put(url, json=data, headers=headers, timeout=DAPD_TIMEOUT)
        elif method == "DELETE":
            resp = requests.delete(url, headers=headers, timeout=DAPD_TIMEOUT)
        elif method == "PATCH":
            resp = requests.patch(url, json=data, headers=headers, timeout=DAPD_TIMEOUT)
        else:
            resp = requests.get(url, headers=headers, timeout=DAPD_TIMEOUT)

        logger.info(f"[DAPD] {method} {path} → {resp.status_code}")
        return resp
    except requests.exceptions.ConnectionError:
        logger.warning(f"[DAPD] Khong ket noi duoc toi {url} — DAPD engine chua chay?")
        return None
    except Exception as e:
        logger.error(f"[DAPD] Loi khi goi {method} {path}: {e}")
        return None


# ==================== ÁNH XẠ DỮ LIỆU PLANE → DAPD ====================

def map_priority(plane_priority):
    """Ánh xạ priority từ Plane sang DAPD"""
    mapping = {
        "urgent": "CRITICAL",
        "high": "HIGH",
        "medium": "MEDIUM",
        "low": "LOW",
        "none": "LOW",
    }
    return mapping.get(plane_priority, "MEDIUM")


def map_status(state_name):
    """Ánh xạ trạng thái từ Plane State sang DAPD"""
    name = (state_name or "").lower()
    if "done" in name or "complete" in name or "closed" in name:
        return "DONE"
    if "progress" in name:
        return "IN_PROGRESS"
    if "review" in name:
        return "IN_PROGRESS"
    if "cancel" in name:
        return "TODO"
    return "TODO"


def map_task_type(issue_name):
    """Xác định taskType dựa trên tên issue"""
    name = (issue_name or "").lower()
    if "fix" in name or "bug" in name or "loi" in name or "sua" in name:
        return "BUG_FIX"
    if "refactor" in name or "tai cau truc" in name:
        return "REFACTOR"
    if "bao mat" in name or "security" in name:
        return "SECURITY"
    if "khan cap" in name or "hotfix" in name:
        return "HOTFIX"
    return "FEATURE"


# ==================== CELERY TASKS ====================

@shared_task
def dapd_sync_issue(issue_id, verb="created", slug=None):
    """
    Đồng bộ issue từ Plane sang DAPD Engine.

    Luồng theo Paper:
    1. Tìm/tạo Project trong DAPD
    2. Tìm/tạo Epic (từ Module)
    3. Tìm/tạo Backlog
    4. Tìm/tạo Task
    5. Kích hoạt chuỗi biến đổi: h(A→O) → f(O→S) → g(S→P)

    Args:
        issue_id: UUID của issue trong Plane
        verb: "created" hoặc "updated" hoặc "deleted"
        slug: workspace slug
    """
    if not DAPD_ENABLED:
        return

    try:
        issue = Issue.objects.select_related(
            "project", "project__workspace", "state"
        ).get(pk=issue_id)
    except Issue.DoesNotExist:
        if verb == "deleted":
            logger.info(f"[DAPD] Issue {issue_id} da bi xoa, bo qua")
            return
        logger.warning(f"[DAPD] Khong tim thay issue {issue_id}")
        return

    project = issue.project
    state_name = issue.state.name if issue.state else ""
    status = map_status(state_name)
    priority = map_priority(issue.priority or "medium")
    task_type = map_task_type(issue.name)

    logger.info(f"[DAPD] Dong bo issue '{issue.name}' ({verb}) → DAPD Engine")

    # === Bước 1: Tìm/tạo Project trong DAPD ===
    project_data = {
        "name": project.name,
        "description": project.description or "",
        "owner": "Plane PM",
        "status": "ACTIVE",
        "externalUrl": f"plane://{slug}/projects/{project.id}",
    }

    # Tìm project theo tên
    resp = dapd_api("GET", "/api/layer-p/projects")
    if not resp or resp.status_code != 200:
        logger.error("[DAPD] Khong lay duoc danh sach project")
        return

    projects_data = resp.json()
    projects_list = projects_data.get("data", projects_data) if isinstance(projects_data, dict) else projects_data
    if not isinstance(projects_list, list):
        projects_list = []

    dapd_project_id = None
    for p in projects_list:
        ext_url = p.get("externalUrl") or p.get("external_url") or ""
        if f"plane://{slug}/projects/{project.id}" in ext_url:
            dapd_project_id = p.get("id")
            break
        if p.get("name") == project.name:
            dapd_project_id = p.get("id")
            break

    if not dapd_project_id:
        resp = dapd_api("POST", "/api/layer-p/projects", project_data)
        if resp and resp.status_code == 201:
            result = resp.json()
            dapd_project_id = result.get("data", result).get("id") if isinstance(result, dict) else None
            logger.info(f"[DAPD] Tao project '{project.name}' → id={dapd_project_id}")
        else:
            logger.error(f"[DAPD] Khong tao duoc project: {resp.text if resp else 'no response'}")
            return

    # === Bước 2: Tìm/tạo Epic (từ Module hoặc mặc định) ===
    # Tìm module chứa issue
    from plane.db.models import ModuleIssue
    module_issue = ModuleIssue.objects.filter(issue_id=issue_id).select_related("module").first()
    epic_name = module_issue.module.name if module_issue else "Chua phan loai"

    resp = dapd_api("GET", f"/api/layer-p/projects/{dapd_project_id}/epics")
    epics_list = []
    if resp and resp.status_code == 200:
        epics_data = resp.json()
        epics_list = epics_data.get("data", epics_data) if isinstance(epics_data, dict) else epics_data
        if not isinstance(epics_list, list):
            epics_list = []

    dapd_epic_id = None
    for e in epics_list:
        if e.get("name") == epic_name:
            dapd_epic_id = e.get("id")
            break

    if not dapd_epic_id:
        epic_data = {
            "name": epic_name,
            "description": module_issue.module.description if module_issue and module_issue.module.description else "",
            "status": "IN_PROGRESS",
            "priority": "MEDIUM",
            "externalUrl": f"plane://{slug}/projects/{project.id}/modules/{module_issue.module.id}" if module_issue else "",
        }
        resp = dapd_api("POST", f"/api/layer-p/projects/{dapd_project_id}/epics", epic_data)
        if resp and resp.status_code == 201:
            result = resp.json()
            dapd_epic_id = result.get("data", result).get("id") if isinstance(result, dict) else None
            logger.info(f"[DAPD] Tao epic '{epic_name}' → id={dapd_epic_id}")
        else:
            logger.error(f"[DAPD] Khong tao duoc epic: {resp.text if resp else 'no response'}")
            return

    # === Bước 3: Tạo Backlog ===
    backlog_name = issue.name
    resp = dapd_api("GET", f"/api/layer-p/epics/{dapd_epic_id}/backlogs")
    backlogs_list = []
    if resp and resp.status_code == 200:
        bl_data = resp.json()
        backlogs_list = bl_data.get("data", bl_data) if isinstance(bl_data, dict) else bl_data
        if not isinstance(backlogs_list, list):
            backlogs_list = []

    dapd_backlog_id = None
    for b in backlogs_list:
        ext_url = b.get("externalUrl") or b.get("external_url") or ""
        if str(issue.id) in ext_url:
            dapd_backlog_id = b.get("id")
            break

    # Lấy sprint name từ cycle
    sprint_name = None
    from plane.db.models import CycleIssue
    cycle_issue = CycleIssue.objects.filter(issue_id=issue_id).select_related("cycle").first()
    if cycle_issue:
        sprint_name = cycle_issue.cycle.name

    if not dapd_backlog_id:
        backlog_data = {
            "name": backlog_name,
            "description": "",
            "priority": priority,
            "status": status,
            "storyPoint": issue.estimate_point,
            "sprint": sprint_name,
            "externalUrl": f"plane://{slug}/projects/{project.id}/issues/{issue.id}",
        }
        resp = dapd_api("POST", f"/api/layer-p/epics/{dapd_epic_id}/backlogs", backlog_data)
        if resp and resp.status_code == 201:
            result = resp.json()
            dapd_backlog_id = result.get("data", result).get("id") if isinstance(result, dict) else None
            logger.info(f"[DAPD] Tao backlog '{backlog_name}' → id={dapd_backlog_id}")
        else:
            logger.error(f"[DAPD] Khong tao duoc backlog: {resp.text if resp else 'no response'}")
            return
    elif verb == "updated":
        # Cập nhật backlog nếu issue đã tồn tại
        update_data = {
            "name": backlog_name,
            "description": "",
            "priority": priority,
            "status": status,
            "storyPoint": issue.estimate_point,
            "sprint": sprint_name,
            "externalUrl": f"plane://{slug}/projects/{project.id}/issues/{issue.id}",
        }
        dapd_api("PUT", f"/api/layer-p/backlogs/{dapd_backlog_id}", update_data)

    # === Bước 4: Tạo Task ===
    resp = dapd_api("GET", f"/api/layer-p/backlogs/{dapd_backlog_id}/tasks")
    tasks_list = []
    if resp and resp.status_code == 200:
        t_data = resp.json()
        tasks_list = t_data.get("data", t_data) if isinstance(t_data, dict) else t_data
        if not isinstance(tasks_list, list):
            tasks_list = []

    dapd_task_id = None
    for t in tasks_list:
        ext_url = t.get("externalUrl") or t.get("external_url") or ""
        if str(issue.id) in ext_url:
            dapd_task_id = t.get("id")
            break

    if not dapd_task_id:
        task_data = {
            "name": issue.name,
            "description": "",
            "taskType": task_type,
            "status": status,
            "priority": priority,
            "sprint": sprint_name,
            "externalUrl": f"plane-task://{slug}/issues/{issue.id}",
        }
        resp = dapd_api("POST", f"/api/layer-p/backlogs/{dapd_backlog_id}/tasks", task_data)
        if resp and resp.status_code == 201:
            result = resp.json()
            dapd_task_id = result.get("data", result).get("id") if isinstance(result, dict) else None
            logger.info(f"[DAPD] Tao task '{issue.name}' → id={dapd_task_id}")
        else:
            logger.error(f"[DAPD] Khong tao duoc task: {resp.text if resp else 'no response'}")
            return
    elif verb == "updated":
        update_data = {
            "name": issue.name,
            "description": "",
            "taskType": task_type,
            "status": status,
            "priority": priority,
            "sprint": sprint_name,
            "externalUrl": f"plane-task://{slug}/issues/{issue.id}",
        }
        dapd_api("PUT", f"/api/layer-p/tasks/{dapd_task_id}", update_data)

    # === Bước 5: Kích hoạt chuỗi biến đổi DAPD (chỉ khi tạo mới) ===
    if verb == "created" and dapd_task_id:
        logger.info(f"[DAPD] Kich hoat chuoi bien doi cho task {dapd_task_id}")

        # h(A→O): Tạo Artifact từ Task
        resp = dapd_api("POST", f"/api/dapd/transform/create-artifact?taskId={dapd_task_id}")
        if resp and resp.status_code == 201:
            result = resp.json()
            artifact_data = result.get("data", result)
            artifact_id = artifact_data.get("id") if isinstance(artifact_data, dict) else None
            logger.info(f"[DAPD] h(A→O): Task {dapd_task_id} → Artifact {artifact_id}")

            if artifact_id:
                # f(O→S): Phân tích ảnh hưởng kiến trúc
                resp2 = dapd_api("POST", f"/api/dapd/transform/analyze-impact?artifactId={artifact_id}")
                if resp2 and resp2.status_code in [200, 201]:
                    logger.info(f"[DAPD] f(O→S): Artifact {artifact_id} → Phan tich kien truc")

                # g(S→P): Tạo execution pipeline
                resp3 = dapd_api("POST", f"/api/dapd/transform/create-execution?artifactId={artifact_id}")
                if resp3 and resp3.status_code in [200, 201]:
                    logger.info(f"[DAPD] g(S→P): Artifact {artifact_id} → Pipeline execution")
        else:
            logger.warning(f"[DAPD] h(A→O) that bai: {resp.text if resp else 'no response'}")

    logger.info(f"[DAPD] Hoan tat dong bo issue '{issue.name}' ({verb})")


@shared_task
def dapd_sync_project(project_id, verb="created", slug=None):
    """Đồng bộ project từ Plane sang DAPD Engine"""
    if not DAPD_ENABLED:
        return

    try:
        project = Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        return

    project_data = {
        "name": project.name,
        "description": project.description or "",
        "owner": "Plane PM",
        "status": "ACTIVE",
        "externalUrl": f"plane://{slug}/projects/{project.id}",
    }

    if verb == "created":
        resp = dapd_api("POST", "/api/layer-p/projects", project_data)
        if resp and resp.status_code == 201:
            logger.info(f"[DAPD] Tao project '{project.name}' thanh cong")
    elif verb == "updated":
        # Tìm project theo external_url
        resp = dapd_api("GET", "/api/layer-p/projects")
        if resp and resp.status_code == 200:
            projects = resp.json()
            plist = projects.get("data", projects) if isinstance(projects, dict) else projects
            for p in (plist if isinstance(plist, list) else []):
                ext = p.get("externalUrl") or p.get("external_url") or ""
                if str(project.id) in ext:
                    dapd_api("PUT", f"/api/layer-p/projects/{p['id']}", project_data)
                    break
