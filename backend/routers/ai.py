"""
AI router — design intelligence powered by Gemini.
Handles: prompt enhancement, layout suggestion, image description.
"""
from fastapi import APIRouter, HTTPException

from core.auth import CurrentUser
from schemas.ai import (
    EnhancePromptRequest, EnhancePromptResponse,
    SuggestLayoutRequest, SuggestLayoutResponse,
    DescribeImageRequest, DescribeImageResponse,
)
from services import gemini
from services.image_processor import base64_to_bytes

router = APIRouter()


@router.post("/enhance-prompt", response_model=EnhancePromptResponse)
async def enhance_prompt(
    body: EnhancePromptRequest,
    user: CurrentUser,
):
    """
    Enhance a short user prompt into a detailed, Stable Diffusion-ready prompt.
    Returns the enhanced prompt and style tags.
    """
    try:
        result = await gemini.enhance_prompt(body.prompt, body.style)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini error: {str(e)}")
    return EnhancePromptResponse(**result)


@router.post("/suggest-layout", response_model=SuggestLayoutResponse)
async def suggest_layout(
    body: SuggestLayoutRequest,
    user: CurrentUser,
):
    """
    Generate a Fabric.js canvas layout from a natural language description.
    The returned fabric_json can be loaded directly into the canvas editor.
    """
    try:
        result = await gemini.suggest_layout(
            body.description,
            body.canvas_width,
            body.canvas_height,
            body.style,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini error: {str(e)}")
    return SuggestLayoutResponse(**result)


@router.post("/describe-image", response_model=DescribeImageResponse)
async def describe_image(
    body: DescribeImageRequest,
    user: CurrentUser,
):
    """
    Use Gemini Vision to analyze an image and return a description,
    suggested generation prompts, and detected color palette.
    """
    try:
        image_bytes = base64_to_bytes(body.image_base64)
        result = await gemini.describe_image(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini error: {str(e)}")
    return DescribeImageResponse(**result)
