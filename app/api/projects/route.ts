// route.ts - CRUD for projects
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Projects endpoint' });
}
