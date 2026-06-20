from uuid import UUID
from typing import Any
from datetime import datetime
from pydantic import BaseModel, Field


# ── Request schemas ───────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    name: str = Field(default="Untitled Project", max_length=200)
    description: str | None = None
    width: int = Field(default=1200, ge=100, le=8000)
    height: int = Field(default=1200, ge=100, le=8000)


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=200)
    description: str | None = None
    canvas_data: dict[str, Any] | None = None
    thumbnail_url: str | None = None


# ── Response schemas ──────────────────────────────────────────────────────────

class ProjectResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    description: str | None
    canvas_data: dict[str, Any]
    thumbnail_url: str | None
    width: int
    height: int
    created_at: datetime
    updated_at: datetime


class ProjectListResponse(BaseModel):
    projects: list[ProjectResponse]
    total: int
