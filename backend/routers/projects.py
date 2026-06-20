"""
Projects router — full CRUD for canvas projects.
All routes are protected: requires a valid Supabase JWT.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from core.auth import CurrentUser
from core.supabase_client import get_supabase
from schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListResponse

router = APIRouter()


@router.get("", response_model=ProjectListResponse)
async def list_projects(
    user: CurrentUser,
    db: Client = Depends(get_supabase),
):
    """List all non-deleted projects for the authenticated user."""
    result = (
        db.table("projects")
        .select("*")
        .eq("user_id", user.user_id)
        .is_("deleted_at", "null")
        .order("updated_at", desc=True)
        .execute()
    )
    projects = result.data or []
    return ProjectListResponse(projects=projects, total=len(projects))


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    body: ProjectCreate,
    user: CurrentUser,
    db: Client = Depends(get_supabase),
):
    """Create a new canvas project for the authenticated user."""
    result = (
        db.table("projects")
        .insert({
            "user_id": user.user_id,
            "name": body.name,
            "description": body.description,
            "width": body.width,
            "height": body.height,
            "canvas_data": {},
        })
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create project")
    return result.data[0]


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: UUID,
    user: CurrentUser,
    db: Client = Depends(get_supabase),
):
    """Fetch a single project by ID. Only the owner can access it."""
    result = (
        db.table("projects")
        .select("*")
        .eq("id", str(project_id))
        .eq("user_id", user.user_id)
        .is_("deleted_at", "null")
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Project not found")
    return result.data


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    body: ProjectUpdate,
    user: CurrentUser,
    db: Client = Depends(get_supabase),
):
    """
    Update project fields. Used to auto-save canvas_data from the editor.
    Only sends non-null fields from the request body.
    """
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = (
        db.table("projects")
        .update(updates)
        .eq("id", str(project_id))
        .eq("user_id", user.user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Project not found or unauthorized")
    return result.data[0]


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: UUID,
    user: CurrentUser,
    db: Client = Depends(get_supabase),
):
    """Soft-delete a project by setting deleted_at timestamp."""
    from datetime import datetime, timezone
    result = (
        db.table("projects")
        .update({"deleted_at": datetime.now(timezone.utc).isoformat()})
        .eq("id", str(project_id))
        .eq("user_id", user.user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Project not found or unauthorized")
