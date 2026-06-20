"""
Generate router — AI image generation endpoints.
Calls Stability AI REST API for all generation tasks.
"""
import base64
import uuid
from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from core.auth import CurrentUser
from core.supabase_client import get_supabase
from schemas.generate import (
    TextToImageRequest,
    ImageToImageRequest,
    InpaintRequest,
    UpscaleRequest,
    RemoveBackgroundRequest,
    GenerateResponse,
)
from services import stability, storage
from services.image_processor import base64_to_bytes, bytes_to_base64

router = APIRouter()


def _b64_to_bytes(b64: str) -> bytes:
    if "," in b64:
        b64 = b64.split(",", 1)[1]
    return base64.b64decode(b64)


async def _save_and_record(
    image_bytes: bytes,
    content_type: str,
    user_id: str,
    prompt: str,
    width: int,
    height: int,
    project_id: str | None,
    db: Client,
) -> str:
    """Upload image to storage and record in generated_images table."""
    filename = f"{uuid.uuid4()}.png"
    image_url = await storage.upload_image_bytes(
        db, "generated-images", user_id, image_bytes, content_type, filename
    )
    db.table("generated_images").insert({
        "user_id": user_id,
        "project_id": project_id,
        "prompt": prompt,
        "image_url": image_url,
        "status": "completed",
        "width": width,
        "height": height,
    }).execute()
    return image_url


@router.post("/text-to-image", response_model=GenerateResponse)
async def text_to_image(
    body: TextToImageRequest,
    user: CurrentUser,
    db: Client = Depends(get_supabase),
):
    """Generate a new image from a text prompt using Stable Diffusion XL."""
    try:
        image_bytes, content_type = await stability.text_to_image(
            prompt=body.prompt,
            negative_prompt=body.negative_prompt,
            width=body.width,
            height=body.height,
            steps=body.steps,
            cfg_scale=body.cfg_scale,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Stability AI error: {str(e)}")

    image_url = await _save_and_record(
        image_bytes, content_type, user.user_id,
        body.prompt, body.width, body.height, body.project_id, db,
    )

    return GenerateResponse(
        image_url=image_url,
        image_base64=bytes_to_base64(image_bytes),
        width=body.width,
        height=body.height,
    )


@router.post("/image-to-image", response_model=GenerateResponse)
async def image_to_image(
    body: ImageToImageRequest,
    user: CurrentUser,
    db: Client = Depends(get_supabase),
):
    """Transform an existing canvas image using a prompt."""
    source_bytes = _b64_to_bytes(body.image_base64)
    try:
        image_bytes, content_type = await stability.image_to_image(
            prompt=body.prompt,
            negative_prompt=body.negative_prompt,
            image_bytes=source_bytes,
            strength=body.strength,
            steps=body.steps,
            cfg_scale=body.cfg_scale,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Stability AI error: {str(e)}")

    image_url = await _save_and_record(
        image_bytes, content_type, user.user_id,
        body.prompt, 1024, 1024, body.project_id, db,
    )
    return GenerateResponse(
        image_url=image_url,
        image_base64=bytes_to_base64(image_bytes),
        width=1024,
        height=1024,
    )


@router.post("/inpaint", response_model=GenerateResponse)
async def inpaint(
    body: InpaintRequest,
    user: CurrentUser,
    db: Client = Depends(get_supabase),
):
    """Fill a masked region of the canvas with AI-generated content."""
    image_bytes = _b64_to_bytes(body.image_base64)
    mask_bytes = _b64_to_bytes(body.mask_base64)
    try:
        result_bytes, content_type = await stability.inpaint(
            prompt=body.prompt,
            negative_prompt=body.negative_prompt,
            image_bytes=image_bytes,
            mask_bytes=mask_bytes,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Stability AI error: {str(e)}")

    image_url = await _save_and_record(
        result_bytes, content_type, user.user_id,
        body.prompt, 1024, 1024, body.project_id, db,
    )
    return GenerateResponse(
        image_url=image_url,
        image_base64=bytes_to_base64(result_bytes),
        width=1024,
        height=1024,
    )


@router.post("/upscale", response_model=GenerateResponse)
async def upscale(
    body: UpscaleRequest,
    user: CurrentUser,
    db: Client = Depends(get_supabase),
):
    """Upscale an image using Stability AI's ESRGAN upscaler."""
    image_bytes = _b64_to_bytes(body.image_base64)
    try:
        result_bytes, content_type = await stability.upscale(image_bytes, body.scale)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Stability AI error: {str(e)}")

    filename = f"{uuid.uuid4()}.png"
    image_url = await storage.upload_image_bytes(
        db, "generated-images", user.user_id, result_bytes, content_type, filename
    )
    return GenerateResponse(
        image_url=image_url,
        image_base64=bytes_to_base64(result_bytes),
        width=1024 * body.scale,
        height=1024 * body.scale,
    )


@router.post("/remove-background", response_model=GenerateResponse)
async def remove_background(
    body: RemoveBackgroundRequest,
    user: CurrentUser,
    db: Client = Depends(get_supabase),
):
    """Remove the background from an image, returning a transparent PNG."""
    image_bytes = _b64_to_bytes(body.image_base64)
    try:
        result_bytes, content_type = await stability.remove_background(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Stability AI error: {str(e)}")

    filename = f"{uuid.uuid4()}.png"
    image_url = await storage.upload_image_bytes(
        db, "generated-images", user.user_id, result_bytes, content_type, filename
    )
    return GenerateResponse(
        image_url=image_url,
        image_base64=bytes_to_base64(result_bytes),
        width=1024,
        height=1024,
    )
