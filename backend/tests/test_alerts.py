import pytest
from app.models.patient import Patient


class TestGetActiveAlerts:
    def test_get_active_alerts_empty(self, client, auth_header):
        response = client.get("/alerts/active", headers=auth_header)
        assert response.status_code == 200
        assert response.json() == []

    def test_get_active_alerts_with_data(self, client, auth_header, sample_alert):
        response = client.get("/alerts/active", headers=auth_header)
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["title"] == "High Glucose"

    def test_get_active_alerts_excludes_acknowledged(self, client, auth_header, sample_alert, db):
        from app.models.alert import Alert
        alert = db.query(Alert).filter(Alert.id == sample_alert.id).first()
        alert.acknowledged = True
        db.commit()

        response = client.get("/alerts/active", headers=auth_header)
        assert response.status_code == 200
        assert len(response.json()) == 0

    def test_get_active_alerts_no_auth(self, client):
        response = client.get("/alerts/active")
        assert response.status_code == 422


class TestGetAlertHistory:
    def test_get_alert_history_empty(self, client, auth_header):
        response = client.get("/alerts/history", headers=auth_header)
        assert response.status_code == 200
        assert response.json() == []

    def test_get_alert_history_includes_acknowledged(self, client, auth_header, sample_alert, db):
        from app.models.alert import Alert
        alert = db.query(Alert).filter(Alert.id == sample_alert.id).first()
        alert.acknowledged = True
        db.commit()

        response = client.get("/alerts/history", headers=auth_header)
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_get_alert_history_limit(self, client, auth_header, db, verified_user):
        from app.models.alert import Alert
        for i in range(55):
            alert = Alert(
                patient_id=verified_user.id,
                title=f"Alert {i}",
                body=f"Body {i}",
                severity="low",
                category="test",
                acknowledged=False,
            )
            db.add(alert)
        db.commit()

        response = client.get("/alerts/history", headers=auth_header)
        assert response.status_code == 200
        assert len(response.json()) == 50


class TestAcknowledgeAlert:
    def test_acknowledge_success(self, client, auth_header, sample_alert):
        response = client.post(f"/alerts/{sample_alert.id}/acknowledge", headers=auth_header)
        assert response.status_code == 200
        assert response.json()["acknowledged"] is True

    def test_acknowledge_not_found(self, client, auth_header):
        import uuid
        fake_id = str(uuid.uuid4())
        response = client.post(f"/alerts/{fake_id}/acknowledge", headers=auth_header)
        assert response.status_code == 404

    def test_acknowledge_wrong_patient(self, client, auth_header, db):
        from app.models.alert import Alert
        from app.core.security import hash_password
        other_patient = Patient(
            full_name="Other User",
            email="other@example.com",
            password_hash=hash_password("Pass123!"),
            email_verified=True,
            language="en",
            timezone="Africa/Addis_Ababa",
        )
        db.add(other_patient)
        db.commit()
        db.refresh(other_patient)

        alert = Alert(
            patient_id=other_patient.id,
            title="Other Alert",
            body="Not yours",
            severity="low",
            category="test",
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)

        response = client.post(f"/alerts/{alert.id}/acknowledge", headers=auth_header)
        assert response.status_code == 404


class TestAcknowledgeAll:
    def test_acknowledge_all_success(self, client, auth_header, sample_alert):
        response = client.post("/alerts/acknowledge-all", headers=auth_header)
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

    def test_acknowledge_all_empty(self, client, auth_header):
        response = client.post("/alerts/acknowledge-all", headers=auth_header)
        assert response.status_code == 200

    def test_acknowledge_all_verifies(self, client, auth_header, db, verified_user):
        from app.models.alert import Alert
        for i in range(3):
            alert = Alert(
                patient_id=verified_user.id,
                title=f"Alert {i}",
                body=f"Body {i}",
                severity="low",
                category="test",
                acknowledged=False,
            )
            db.add(alert)
        db.commit()

        response = client.post("/alerts/acknowledge-all", headers=auth_header)
        assert response.status_code == 200

        response = client.get("/alerts/active", headers=auth_header)
        assert len(response.json()) == 0
