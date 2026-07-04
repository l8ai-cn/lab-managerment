"""实验管理 API 集成测试。"""

from __future__ import annotations

from fastapi.testclient import TestClient


def _create_experiment(client: TestClient, **overrides) -> dict:
    payload = {
        "title": "细胞培养实验",
        "description": "验证培养基配方 A 的效果",
        "priority": "high",
        "owner": "张三",
        "lab_location": "3号实验室",
        "tags": "生物,培养",
    }
    payload.update(overrides)
    resp = client.post("/api/v1/experiments", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_health(client: TestClient) -> None:
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_create_experiment_generates_code(client: TestClient) -> None:
    data = _create_experiment(client)
    assert data["id"] > 0
    assert data["code"].startswith("EXP-")
    assert data["status"] == "draft"
    assert data["priority"] == "high"
    assert data["records"] == []


def test_create_experiment_with_custom_code(client: TestClient) -> None:
    data = _create_experiment(client, code="MY-001")
    assert data["code"] == "MY-001"


def test_duplicate_code_conflict(client: TestClient) -> None:
    _create_experiment(client, code="DUP-001")
    resp = client.post(
        "/api/v1/experiments",
        json={"title": "另一个实验", "code": "DUP-001"},
    )
    assert resp.status_code == 409


def test_get_experiment_not_found(client: TestClient) -> None:
    resp = client.get("/api/v1/experiments/9999")
    assert resp.status_code == 404


def test_planned_window_validation(client: TestClient) -> None:
    resp = client.post(
        "/api/v1/experiments",
        json={
            "title": "时间校验实验",
            "planned_start_at": "2026-01-10T00:00:00Z",
            "planned_end_at": "2026-01-01T00:00:00Z",
        },
    )
    assert resp.status_code == 422


def test_update_experiment(client: TestClient) -> None:
    data = _create_experiment(client)
    resp = client.patch(
        f"/api/v1/experiments/{data['id']}",
        json={"title": "更新后的名称", "priority": "urgent"},
    )
    assert resp.status_code == 200
    updated = resp.json()
    assert updated["title"] == "更新后的名称"
    assert updated["priority"] == "urgent"
    # 未提供的字段保持不变。
    assert updated["owner"] == "张三"


def test_status_transition_flow(client: TestClient) -> None:
    data = _create_experiment(client)
    eid = data["id"]

    # draft -> in_progress:应自动记录 actual_start_at。
    resp = client.post(
        f"/api/v1/experiments/{eid}/status", json={"status": "in_progress"}
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "in_progress"
    assert resp.json()["actual_start_at"] is not None

    # in_progress -> completed:应记录 actual_end_at。
    resp = client.post(
        f"/api/v1/experiments/{eid}/status", json={"status": "completed"}
    )
    assert resp.status_code == 200
    assert resp.json()["actual_end_at"] is not None

    # completed -> archived。
    resp = client.post(
        f"/api/v1/experiments/{eid}/status", json={"status": "archived"}
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "archived"


def test_invalid_status_transition(client: TestClient) -> None:
    data = _create_experiment(client)
    eid = data["id"]
    # draft -> completed 非法。
    resp = client.post(
        f"/api/v1/experiments/{eid}/status", json={"status": "completed"}
    )
    assert resp.status_code == 422


def test_list_filtering_and_pagination(client: TestClient) -> None:
    _create_experiment(client, title="Alpha 实验", owner="张三")
    _create_experiment(client, title="Beta 实验", owner="李四")
    _create_experiment(client, title="Gamma 实验", owner="张三")

    # 按负责人过滤。
    resp = client.get("/api/v1/experiments", params={"owner": "张三"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["meta"]["total"] == 2
    assert all(item["owner"] == "张三" for item in body["items"])

    # 关键字搜索。
    resp = client.get("/api/v1/experiments", params={"keyword": "Beta"})
    assert resp.json()["meta"]["total"] == 1

    # 分页。
    resp = client.get(
        "/api/v1/experiments", params={"page": 1, "page_size": 2}
    )
    body = resp.json()
    assert body["meta"]["total"] == 3
    assert body["meta"]["pages"] == 2
    assert len(body["items"]) == 2


def test_status_filter(client: TestClient) -> None:
    d1 = _create_experiment(client, title="进行中实验")
    _create_experiment(client, title="草稿实验")
    client.post(
        f"/api/v1/experiments/{d1['id']}/status",
        json={"status": "in_progress"},
    )
    resp = client.get(
        "/api/v1/experiments", params={"status": "in_progress"}
    )
    body = resp.json()
    assert body["meta"]["total"] == 1
    assert body["items"][0]["status"] == "in_progress"


def test_delete_experiment(client: TestClient) -> None:
    data = _create_experiment(client)
    eid = data["id"]
    resp = client.delete(f"/api/v1/experiments/{eid}")
    assert resp.status_code == 204
    assert client.get(f"/api/v1/experiments/{eid}").status_code == 404


def test_experiment_records(client: TestClient) -> None:
    data = _create_experiment(client)
    eid = data["id"]

    resp = client.post(
        f"/api/v1/experiments/{eid}/records",
        json={
            "record_type": "observation",
            "content": "温度稳定在 37℃",
            "recorded_by": "王五",
        },
    )
    assert resp.status_code == 201
    assert resp.json()["record_type"] == "observation"

    resp = client.post(
        f"/api/v1/experiments/{eid}/records",
        json={"content": "第二条记录"},
    )
    assert resp.status_code == 201

    resp = client.get(f"/api/v1/experiments/{eid}/records")
    assert resp.status_code == 200
    assert len(resp.json()) == 2

    # 记录应体现在实验详情中。
    detail = client.get(f"/api/v1/experiments/{eid}").json()
    assert len(detail["records"]) == 2
