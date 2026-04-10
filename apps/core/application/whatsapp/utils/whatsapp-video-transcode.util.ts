import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFile, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { resolveFfmpegExecutable } from './whatsapp-audio-transcode.util';

const execFileAsync = promisify(execFile);

function ffmpegErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'stderr' in err) {
    const s = (err as { stderr?: Buffer }).stderr;
    if (s) return `${String(err)}\n${s.toString()}`;
  }
  return err instanceof Error ? err.message : String(err);
}

/**
 * WebM gravado no browser → MP4 (H.264 + AAC) para `POST .../messages/video`.
 * WhatsApp exibe vídeo nativo na conversa; enviar vídeo como documento mostra só anexo genérico.
 */
export async function transcodeWebmVideoToMp4(
  base64: string,
): Promise<{ base64: string; mime_type: string }> {
  const ffmpegPath = resolveFfmpegExecutable();
  const id = randomUUID();
  const inPath = join(tmpdir(), `wa-video-in-${id}.webm`);
  const outPath = join(tmpdir(), `wa-video-out-${id}.mp4`);

  await writeFile(inPath, Buffer.from(base64, 'base64'));

  try {
    await execFileAsync(
      ffmpegPath,
      [
        '-y',
        '-i',
        inPath,
        '-c:v',
        'libx264',
        '-pix_fmt',
        'yuv420p',
        '-movflags',
        '+faststart',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        outPath,
      ],
      { maxBuffer: 50 * 1024 * 1024 },
    );
    return {
      base64: (await readFile(outPath)).toString('base64'),
      mime_type: 'video/mp4',
    };
  } catch (err) {
    throw new Error(
      `Transcodificação ffmpeg (WebM→MP4) falhou: ${ffmpegErrorMessage(err)}`,
    );
  } finally {
    await unlink(inPath).catch(() => undefined);
    await unlink(outPath).catch(() => undefined);
  }
}
