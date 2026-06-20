from pydantic import BaseModel, Field


class EnhancePromptRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=1000, description="Raw user prompt to enhance")
    style: str | None = Field(default=None, description="Design style hint e.g. 'minimalist', 'vibrant', 'dark'")


class EnhancePromptResponse(BaseModel):
    original_prompt: str
    enhanced_prompt: str
    style_tags: list[str] = []


class SuggestLayoutRequest(BaseModel):
    description: str = Field(..., min_length=5, max_length=1000, description="Description of the design to create")
    canvas_width: int = Field(default=1200)
    canvas_height: int = Field(default=1200)
    style: str | None = None


class SuggestLayoutResponse(BaseModel):
    fabric_json: dict
    description: str


class DescribeImageRequest(BaseModel):
    image_base64: str = Field(..., description="Base64-encoded image to describe")


class DescribeImageResponse(BaseModel):
    description: str
    suggested_prompts: list[str] = []
    detected_colors: list[str] = []
