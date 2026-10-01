import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return new NextResponse('Video ID is required', { status: 400 });
  }

  try {
    const { stdout } = await execAsync(`yt-dlp -f bestaudio --get-url "https://www.youtube.com/watch?v=${videoId}"`);
    const streamUrl = stdout.trim();

    if (!streamUrl) {
      return new NextResponse('No audio stream found', { status: 404 });
    }

    // Forward the Range header from the client (Chromium) to YouTube!
    const rangeHeader = request.headers.get('range');
    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };
    
    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader;
    }

    const response = await fetch(streamUrl, {
      headers: fetchHeaders
    });

    // Create a new response with the EXACT same headers that YouTube returned, including 206 Partial Content!
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', response.headers.get('Content-Type') || 'audio/webm');
    responseHeaders.set('Accept-Ranges', 'bytes');
    
    if (response.headers.has('Content-Length')) {
        responseHeaders.set('Content-Length', response.headers.get('Content-Length')!);
    }
    if (response.headers.has('Content-Range')) {
        responseHeaders.set('Content-Range', response.headers.get('Content-Range')!);
    }

    // Proxy the binary stream
    return new NextResponse(response.body, {
      status: response.status, // This correctly passes 206 Partial Content back to Chromium!
      headers: responseHeaders
    });

  } catch (error) {
    console.error('Error proxying YouTube stream:', error);
    return new NextResponse('Failed to proxy stream', { status: 500 });
  }
}
