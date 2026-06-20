"""
Storage service — uploads images to Supabase Storage buckets.
"""
import uuid
import base64
from supabase import Client


async def upload_image_bytes(
    supabase: Client,
    bucket: str,
    user_id: str,
    image_bytes: bytes,
    content_type: str = "image/png",
    filename: str | None = None,
) -> str:
    """
    Upload raw image bytes to a Supabase storage bucket.
    Files are stored under {user_id}/{filename} to match RLS policies.
    Returns the public URL of the uploaded file.
    """
    if not filename:
        filename = f"{uuid.uuid4()}.png"

    path = f"{user_id}/{filename}"

    supabase.storage.from_(bucket).upload(
        path=path,
        file=image_bytes,
        file_options={"content-type": content_type, "upsert": "true"},
    )

    result = supabase.storage.from_(bucket).get_public_url(path)
    return result


async def upload_base64_image(
    supabase: Client,
    bucket: str,
    user_id: str,
    base64_data: str,
    content_type: str = "image/png",
    filename: str | None = None,
) -> str:
    """
    Upload a base64-encoded image string to Supabase Storage.
    Strips the data-URI prefix if present.
    """
    if "," in base64_data:
        base64_data = base64_data.split(",", 1)[1]

    image_bytes = base64.b64decode(base64_data)
    return await upload_image_bytes(supabase, bucket, user_id, image_bytes, content_type, filename)


async def delete_file(supabase: Client, bucket: str, path: str) -> None:
    """Remove a file from a storage bucket."""
    supabase.storage.from_(bucket).remove([path])
