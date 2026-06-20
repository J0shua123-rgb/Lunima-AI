/**
 * Centralized API client for the Lumina AI Python backend.
 * All calls include the Supabase access token for authentication.
 *
 * Usage:
 *   import { apiClient } from '@/lib/api-client'
 *   const client = apiClient(session.access_token)
 *   const result = await client.generate.textToImage({ prompt: '...' })
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

function makeHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

async function request<T>(
  token: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: makeHeaders(token),
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? `API error ${res.status}`)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Project {
  id: string
  user_id: string
  name: string
  description: string | null
  canvas_data: Record<string, unknown>
  thumbnail_url: string | null
  width: number
  height: number
  created_at: string
  updated_at: string
}

export interface GenerateResponse {
  image_url: string
  image_base64: string | null
  width: number
  height: number
}

export interface ImageOpResponse {
  image_base64: string
  width: number
  height: number
}

// ── Client factory ────────────────────────────────────────────────────────────

export function apiClient(token: string) {
  const r = <T>(method: string, path: string, body?: unknown) =>
    request<T>(token, method, path, body)

  return {
    // ── Projects ──────────────────────────────────────────────────────────────
    projects: {
      list: () =>
        r<{ projects: Project[]; total: number }>('GET', '/api/projects'),

      create: (data: { name?: string; description?: string; width?: number; height?: number }) =>
        r<Project>('POST', '/api/projects', data),

      get: (id: string) =>
        r<Project>('GET', `/api/projects/${id}`),

      update: (id: string, data: Partial<Pick<Project, 'name' | 'description' | 'canvas_data' | 'thumbnail_url'>>) =>
        r<Project>('PATCH', `/api/projects/${id}`, data),

      delete: (id: string) =>
        r<void>('DELETE', `/api/projects/${id}`),
    },

    // ── Generation ────────────────────────────────────────────────────────────
    generate: {
      textToImage: (data: {
        prompt: string
        negative_prompt?: string
        width?: number
        height?: number
        steps?: number
        cfg_scale?: number
        project_id?: string
      }) => r<GenerateResponse>('POST', '/api/generate/text-to-image', data),

      imageToImage: (data: {
        prompt: string
        image_base64: string
        strength?: number
        negative_prompt?: string
        project_id?: string
      }) => r<GenerateResponse>('POST', '/api/generate/image-to-image', data),

      inpaint: (data: {
        prompt: string
        image_base64: string
        mask_base64: string
        negative_prompt?: string
        project_id?: string
      }) => r<GenerateResponse>('POST', '/api/generate/inpaint', data),

      upscale: (data: { image_base64: string; scale?: number }) =>
        r<GenerateResponse>('POST', '/api/generate/upscale', data),

      removeBackground: (data: { image_base64: string }) =>
        r<GenerateResponse>('POST', '/api/generate/remove-background', data),
    },

    // ── AI Intelligence ───────────────────────────────────────────────────────
    ai: {
      enhancePrompt: (data: { prompt: string; style?: string }) =>
        r<{ original_prompt: string; enhanced_prompt: string; style_tags: string[] }>(
          'POST', '/api/ai/enhance-prompt', data
        ),

      suggestLayout: (data: {
        description: string
        canvas_width?: number
        canvas_height?: number
        style?: string
      }) => r<{ fabric_json: Record<string, unknown>; description: string }>(
        'POST', '/api/ai/suggest-layout', data
      ),

      describeImage: (data: { image_base64: string }) =>
        r<{ description: string; suggested_prompts: string[]; detected_colors: string[] }>(
          'POST', '/api/ai/describe-image', data
        ),
    },

    // ── Image Processing ──────────────────────────────────────────────────────
    images: {
      resize: (data: { image_base64: string; width: number; height: number; fit?: 'fill' | 'contain' | 'cover' }) =>
        r<ImageOpResponse>('POST', '/api/images/resize', data),

      crop: (data: { image_base64: string; x: number; y: number; width: number; height: number }) =>
        r<ImageOpResponse>('POST', '/api/images/crop', data),

      rotate: (data: { image_base64: string; angle: number; expand?: boolean }) =>
        r<ImageOpResponse>('POST', '/api/images/rotate', data),

      flip: (data: { image_base64: string; direction: 'horizontal' | 'vertical' }) =>
        r<ImageOpResponse>('POST', '/api/images/flip', data),

      adjust: (data: { image_base64: string; brightness?: number; contrast?: number; saturation?: number; sharpness?: number }) =>
        r<ImageOpResponse>('POST', '/api/images/adjust', data),

      filter: (data: { image_base64: string; filter_name: 'blur' | 'sharpen' | 'emboss' | 'edge_enhance' | 'grayscale' | 'sepia' }) =>
        r<ImageOpResponse>('POST', '/api/images/filter', data),

      composite: (data: { layers: Array<{ image_base64: string; x?: number; y?: number; opacity?: number }> }) =>
        r<ImageOpResponse>('POST', '/api/images/composite', data),

      penStroke: (data: {
        points: Array<{ x: number; y: number }>
        canvas_width?: number
        canvas_height?: number
        color_hex?: string
        brush_size?: number
        smoothing?: boolean
      }) => r<ImageOpResponse>('POST', '/api/images/pen-stroke', data),

      convert: (data: { image_base64: string; target_format: 'PNG' | 'JPEG' | 'WEBP' }) =>
        r<ImageOpResponse>('POST', '/api/images/convert', data),
    },
  }
}
