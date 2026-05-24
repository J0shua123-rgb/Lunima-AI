// route.ts - AI image generation endpoint
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ message: 'Generate endpoint' });
}
