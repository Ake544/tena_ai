import pytest
from datetime import datetime, timedelta


class TestLogGlucose:
    def test_log_reading_success(self, client, auth_header):
        response = client.post("/glucose/log", json={
            "value": 120.0,
            "reading_type": "Fasting",
            "timestamp": datetime.utcnow().isoformat(),
        }, headers=auth_header)
        assert response.status_code == 200
        data = response.json()
        assert data["value"] == 120.0
        assert data["reading_type"] == "Fasting"
        assert "id" in data

    def test_log_reading_no_auth(self, client):
        response = client.post("/glucose/log", json={
            "value": 120.0,
            "reading_type": "Fasting",
            "timestamp": datetime.utcnow().isoformat(),
        })
        assert response.status_code == 422

    def test_log_reading_invalid_value_low(self, client, auth_header):
        response = client.post("/glucose/log", json={
            "value": 10.0,
            "reading_type": "Fasting",
            "timestamp": datetime.utcnow().isoformat(),
        }, headers=auth_header)
        assert response.status_code == 400
        assert "between 20 and 600" in response.json()["detail"]

    def test_log_reading_invalid_value_high(self, client, auth_header):
        response = client.post("/glucose/log", json={
            "value": 700.0,
            "reading_type": "Fasting",
            "timestamp": datetime.utcnow().isoformat(),
        }, headers=auth_header)
        assert response.status_code == 400

    def test_log_reading_invalid_type(self, client, auth_header):
        response = client.post("/glucose/log", json={
            "value": 120.0,
            "reading_type": "InvalidType",
            "timestamp": datetime.utcnow().isoformat(),
        }, headers=auth_header)
        assert response.status_code == 400
        assert "Invalid reading type" in response.json()["detail"]

    def test_log_reading_with_symptoms(self, client, auth_header):
        response = client.post("/glucose/log", json={
            "value": 150.0,
            "reading_type": "Post-Breakfast",
            "timestamp": datetime.utcnow().isoformat(),
            "symptoms": "headache, dizziness",
        }, headers=auth_header)
        assert response.status_code == 200
        assert response.json()["symptoms"] == "headache, dizziness"

    def test_log_all_reading_types(self, client, auth_header):
        types = ["Fasting", "Post-Breakfast", "Pre-Lunch", "Post-Lunch", "Pre-Dinner", "Bedtime"]
        for rt in types:
            response = client.post("/glucose/log", json={
                "value": 100.0,
                "reading_type": rt,
                "timestamp": datetime.utcnow().isoformat(),
            }, headers=auth_header)
            assert response.status_code == 200, f"Failed for type: {rt}"

    def test_log_reading_clamps_future_timestamp(self, client, auth_header):
        future = (datetime.utcnow() + timedelta(hours=2)).isoformat()
        response = client.post("/glucose/log", json={
            "value": 120.0,
            "reading_type": "Fasting",
            "timestamp": future,
        }, headers=auth_header)
        assert response.status_code == 200


class TestGetToday:
    def test_get_today_empty(self, client, auth_header):
        response = client.get("/glucose/today", headers=auth_header)
        assert response.status_code == 200
        data = response.json()
        assert "date" in data
        assert "slots" in data
        assert len(data["slots"]) == 6

    def test_get_today_with_readings(self, client, auth_header, db, verified_user):
        from app.models.glucose import GlucoseLog
        now = datetime.utcnow()
        log = GlucoseLog(
            patient_id=verified_user.id,
            value=110.0,
            reading_type="Fasting",
            timestamp=now.replace(hour=7, minute=0, second=0, microsecond=0),
            synced=True,
        )
        db.add(log)
        db.commit()

        response = client.get("/glucose/today", headers=auth_header)
        assert response.status_code == 200
        slots = response.json()["slots"]
        fasting_slot = next(s for s in slots if s["reading_type"] == "Fasting")
        assert fasting_slot["value"] == 110.0

    def test_get_today_slots_count(self, client, auth_header):
        response = client.get("/glucose/today", headers=auth_header)
        assert len(response.json()["slots"]) == 6


class TestGetHistory:
    def test_get_history_empty(self, client, auth_header):
        response = client.get("/glucose/history", headers=auth_header)
        assert response.status_code == 200
        assert "logs" in response.json()
        assert len(response.json()["logs"]) == 0

    def test_get_history_with_data(self, client, auth_header, sample_glucose_log):
        response = client.get("/glucose/history", headers=auth_header)
        assert response.status_code == 200
        assert len(response.json()["logs"]) == 1

    def test_get_history_custom_days(self, client, auth_header):
        response = client.get("/glucose/history?days=7", headers=auth_header)
        assert response.status_code == 200

    def test_get_history_invalid_days(self, client, auth_header):
        response = client.get("/glucose/history?days=100", headers=auth_header)
        assert response.status_code == 422


class TestSyncLogs:
    def test_sync_success(self, client, auth_header):
        now = datetime.utcnow().isoformat()
        response = client.post("/glucose/sync", json={
            "logs": [
                {"value": 120.0, "reading_type": "Fasting", "timestamp": now},
                {"value": 140.0, "reading_type": "Post-Breakfast", "timestamp": now},
            ]
        }, headers=auth_header)
        assert response.status_code == 200
        assert response.json()["synced"] == 2

    def test_sync_empty(self, client, auth_header):
        response = client.post("/glucose/sync", json={"logs": []}, headers=auth_header)
        assert response.status_code == 200
        assert response.json()["synced"] == 0


class TestGetStats:
    def test_get_stats_empty(self, client, auth_header):
        response = client.get("/glucose/stats", headers=auth_header)
        assert response.status_code == 200
        data = response.json()
        assert data["last_glucose"] is None
        assert data["avg_fasting"] is None
        assert data["days_logged"] == 0
        assert data["today_count"] == 0

    def test_get_stats_with_data(self, client, auth_header, sample_glucose_log):
        response = client.get("/glucose/stats", headers=auth_header)
        assert response.status_code == 200
        data = response.json()
        assert data["last_glucose"] == 120.0
        assert data["avg_fasting"] == 120.0
        assert data["today_count"] == 1
