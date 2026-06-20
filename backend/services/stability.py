"""
Stability AI service — calls the Stability AI REST API v1 directly via httpx.
Handles: text-to-image, image-to-image, inpaint, upscale, remove-background.
"""
import base64
import uuid
import httpx
from core.config import settings

STABILITY_HOST = "https://api.stability.ai"


def _auth_headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.stability_api_key}",
        "Accept": "application/json",
    }


async def text_to_image(
    prompt: str,
    negative_prompt: str | None,
    width: int,
    height: int,
    steps: int,
    cfg_scale: float,
) -> tuple[bytes, str]:
    """
    Generate an image from a text prompt.
    Returns (image_bytes, content_type).
    """
    async with httpx.AsyncClient(timeout=60.0) as client:
        payload = {
            "text_prompts": [{"text": prompt, "weight": 1.0}],
            "width": width,
            "height": height,
            "steps": steps,
            "cfg_scale": cfg_scale,
            "samples": 1,
        }
        if negative_prompt:
            payload["text_prompts"].append({"text": negative_prompt, "weight": -1.0})

        response = client.post(
            f"{STABILITY_HOST}/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
            headers=_auth_headers(),
            json=payload,
        )
        response = await client.post(
            f"{STABILITY_HOST}/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
            headers=_auth_headers(),
            json=payload,
        )
        response.raise_for_status()
        data = response.json()
        image_b64 = data["artifacts"][0]["base64"]
        return base64.b64decode(image_b64), "image/png"


async def image_to_image(
    prompt: str,
    negative_prompt: str | None,
    image_bytes: bytes,
    strength: float,
    steps: int,
    cfg_scale: float,
) -> tuple[bytes, str]:
    """
    Transform an existing image using a text prompt.
    """
    async with httpx.AsyncClient(timeout=60.0) as client:
        files = {
            "init_image": ("init.png", image_bytes, "image/png"),
        }
        data = {
            "text_prompts[0][text]": prompt,
            "text_prompts[0][weight]": "1",
            "init_image_mode": "IMAGE_STRENGTH",
            "image_strength": str(strength),
            "steps": str(steps),
            "cfg_scale": str(cfg_scale),
            "samples": "1",
        }
        if negative_prompt:
            data["text_prompts[1][text]"] = negative_prompt
            data["text_prompts[1][weight]"] = "-1"

        response = await client.post(
            f"{STABILITY_HOST}/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image",
            headers=_auth_headers(),
            data=data,
            files=files,
        )
        response.raise_for_status()
        image_b64 = response.json()["artifacts"][0]["base64"]
        return base64.b64decode(image_b64), "image/png"


async def inpaint(
    prompt: str,
    negative_prompt: str | None,
    image_bytes: bytes,
    mask_bytes: bytes,
) -> tuple[bytes, str]:
    """
    Fill a masked region of an image with AI-generated content.
    White pixels in mask = replace. Black pixels = keep.
    """
    async with httpx.AsyncClient(timeout=60.0) as client:
        files = {
            "init_image": ("init.png", image_bytes, "image/png"),
            "mask_image": ("mask.png", mask_bytes, "image/png"),
        }
        data = {
            "text_prompts[0][text]": prompt,
            "text_prompts[0][weight]": "1",
            "mask_source": "MASK_IMAGE_WHITE",
            "samples": "1",
        }
        if negative_prompt:
            data["text_prompts[1][text]"] = negative_prompt
            data["text_prompts[1][weight]"] = "-1"

        response = await client.post(
            f"{STABILITY_HOST}/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image/masking",
            headers=_auth_headers(),
            data=data,
            files=files,
        )
        response.raise_for_status()
        image_b64 = response.json()["artifacts"][0]["base64"]
        return base64.b64decode(image_b64), "image/png"


async def upscale(image_bytes: bytes, scale: int = 2) -> tuple[bytes, str]:
    """Upscale an image using Stability AI's ESRGAN upscaler."""
    async with httpx.AsyncClient(timeout=120.0) as client:
        files = {"image": ("image.png", image_bytes, "image/png")}
        data = {"width": str(1024 * scale)}

        response = await client.post(
            f"{STABILITY_HOST}/v1/generation/esrgan-v1-x2plus/image-to-image/upscale",
            headers=_auth_headers(),
            data=data,
            files=files,
        )
        response.raise_for_status()
        image_b64 = response.json()["artifacts"][0]["base64"]
        return base64.b64decode(image_b64), "image/png"


async def remove_background(image_bytes: bytes) -> tuple[bytes, str]:
    """Remove background using Stability AI's background removal API."""
    async with httpx.AsyncClient(timeout=60.0) as client:
        files = {"image": ("image.png", image_bytes, "image/png")}

        response = await client.post(
            f"{STABILITY_HOST}/v2beta/stable-image/edit/remove-background",
            headers={**_auth_headers(), "Accept": "image/*"},
            files=files,
            data={"output_format": "png"},
        )
        response.raise_for_status()
        return response.content, "image/png"
