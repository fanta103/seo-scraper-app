import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return new NextResponse('Missing id', { status: 400 });

  const cached = (globalThis as any).__screenshotCache?.get(id);
  if (!cached) return new NextResponse('Screenshot not found or expired', { status: 404 });

  const buffer = Buffer.from(cached.data, 'base64');
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': cached.mimeType,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
