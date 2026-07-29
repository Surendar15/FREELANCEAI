"""
AgentVerse — Security Module
==============================
Handles all security concerns:
  - Password hashing with native bcrypt
  - JWT token creation and verification
  - Current user extraction from request
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import bcrypt
from jose import JWTError, jwt

from app.config.settings import settings
from app.core.exceptions import AuthenticationError, TokenExpiredError
from app.utils.logger import get_logger

logger = get_logger(__name__)


# ── Password Hashing ───────────────────────────────────────────────────────

def hash_password(plain_password: str) -> str:
    """
    Hash a plaintext password using native bcrypt.
    
    Args:
        plain_password: The raw password from the user
        
    Returns:
        The bcrypt-hashed password string
    """
    pwd_bytes = plain_password.encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plaintext password against its bcrypt hash.
    
    Args:
        plain_password: The raw password to verify
        hashed_password: The stored bcrypt hash
        
    Returns:
        True if password matches, False otherwise
    """
    try:
        pwd_bytes = plain_password.encode("utf-8")
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception as exc:
        logger.warning("Password verification error", error=str(exc))
        return False


# ── JWT Token Management ───────────────────────────────────────────────────

def create_access_token(
    subject: str,
    extra_claims: Optional[Dict[str, Any]] = None,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a signed JWT access token.
    
    Args:
        subject: The token subject (usually user ID or email)
        extra_claims: Additional claims to include in the payload
        expires_delta: Custom expiration duration (default from settings)
        
    Returns:
        Signed JWT token string
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    payload: Dict[str, Any] = {
        "sub": str(subject),
        "iat": datetime.now(timezone.utc),
        "exp": expire,
        "type": "access",
    }

    if extra_claims:
        payload.update(extra_claims)

    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    logger.debug("Access token created", subject=subject, expires_at=expire.isoformat())
    return token


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decode and verify a JWT access token.
    
    Args:
        token: The JWT token string to decode
        
    Returns:
        Decoded token payload as a dictionary
        
    Raises:
        TokenExpiredError: If the token has expired
        AuthenticationError: If the token is invalid or malformed
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return payload
    except JWTError as exc:
        if "expired" in str(exc).lower():
            raise TokenExpiredError()
        logger.warning("Invalid JWT token", error=str(exc))
        raise AuthenticationError(message="Invalid or malformed access token")


def extract_token_subject(token: str) -> str:
    """
    Extract the subject (user ID) from a JWT token.
    
    Args:
        token: Valid JWT token string
        
    Returns:
        Token subject string (user ID)
        
    Raises:
        AuthenticationError: If subject is missing
    """
    payload = decode_access_token(token)
    subject = payload.get("sub")
    if not subject:
        raise AuthenticationError(message="Token is missing subject claim")
    return subject
