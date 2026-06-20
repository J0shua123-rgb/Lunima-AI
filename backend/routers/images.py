"""
Images router — Pillow + OpenCV image processing endpoints.
All routes accept base64-encoded images and return base64-encoded results.
"""
import base64
from typing import Literal
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from core.auth import CurrentUser
from services import image_processor as ip

router = APIRouter()


# ── Request/Response helpers ──────────────────────────────────────────────────

class ImageOpRequest(BaseModel):
    image_base64: str = Field(..., description="Base64-encoded source image")


class ImageOpResponse(BaseModel):
    image_base64: str
    width: int
    height: int


def _encode(data: bytes) -> str:
    return "data:image/png;base64," + base64.b64encode(data).decode()


# ── Endpoints ─────────────────────────────────────────────────────────────────

class ResizeRequest(ImageOpRequest):
    width: int = Field(..., ge=1, le=8000)
    height: int = Field(..., ge=1, le=8000)
    fit: Literal["fill", "contain", "cover"] = "fill"


@router.post("/resize", response_model=ImageOpResponse)
async def resize(body: ResizeRequest, user: CurrentUser):
    """Resize an image to given dimensions with a chosen fit mode."""
    try:
        result = ip.resize_image(ip.base64_to_bytes(body.image_base64), body.width, body.height, body.fit)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return ImageOpResponse(image_base64=_encode(result), width=body.width, height=body.height)


class CropRequest(ImageOpRequest):
    x: int
    y: int
    width: int = Field(..., ge=1)
    height: int = Field(..., ge=1)


@router.post("/crop", response_model=ImageOpResponse)
async def crop(body: CropRequest, user: CurrentUser):
    """Crop a region from an image."""
    try:
        result = ip.crop_image(ip.base64_to_bytes(body.image_base64), body.x, body.y, body.width, body.height)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return ImageOpResponse(image_base64=_encode(result), width=body.width, height=body.height)


class RotateRequest(ImageOpRequest):
    angle: float = Field(..., ge=-360, le=360)
    expand: bool = True


@router.post("/rotate", response_model=ImageOpResponse)
async def rotate(body: RotateRequest, user: CurrentUser):
    """Rotate an image by the given angle in degrees."""
    try:
        result = ip.rotate_image(ip.base64_to_bytes(body.image_base64), body.angle, body.expand)
        img = ip.bytes_to_pil(result)
        w, h = img.size
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return ImageOpResponse(image_base64=_encode(result), width=w, height=h)


class FlipRequest(ImageOpRequest):
    direction: Literal["horizontal", "vertical"]


@router.post("/flip", response_model=ImageOpResponse)
async def flip(body: FlipRequest, user: CurrentUser):
    """Flip an image horizontally or vertically."""
    try:
        result = ip.flip_image(ip.base64_to_bytes(body.image_base64), body.direction)
        img = ip.bytes_to_pil(result)
        w, h = img.size
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return ImageOpResponse(image_base64=_encode(result), width=w, height=h)


class AdjustRequest(ImageOpRequest):
    brightness: float = Field(default=1.0, ge=0.0, le=3.0)
    contrast: float = Field(default=1.0, ge=0.0, le=3.0)
    saturation: float = Field(default=1.0, ge=0.0, le=3.0)
    sharpness: float = Field(default=1.0, ge=0.0, le=3.0)


@router.post("/adjust", response_model=ImageOpResponse)
async def adjust(body: AdjustRequest, user: CurrentUser):
    """Adjust brightness, contrast, saturation, and sharpness."""
    try:
        result = ip.adjust_image(
            ip.base64_to_bytes(body.image_base64),
            body.brightness, body.contrast, body.saturation, body.sharpness
        )
        img = ip.bytes_to_pil(result)
        w, h = img.size
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return ImageOpResponse(image_base64=_encode(result), width=w, height=h)


class FilterRequest(ImageOpRequest):
    filter_name: Literal["blur", "sharpen", "emboss", "edge_enhance", "grayscale", "sepia"]


@router.post("/filter", response_model=ImageOpResponse)
async def apply_filter(body: FilterRequest, user: CurrentUser):
    """Apply a named visual filter to an image."""
    try:
        result = ip.apply_filter(ip.base64_to_bytes(body.image_base64), body.filter_name)
        img = ip.bytes_to_pil(result)
        w, h = img.size
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return ImageOpResponse(image_base64=_encode(result), width=w, height=h)


class LayerItem(BaseModel):
    image_base64: str
    x: int = 0
    y: int = 0
    opacity: float = Field(default=1.0, ge=0.0, le=1.0)


class CompositeRequest(BaseModel):
    layers: list[LayerItem] = Field(..., min_length=1)


@router.post("/composite", response_model=ImageOpResponse)
async def composite(body: CompositeRequest, user: CurrentUser):
    """Composite multiple image layers into a single image."""
    try:
        layers = [
            {"image_bytes": ip.base64_to_bytes(l.image_base64), "x": l.x, "y": l.y, "opacity": l.opacity}
            for l in body.layers
        ]
        result = ip.composite_layers(layers)
        img = ip.bytes_to_pil(result)
        w, h = img.size
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return ImageOpResponse(image_base64=_encode(result), width=w, height=h)


class PenStrokePoint(BaseModel):
    x: float
    y: float


class PenStrokeRequest(BaseModel):
    points: list[PenStrokePoint] = Field(..., min_length=1)
    canvas_width: int = Field(default=1200, ge=1)
    canvas_height: int = Field(default=1200, ge=1)
    color_hex: str = Field(default="#000000")
    brush_size: int = Field(default=5, ge=1, le=200)
    smoothing: bool = True


@router.post("/pen-stroke", response_model=ImageOpResponse)
async def pen_stroke(body: PenStrokeRequest, user: CurrentUser):
    """
    Rasterize a pen/brush stroke from a list of canvas points.
    Returns a transparent PNG layer with just the stroke.
    Used when you need server-side stroke smoothing or pressure simulation.
    """
    try:
        # Parse hex color to RGBA
        hex_c = body.color_hex.lstrip("#")
        r, g, b = int(hex_c[0:2], 16), int(hex_c[2:4], 16), int(hex_c[4:6], 16)
        color = (r, g, b, 255)

        points = [{"x": p.x, "y": p.y} for p in body.points]
        result = ip.rasterize_pen_path(
            points, body.canvas_width, body.canvas_height,
            color=color, brush_size=body.brush_size, smoothing=body.smoothing
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return ImageOpResponse(image_base64=_encode(result), width=body.canvas_width, height=body.canvas_height)


class ConvertRequest(ImageOpRequest):
    target_format: Literal["PNG", "JPEG", "WEBP"]


@router.post("/convert", response_model=ImageOpResponse)
async def convert(body: ConvertRequest, user: CurrentUser):
    """Convert image to a different format (PNG, JPEG, WEBP)."""
    try:
        result = ip.convert_format(ip.base64_to_bytes(body.image_base64), body.target_format)
        img = ip.bytes_to_pil(result)
        w, h = img.size
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return ImageOpResponse(image_base64=_encode(result), width=w, height=h)
