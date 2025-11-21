# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import logging
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .jwt import jwt_manager
from .user import User

logger = logging.getLogger(__name__)

# HTTP Bearer scheme for token extraction
security = HTTPBearer(auto_error=False)


async def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[User]:
    """Get current user from optional authorization header."""
    if not credentials:
        return None

    try:
        token = credentials.credentials
        user = jwt_manager.extract_user_from_token(token)
        return user
    except Exception as e:
        logger.debug(f"Error extracting user from token: {e}")
        return None


async def get_current_user_required(user: Optional[User] = Depends(get_current_user_optional)) -> User:
    """Get current user from required authorization header."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def verify_token_valid(credentials: HTTPAuthorizationCredentials = Depends(security)) -> bool:
    """Verify that the token is valid (returns True/False)."""
    if not credentials:
        return False

    try:
        payload = jwt_manager.verify_token(credentials.credentials)
        return payload is not None
    except Exception:
        return False