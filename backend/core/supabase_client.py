from supabase import create_client, Client
from core.config import settings

# Service-role client: bypasses RLS — use only server-side, never expose to frontend
supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_role_key,
)


def get_supabase() -> Client:
    """Dependency injector for FastAPI routes."""
    return supabase
