from pydantic import BaseModel, Field


class TextToImageRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=2000, description="Text prompt describing the image to generate")
    negative_prompt: str | None = Field(default=None, max_length=1000)
    width: int = Field(default=1024, ge=512, le=2048)
    height: int = Field(default=1024, ge=512, le=2048)
    steps: int = Field(default=30, ge=10, le=50)
    cfg_scale: float = Field(default=7.0, ge=1.0, le=20.0)
    project_id: str | None = None


class ImageToImageRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=2000)
    negative_prompt: str | None = None
    image_base64: str = Field(..., description="Base64-encoded source image (PNG/JPEG)")
    strength: float = Field(default=0.75, ge=0.0, le=1.0, description="How much to transform the image (0=preserve, 1=ignore)")
    steps: int = Field(default=30, ge=10, le=50)
    cfg_scale: float = Field(default=7.0, ge=1.0, le=20.0)
    project_id: str | None = None


class InpaintRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=2000)
    negative_prompt: str | None = None
    image_base64: str = Field(..., description="Base64-encoded source image")
    mask_base64: str = Field(..., description="Base64-encoded mask (white=replace, black=keep)")
    project_id: str | None = None


class UpscaleRequest(BaseModel):
    image_base64: str = Field(..., description="Base64-encoded image to upscale")
    scale: int = Field(default=2, ge=2, le=4)


class RemoveBackgroundRequest(BaseModel):
    image_base64: str = Field(..., description="Base64-encoded image")


# ── Responses ─────────────────────────────────────────────────────────────────

class GenerateResponse(BaseModel):
    image_url: str
    image_base64: str | None = None
    width: int
    height: int
    generation_id: str | None = None
