import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse('Missing URL', { status: 400 });
  }

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!res.ok) {
      return new NextResponse('Failed to fetch subtitle', { status: res.status });
    }

    const srtData = await res.text();

    // Convert SRT to WebVTT format
    let vttData = 'WEBVTT\n\n';
    
    // Replace commas with periods in timestamps
    // SRT format: 00:00:01,000 --> 00:00:02,000
    // VTT format: 00:00:01.000 --> 00:00:02.000
    vttData += srtData.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');

    return new NextResponse(vttData, {
      headers: {
        'Content-Type': 'text/vtt; charset=utf-8',
        'Cache-Control': 'public, max-age=86400'
      }
    });
  } catch (err) {
    console.error('Proxy Error:', err);
    return new NextResponse('Proxy Error', { status: 500 });
  }
}
