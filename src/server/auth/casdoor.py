# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import base64
import hashlib
import json
import logging
import secrets
from typing import Optional, Dict, Any
import urllib.parse

import httpx

from src.config.loader import get_str_env
from .user import User

logger = logging.getLogger(__name__)


class CasdoorClient:
    """Casdoor OAuth client for authentication."""

    def __init__(self):
        self.client_id = get_str_env("CASDOOR_CLIENT_ID", "")
        self.client_secret = get_str_env("CASDOOR_CLIENT_SECRET", "")
        self.server_url = get_str_env("CASDOOR_SERVER_URL", "").rstrip("/")
        self.redirect_uri = get_str_env("CASDOOR_REDIRECT_URI", "")

        # Default OAuth endpoints
        self.auth_endpoint = f"{self.server_url}/login/oauth/authorize"
        self.token_endpoint = f"{self.server_url}/api/login/oauth/access_token"
        self.userinfo_endpoint = f"{self.server_url}/api/user/info"

        if not all([self.client_id, self.client_secret, self.server_url]):
            raise ValueError("Missing required Casdoor configuration. Please check CASDOOR_CLIENT_ID, CASDOOR_CLIENT_SECRET, and CASDOOR_SERVER_URL environment variables.")

    def get_auth_url(self, redirect_uri: Optional[str] = None, state: Optional[str] = None) -> str:
        """Generate Casdoor OAuth authorization URL."""
        if not state:
            state = secrets.token_urlsafe(32)

        if not redirect_uri:
            redirect_uri = self.redirect_uri

        params = {
            "client_id": self.client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "state": state,
            "scope": "openid profile email",
        }

        auth_url = f"{self.auth_endpoint}?{urllib.parse.urlencode(params)}"
        logger.debug(f"Generated auth URL: {auth_url}")
        return auth_url

    async def exchange_code_for_token(self, code: str, redirect_uri: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Exchange authorization code for access token."""
        if not redirect_uri:
            redirect_uri = self.redirect_uri

        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri,
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(self.token_endpoint, data=data)
                response.raise_for_status()

                token_data = response.json()
                logger.debug(f"Successfully exchanged code for token")
                return token_data

        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error exchanging code for token: {e.response.status_code} - {e.response.text}")
            return None
        except httpx.RequestError as e:
            logger.error(f"Request error exchanging code for token: {e}")
            return None
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error exchanging code for token: {e}")
            return None

    async def get_user_info(self, access_token: str) -> Optional[User]:
        """Get user information using access token."""
        headers = {
            "Authorization": f"Bearer {access_token}",
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(self.userinfo_endpoint, headers=headers)
                response.raise_for_status()

                user_data = response.json()

                # Casdoor API may return user data directly or nested
                if "data" in user_data:
                    user_data = user_data["data"]

                user = User.from_casdoor_user(user_data)
                logger.debug(f"Successfully retrieved user info for {user.username}")
                return user

        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error getting user info: {e.response.status_code} - {e.response.text}")
            return None
        except httpx.RequestError as e:
            logger.error(f"Request error getting user info: {e}")
            return None
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error getting user info: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error getting user info: {e}")
            return None

    async def complete_oauth_flow(self, code: str, redirect_uri: Optional[str] = None) -> Optional[User]:
        """Complete the OAuth flow: exchange code for token and get user info."""
        token_data = await self.exchange_code_for_token(code, redirect_uri)
        if not token_data:
            logger.error("Failed to exchange code for token")
            return None

        access_token = token_data.get("access_token")
        if not access_token:
            logger.error("No access token in response")
            return None

        user = await self.get_user_info(access_token)
        if not user:
            logger.error("Failed to get user info")
            return None

        return user

    def get_logout_url(self, redirect_uri: Optional[str] = None) -> str:
        """Generate Casdoor logout URL."""
        params = {}
        if redirect_uri:
            params["redirect_uri"] = redirect_uri

        logout_url = f"{self.server_url}/logout"
        if params:
            logout_url += f"?{urllib.parse.urlencode(params)}"

        return logout_url


# Global Casdoor client instance
casdoor_client = CasdoorClient()