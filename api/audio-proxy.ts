import type { VercelRequest, VercelResponse } from '@vercel/node';
import ytdl from '@distube/ytdl-core';

const MAX_BYTES = 500 * 1024; // 500KB
const TIMEOUT_MS = 8000;

function isValidYouTubeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      ['www.youtube.com', 'youtube.com', 'm.youtube.com', 'youtu.be'].includes(parsed.hostname)
    );
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = req.query.url as string | undefined;

  if (!url || !isValidYouTubeUrl(url)) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const stream = ytdl(url, {
      filter: 'audioonly',
      quality: 'lowestaudio',
    });

    res.setHeader('Content-Type', 'audio/webm');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    let totalBytes = 0;

    stream.on('data', (chunk: Buffer) => {
      totalBytes += chunk.length;
      if (totalBytes > MAX_BYTES) {
        stream.destroy();
        res.end();
        return;
      }
      res.write(chunk);
    });

    stream.on('end', () => {
      clearTimeout(timeout);
      res.end();
    });

    stream.on('error', (err: Error) => {
      clearTimeout(timeout);
      if (!res.headersSent) {
        res.status(500).json({ error: `Stream error: ${err.message}` });
      } else {
        res.end();
      }
    });

    // Handle abort
    controller.signal.addEventListener('abort', () => {
      stream.destroy();
      if (!res.headersSent) {
        res.status(504).json({ error: 'Request timeout' });
      } else {
        res.end();
      }
    });
  } catch (err) {
    clearTimeout(timeout);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: `Failed to fetch audio: ${message}` });
  }
}
