# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

from jose import JWTError, jwt

from src.config.loader import get_str_env
from .user import User

logger = logging.getLogger(__name__)


class JWTManager:
    """JWT token management for user authentication."""

    def __init__(self):
        self.secret_key = get_str_env("JWT_SECRET_KEY", "your-secret-key-change-in-production")
        self.algorithm = get_str_env("JWT_ALGORITHM", "HS256")
        self.expire_minutes = int(get_str_env("JWT_EXPIRE_MINUTES", "10080"))  # 7 days default

        if self.secret_key == "your-secret-key-change-in-production":
            logger.warning("Using default JWT secret key. Please set JWT_SECRET_KEY in production.")

    def create_access_token(self, user: User) -> str:
        """Create JWT access token for user."""
        now = datetime.now(timezone.utc)
        expire = now + timedelta(minutes=self.expire_minutes)

        payload = {
            "userId": user.id,
            "username": user.username,
            "email": user.email,
            "exp": expire.timestamp(),
            "iat": now.timestamp(),
            "type": "access"
        }

        token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
        logger.debug(f"Created access token for user {user.username}, expires at {expire}")
        return token

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify JWT token and return payload."""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])

            # Check if token is expired
            exp = payload.get("exp")
            if exp and datetime.fromtimestamp(exp, timezone.utc) < datetime.now(timezone.utc):
                logger.debug("Token has expired")
                return None

            # Check token type
            if payload.get("type") != "access":
                logger.debug("Invalid token type")
                return None

            logger.debug("Token verified successfully")
            return payload

        except JWTError as e:
            logger.debug(f"JWT verification failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during token verification: {e}")
            return None

    def extract_user_from_token(self, token: str) -> Optional[User]:
        """Extract user information from JWT token."""
        payload = self.verify_token(token)
        if not payload:
            return None

        try:
            user = User(
                id=payload["userId"],
                username=payload["username"],
                email=payload["email"],
                display_name=payload.get("username", ""),  # Fallback to username
            )
            return user
        except KeyError as e:
            logger.error(f"Missing required field in token payload: {e}")
            return None


# Global JWT manager instance
jwt_manager = JWTManager()