"""
Image processing service — Pillow + OpenCV operations.
Handles: resize, crop, rotate, filters, compositing, format conversion,
         base64 encode/decode, and pen stroke rasterization.
"""
import base64
import io
from typing import Literal

import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps


# ── Helpers ───────────────────────────────────────────────────────────────────

def bytes_to_pil(data: bytes) -> Image.Image:
    return Image.open(io.BytesIO(data)).convert("RGBA")


def pil_to_bytes(img: Image.Image, fmt: str = "PNG") -> bytes:
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return buf.getvalue()


def base64_to_bytes(b64: str) -> bytes:
    if "," in b64:
        b64 = b64.split(",", 1)[1]
    return base64.b64decode(b64)


def bytes_to_base64(data: bytes, mime: str = "image/png") -> str:
    return f"data:{mime};base64," + base64.b64encode(data).decode()


def pil_to_cv(img: Image.Image) -> np.ndarray:
    return cv2.cvtColor(np.array(img.convert("RGBA")), cv2.COLOR_RGBA2BGRA)


def cv_to_pil(arr: np.ndarray) -> Image.Image:
    return Image.fromarray(cv2.cvtColor(arr, cv2.COLOR_BGRA2RGBA))


# ── Core operations ───────────────────────────────────────────────────────────

def resize_image(image_bytes: bytes, width: int, height: int, fit: Literal["cover", "contain", "fill"] = "fill") -> bytes:
    img = bytes_to_pil(image_bytes)
    if fit == "fill":
        img = img.resize((width, height), Image.LANCZOS)
    elif fit == "contain":
        img.thumbnail((width, height), Image.LANCZOS)
        background = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        offset = ((width - img.width) // 2, (height - img.height) // 2)
        background.paste(img, offset, img)
        img = background
    elif fit == "cover":
        img = ImageOps.fit(img, (width, height), Image.LANCZOS)
    return pil_to_bytes(img)


def crop_image(image_bytes: bytes, x: int, y: int, width: int, height: int) -> bytes:
    img = bytes_to_pil(image_bytes)
    cropped = img.crop((x, y, x + width, y + height))
    return pil_to_bytes(cropped)


def rotate_image(image_bytes: bytes, angle: float, expand: bool = True) -> bytes:
    img = bytes_to_pil(image_bytes)
    rotated = img.rotate(angle, expand=expand, resample=Image.BICUBIC)
    return pil_to_bytes(rotated)


def flip_image(image_bytes: bytes, direction: Literal["horizontal", "vertical"]) -> bytes:
    img = bytes_to_pil(image_bytes)
    if direction == "horizontal":
        img = ImageOps.mirror(img)
    else:
        img = ImageOps.flip(img)
    return pil_to_bytes(img)


# ── Filters / adjustments ─────────────────────────────────────────────────────

def adjust_image(
    image_bytes: bytes,
    brightness: float = 1.0,
    contrast: float = 1.0,
    saturation: float = 1.0,
    sharpness: float = 1.0,
) -> bytes:
    img = bytes_to_pil(image_bytes)
    rgb = img.convert("RGB")
    rgb = ImageEnhance.Brightness(rgb).enhance(brightness)
    rgb = ImageEnhance.Contrast(rgb).enhance(contrast)
    rgb = ImageEnhance.Color(rgb).enhance(saturation)
    rgb = ImageEnhance.Sharpness(rgb).enhance(sharpness)
    # Reapply alpha
    result = Image.new("RGBA", img.size)
    result.paste(rgb, mask=img.split()[3] if img.mode == "RGBA" else None)
    return pil_to_bytes(result)


def apply_filter(
    image_bytes: bytes,
    filter_name: Literal["blur", "sharpen", "emboss", "edge_enhance", "grayscale", "sepia"],
) -> bytes:
    img = bytes_to_pil(image_bytes)

    if filter_name == "grayscale":
        img = ImageOps.grayscale(img).convert("RGBA")
    elif filter_name == "sepia":
        gray = ImageOps.grayscale(img)
        sepia = Image.merge("RGB", [
            gray.point(lambda p: min(255, int(p * 1.08))),
            gray.point(lambda p: min(255, int(p * 0.93))),
            gray.point(lambda p: min(255, int(p * 0.69))),
        ])
        img = sepia.convert("RGBA")
    elif filter_name == "blur":
        img = img.filter(ImageFilter.GaussianBlur(radius=3))
    elif filter_name == "sharpen":
        img = img.filter(ImageFilter.SHARPEN)
    elif filter_name == "emboss":
        img = img.filter(ImageFilter.EMBOSS)
    elif filter_name == "edge_enhance":
        img = img.filter(ImageFilter.EDGE_ENHANCE_MORE)

    return pil_to_bytes(img)


# ── Compositing ───────────────────────────────────────────────────────────────

def composite_layers(layers: list[dict]) -> bytes:
    """
    Composite multiple image layers into one.
    Each layer: {"image_bytes": bytes, "x": int, "y": int, "opacity": float}
    Layers are composited in order (first = bottom).
    """
    if not layers:
        raise ValueError("At least one layer is required")

    base = bytes_to_pil(layers[0]["image_bytes"])
    canvas = Image.new("RGBA", base.size, (0, 0, 0, 0))
    canvas.paste(base, (layers[0].get("x", 0), layers[0].get("y", 0)), base)

    for layer in layers[1:]:
        img = bytes_to_pil(layer["image_bytes"])
        opacity = int(layer.get("opacity", 1.0) * 255)
        r, g, b, a = img.split()
        a = a.point(lambda p: int(p * opacity / 255))
        img.putalpha(a)
        canvas.paste(img, (layer.get("x", 0), layer.get("y", 0)), img)

    return pil_to_bytes(canvas)


# ── Pen / path rasterization ──────────────────────────────────────────────────

def rasterize_pen_path(
    points: list[dict],
    canvas_width: int,
    canvas_height: int,
    color: tuple[int, int, int, int] = (0, 0, 0, 255),
    brush_size: int = 5,
    smoothing: bool = True,
) -> bytes:
    """
    Rasterize a pen/brush stroke from a list of {x, y} points using OpenCV.
    Returns a transparent PNG with just the stroke rendered on it.
    """
    canvas = np.zeros((canvas_height, canvas_width, 4), dtype=np.uint8)

    if len(points) < 2:
        if points:
            cx, cy = int(points[0]["x"]), int(points[0]["y"])
            cv2.circle(canvas, (cx, cy), brush_size // 2, color, -1, cv2.LINE_AA)
        return pil_to_bytes(cv_to_pil(canvas))

    pts = [(int(p["x"]), int(p["y"])) for p in points]

    if smoothing and len(pts) >= 4:
        # Catmull-Rom spline smoothing via OpenCV
        smooth_pts = []
        for i in range(len(pts) - 1):
            p0 = pts[max(0, i - 1)]
            p1 = pts[i]
            p2 = pts[min(len(pts) - 1, i + 1)]
            p3 = pts[min(len(pts) - 1, i + 2)]
            for t in np.linspace(0, 1, 10):
                x = 0.5 * (
                    2 * p1[0]
                    + (-p0[0] + p2[0]) * t
                    + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t**2
                    + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t**3
                )
                y = 0.5 * (
                    2 * p1[1]
                    + (-p0[1] + p2[1]) * t
                    + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t**2
                    + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t**3
                )
                smooth_pts.append((int(x), int(y)))
        pts = smooth_pts

    for i in range(len(pts) - 1):
        cv2.line(canvas, pts[i], pts[i + 1], color, brush_size, cv2.LINE_AA)

    return pil_to_bytes(cv_to_pil(canvas))


def convert_format(image_bytes: bytes, target_format: Literal["PNG", "JPEG", "WEBP"]) -> bytes:
    img = bytes_to_pil(image_bytes)
    if target_format == "JPEG":
        img = img.convert("RGB")
    return pil_to_bytes(img, fmt=target_format)
