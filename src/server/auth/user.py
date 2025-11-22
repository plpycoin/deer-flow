# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

from dataclasses import dataclass
from typing import Optional


@dataclass
class User:
    """User data model compatible with Casdoor user schema."""
    id: str
    username: str
    email: str
    display_name: str
    avatar: Optional[str] = None
    phone: Optional[str] = None
    created_time: Optional[str] = None

    def to_dict(self) -> dict:
        """Convert User to dictionary."""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "display_name": self.display_name,
            "avatar": self.avatar,
            "phone": self.phone,
            "created_time": self.created_time,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "User":
        """Create User from dictionary."""
        return cls(
            id=data.get("id", ""),
            username=data.get("username", ""),
            email=data.get("email", ""),
            display_name=data.get("display_name", ""),
            avatar=data.get("avatar"),
            phone=data.get("phone"),
            created_time=data.get("createdTime"),
        )

    @classmethod
    def from_casdoor_user(cls, casdoor_user: dict) -> "User":
        """Create User from Casdoor user data."""
        return cls(
            id=casdoor_user.get("id", ""),
            username=casdoor_user.get("name", ""),
            email=casdoor_user.get("email", ""),
            display_name=casdoor_user.get("displayName", casdoor_user.get("name", "")),
            avatar=casdoor_user.get("avatar"),
            phone=casdoor_user.get("phone"),
            created_time=casdoor_user.get("createdTime"),
        )