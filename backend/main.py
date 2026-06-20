import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from routers import projects, generate, images, ai

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("lumina-ai")

app = FastAPI(
    title="Lumina AI Backend",
    description="Python FastAPI backend for the Lumina AI canvas editor",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(generate.router, prefix="/api/generate", tags=["generate"])
app.include_router(images.router,   prefix="/api/images",   tags=["images"])
app.include_router(ai.router,       prefix="/api/ai",       tags=["ai"])


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["health"])
async def health():
    return {
        "status": "ok",
        "service": "lumina-ai-backend",
        "stability_configured": bool(settings.stability_api_key),
        "gemini_configured": bool(settings.gemini_api_key),
    }


# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    logger.info("🚀 Lumina AI backend starting...")
    logger.info(f"  Stability AI key: {'✅ set' if settings.stability_api_key else '❌ missing'}")
    logger.info(f"  Gemini API key:   {'✅ set' if settings.gemini_api_key else '❌ missing'}")
    logger.info(f"  Supabase URL:     {settings.supabase_url}")
    logger.info(f"  CORS origin:      {settings.frontend_url}")
    logger.info("  Docs available at: http://localhost:8000/docs")
