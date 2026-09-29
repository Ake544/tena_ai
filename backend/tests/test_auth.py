import pytest


class TestSignup:
    def test_signup_success(self, client):
        response = client.post("/auth/signup", json={
            "full_name": "New User",
            "email": "new@example.com",
            "password": "StrongPass123!",
        })
        assert response.status_code == 200
        assert "message" in response.json()

    def test_signup_duplicate_email(self, client, verified_user):
        response = client.post("/auth/signup", json={
            "full_name": "Duplicate",
            "email": "test@example.com",
            "password": "StrongPass123!",
        })
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]

    def test_signup_missing_fields(self, client):
        response = client.post("/auth/signup", json={
            "email": "missing@example.com",
        })
        assert response.status_code == 422


class TestLogin:
    def test_login_success(self, client, verified_user):
        response = client.post("/auth/login", json={
            "email": "test@example.com",
            "password": "TestPass123!",
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client, verified_user):
        response = client.post("/auth/login", json={
            "email": "test@example.com",
            "password": "WrongPassword!",
        })
        assert response.status_code == 401
        assert "Invalid email or password" in response.json()["detail"]

    def test_login_nonexistent_user(self, client):
        response = client.post("/auth/login", json={
            "email": "nobody@example.com",
            "password": "TestPass123!",
        })
        assert response.status_code == 401

    def test_login_unverified_email(self, client, unverified_user):
        response = client.post("/auth/login", json={
            "email": "unverified@example.com",
            "password": "TestPass123!",
        })
        assert response.status_code == 403
        assert "Email not verified" in response.json()["detail"]

    def test_login_returns_token_type(self, client, verified_user):
        response = client.post("/auth/login", json={
            "email": "test@example.com",
            "password": "TestPass123!",
        })
        assert response.json()["token_type"] == "bearer"


class TestVerifyEmail:
    def test_verify_with_stored_otp(self, client, unverified_user, db):
        from unittest.mock import patch, MagicMock
        with patch("app.routers.auth.get_redis") as mock_redis:
            mock_r = MagicMock()
            def fake_get(key):
                if key == "otp:unverified@example.com":
                    return "123456"
                return None
            mock_r.get.side_effect = fake_get
            mock_r.incr.return_value = 1
            mock_r.exists.return_value = False
            mock_redis.return_value = mock_r

            response = client.post("/auth/verify-email", json={
                "email": "unverified@example.com",
                "otp": "123456",
            })
            assert response.status_code == 200
            assert "verified" in response.json()["message"].lower()

    def test_verify_wrong_otp(self, client, unverified_user):
        from unittest.mock import patch, MagicMock
        with patch("app.routers.auth.get_redis") as mock_redis:
            mock_r = MagicMock()
            def fake_get(key):
                if key == "otp:unverified@example.com":
                    return "123456"
                return None
            mock_r.get.side_effect = fake_get
            mock_r.incr.return_value = 1
            mock_r.exists.return_value = False
            mock_redis.return_value = mock_r

            response = client.post("/auth/verify-email", json={
                "email": "unverified@example.com",
                "otp": "000000",
            })
            assert response.status_code == 400

    def test_verify_nonexistent_user(self, client):
        from unittest.mock import patch, MagicMock
        with patch("app.routers.auth.get_redis") as mock_redis:
            mock_r = MagicMock()
            def fake_get(key):
                if key == "otp:ghost@example.com":
                    return "123456"
                return None
            mock_r.get.side_effect = fake_get
            mock_r.incr.return_value = 1
            mock_r.exists.return_value = False
            mock_redis.return_value = mock_r

            response = client.post("/auth/verify-email", json={
                "email": "ghost@example.com",
                "otp": "123456",
            })
            assert response.status_code == 404


class TestRefreshToken:
    def test_refresh_success(self, client, verified_user):
        from app.core.security import create_refresh_token
        token = create_refresh_token(data={"sub": str(verified_user.id)})
        response = client.post(f"/auth/refresh?refresh_token={token}")
        assert response.status_code == 200
        assert "access_token" in response.json()

    def test_refresh_invalid_token(self, client):
        response = client.post("/auth/refresh?refresh_token=invalid.token.here")
        assert response.status_code == 401

    def test_refresh_access_token_rejected(self, client, verified_user):
        from app.core.security import create_access_token
        token = create_access_token(data={"sub": str(verified_user.id)})
        response = client.post(f"/auth/refresh?refresh_token={token}")
        assert response.status_code == 401


class TestForgotPassword:
    def test_forgot_password_success(self, client, verified_user):
        from unittest.mock import patch, MagicMock
        with patch("app.routers.auth.get_redis") as mock_redis:
            mock_r = MagicMock()
            mock_r.get.return_value = None
            mock_r.incr.return_value = 1
            mock_r.exists.return_value = False
            mock_redis.return_value = mock_r

            response = client.post("/auth/forgot-password", json={
                "email": "test@example.com",
            })
            assert response.status_code == 200

    def test_forgot_password_nonexistent_email(self, client):
        from unittest.mock import patch, MagicMock
        with patch("app.routers.auth.get_redis") as mock_redis:
            mock_r = MagicMock()
            mock_r.get.return_value = None
            mock_r.incr.return_value = 1
            mock_r.exists.return_value = False
            mock_redis.return_value = mock_r

            response = client.post("/auth/forgot-password", json={
                "email": "ghost@example.com",
            })
            assert response.status_code == 200
