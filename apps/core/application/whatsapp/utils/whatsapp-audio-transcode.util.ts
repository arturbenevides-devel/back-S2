import { execFile, execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import ffmpegStatic from 'ffmpeg-static';

const execFileAsync = promisify(execFile);

/**
 * Ordem: FFMPEG_PATH / FFMPEG_BIN → pacote ffmpeg-static → binário `ffmpeg` no PATH do sistema.
 * Em WSL: `sudo apt install -y ffmpeg` ou defina FFMPEG_PATH=/usr/bin/ffmpeg
 */
/** Expuesto para transcodificação de vídeo (WebM→MP4) no mesmo processo. */
export function resolveFfmpegExecutable(): string {
  const fromEnv =
    process.env.FFMPEG_PATH?.trim() || process.env.FFMPEG_BIN?.trim();
  if (fromEnv && existsSync(fromEnv)) {
    return fromEnv;
  }
  if (
    ffmpegStatic &&
    typeof ffmpegStatic === 'string' &&
    existsSync(ffmpegStatic)
  ) {
    return ffmpegStatic;
  }
  try {
    const out = execFileSync('which', ['ffmpeg'], {
      encoding: 'utf8',
      timeout: 3000,
    }).trim();
    if (out) return out.split('\n')[0]!;
  } catch {
    /* ignore */
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

/**
 * WebM (Opus) do browser → formato aceite pelo Whats2 em `/messages/audio`.
 * Tenta MP3 primeiro; se `libmp3lame` não existir no ffmpeg estático, usa OGG Opus (nota de voz).
 */
export async function transcodeWebmForWhatsappOutbound(
  base64: string,
): Promise<{ base64: string; mime_type: string }> {
  const ffmpegPath = resolveFfmpegExecutable();
  const id = randomUUID();
  const inPath = join(tmpdir(), `wa-audio-in-${id}.webm`);
  const mp3Path = join(tmpdir(), `wa-audio-mp3-${id}.mp3`);
  const oggPath = join(tmpdir(), `wa-audio-ogg-${id}.ogg`);

  await writeFile(inPath, Buffer.from(base64, 'base64'));

  try {
    try {
      await execFileAsync(
        ffmpegPath,
        [
          '-y',
          '-i',
          inPath,
          '-vn',
          '-acodec',
          'libmp3lame',
          '-ar',
          '44100',
          '-ac',
          '2',
          '-b:a',
          '128k',
          mp3Path,
        ],
        { maxBuffer: 10 * 1024 * 1024 },
      );
      return {
        base64: (await readFile(mp3Path)).toString('base64'),
        mime_type: 'audio/mpeg',
      };
    } catch (mp3Err) {
      await execFileAsync(
        ffmpegPath,
        [
          '-y',
          '-i',
          inPath,
          '-vn',
          '-acodec',
          'libopus',
          '-ar',
          '48000',
          '-ac',
          '1',
          '-b:a',
          '64k',
          oggPath,
        ],
        { maxBuffer: 10 * 1024 * 1024 },
      );
      return {
        base64: (await readFile(oggPath)).toString('base64'),
        mime_type: 'audio/ogg',
      };
    }
  } catch (finalErr) {
    throw new Error(
      `Transcodificação ffmpeg (WebM→MP3 ou OGG) falhou: ${ffmpegErrorMessage(finalErr)}`,
    );
  } finally {
    await unlink(inPath).catch(() => undefined);
    await unlink(mp3Path).catch(() => undefined);
    await unlink(oggPath).catch(() => undefined);
  }
}
