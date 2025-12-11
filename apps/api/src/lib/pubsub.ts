import { redisEmitter } from './redis';

export async function emitPubsub(
  topic: string,
  payload: Record<string, unknown>
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    redisEmitter.emit({ topic, payload }, (err?: Error | null) => {
      if (err) return reject(err);
      resolve();
    });
  });
}
