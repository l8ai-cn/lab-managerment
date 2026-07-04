from src.core.security import create_access_token, hash_password, verify_password


def test_password_hash_and_verify():
    hashed = hash_password("test123")
    assert verify_password("test123", hashed)
    assert not verify_password("wrong", hashed)


def test_jwt_roundtrip():
    token = create_access_token({"sub": "user-123", "role": "admin"})
    from src.core.security import decode_access_token

    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "user-123"
