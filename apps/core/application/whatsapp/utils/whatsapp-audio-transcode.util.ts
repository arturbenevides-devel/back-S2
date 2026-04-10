import { execFile, execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const ffmpegStaticPath: string | null = require('ffmpeg-static');

const execFileAsync = promisify(execFile);

export function resolveFfmpegExecutable(): string {
  const fromEnv =
    process.env.FFMPEG_PATH?.trim() || process.env.FFMPEG_BIN?.trim();
  if (fromEnv && existsSync(fromEnv)) {
    return fromEnv;
  }
  if (ffmpegStaticPath && typeof ffmpegStaticPath === 'string' && existsSync(ffmpegStaticPath)) {
    return ffmpegStaticPath;
  }
  try {
    const out = execFileSync('which', ['ffmpeg'], {
      encoding: 'utf8',
      timeout: 3000,
    }).trim();
    if (out) return out.split('\n')[0]!;
  } catch {
    console.error('ffmpeg not found');
  }
  return 'ffmpeg';
}

function ffmpegErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'stderr' in err) {
    const s = (err as { stderr?: Buffer }).stderr;
    if (s) return `${String(err)}\n${s.toString()}`;
  }
  return err instanceof Error ? err.message : String(err);
}

export async function transcodeWebmForWhatsappOutbound(
  base64: string,
): Promise<{ base64: string; mime_type: string }> {
  const ffmpegPath = resolveFfmpegExecutable();
  const id = randomUUID();
  const inPath = join(tmpdir(), `wa-audio-in-${id}.webm`);
  const mp3Path = join(tmpdir(), `wa-audio-mp3-${id}.mp3`);

  await writeFile(inPath, Buffer.from(base64, 'base64'));

  try {
    await execFileAsync(
      ffmpegPath,
      ['-y', '-i', inPath, '-vn', '-acodec', 'libmp3lame', '-ar', '44100', '-ac', '1', '-b:a', '64k', mp3Path],
      { maxBuffer: 10 * 1024 * 1024 },
    );
    return {
      base64: (await readFile(mp3Path)).toString('base64'),
      mime_type: 'audio/mpeg',
    };
  } catch (err) {
    throw new Error(`Transcodificação ffmpeg (WebM→MP3) falhou: ${ffmpegErrorMessage(err)}`);
  } finally {
    await unlink(inPath).catch(() => undefined);
    await unlink(mp3Path).catch(() => undefined);
  }
}
