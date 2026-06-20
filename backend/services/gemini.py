"""
Gemini service — design intelligence via Google Generative AI.
Handles: prompt enhancement, layout suggestions, image description.
"""
import json
import base64
import google.generativeai as genai
from core.config import settings

genai.configure(api_key=settings.gemini_api_key)

_text_model = genai.GenerativeModel("gemini-1.5-flash")
_vision_model = genai.GenerativeModel("gemini-1.5-flash")


async def enhance_prompt(raw_prompt: str, style: str | None = None) -> dict:
    """
    Take a short user prompt and expand it into a rich, detailed
    Stable Diffusion-ready prompt with style tags.
    """
    style_hint = f" The overall style should be: {style}." if style else ""

    system = (
        "You are an expert AI art director for a Photoshop-like canvas editor. "
        "Your job is to take a user's rough prompt and rewrite it as a highly detailed, "
        "vivid image generation prompt. Add lighting, composition, color palette, texture, "
        "and mood details. Also extract 3-5 short style tags."
        f"{style_hint}"
        "\n\nRespond ONLY with valid JSON in this exact shape:\n"
        '{"enhanced_prompt": "...", "style_tags": ["tag1", "tag2", ...]}'
    )

    response = _text_model.generate_content(f"{system}\n\nUser prompt: {raw_prompt}")
    text = response.text.strip()

    # Strip markdown code fences if present
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    text = text.strip()

    parsed = json.loads(text)
    return {
        "original_prompt": raw_prompt,
        "enhanced_prompt": parsed.get("enhanced_prompt", raw_prompt),
        "style_tags": parsed.get("style_tags", []),
    }


async def suggest_layout(description: str, canvas_width: int, canvas_height: int, style: str | None) -> dict:
    """
    Ask Gemini to generate a Fabric.js-compatible JSON canvas layout
    based on a natural language description.
    """
    style_hint = f" Use a {style} design style." if style else ""

    prompt = (
        f"You are an expert UI/graphic designer working with a Fabric.js canvas "
        f"({canvas_width}x{canvas_height}px).{style_hint}\n\n"
        f"Design request: {description}\n\n"
        "Generate a valid Fabric.js JSON layout with 'objects' array. Each object must have: "
        "type (rect/circle/textbox/image), left, top, width, height, fill, opacity, and relevant "
        "properties like text for textbox, rx/ry for rect, etc. "
        "Include a brief description of the design.\n\n"
        "Respond ONLY with valid JSON:\n"
        '{"description": "...", "fabric_json": {"version": "5.3.0", "objects": [...]}}'
    )

    response = _text_model.generate_content(prompt)
    text = response.text.strip()

    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    text = text.strip()

    parsed = json.loads(text)
    return {
        "description": parsed.get("description", ""),
        "fabric_json": parsed.get("fabric_json", {"version": "5.3.0", "objects": []}),
    }


async def describe_image(image_bytes: bytes) -> dict:
    """
    Use Gemini Vision to describe an image and suggest editing prompts.
    """
    image_part = {
        "mime_type": "image/png",
        "data": base64.b64encode(image_bytes).decode(),
    }

    prompt = (
        "You are an AI design assistant for a canvas editor like Photoshop or Canva. "
        "Analyze this image and provide:\n"
        "1. A detailed description of what you see\n"
        "2. Three suggested AI generation prompts to create variations or enhancements\n"
        "3. The dominant colors as hex codes (up to 5)\n\n"
        "Respond ONLY with valid JSON:\n"
        '{"description": "...", "suggested_prompts": ["...", "...", "..."], "detected_colors": ["#hex1", ...]}'
    )

    response = _vision_model.generate_content([prompt, image_part])
    text = response.text.strip()

    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    text = text.strip()

    parsed = json.loads(text)
    return {
        "description": parsed.get("description", ""),
        "suggested_prompts": parsed.get("suggested_prompts", []),
        "detected_colors": parsed.get("detected_colors", []),
    }
