/* eslint-disable no-underscore-dangle */
import { Transform } from 'stream';
import type { TransformCallback } from 'stream';
import type { ProgressCallback } from '@/typings.d';

export default class ProgressCallbackTransform extends Transform {
  private start = Date.now();
  private transferred = 0;
  private delta = 0;
  private readonly total: number;
  private readonly onProgress: ProgressCallback;

  private nextUpdate = this.start + 1000;

  constructor(total: number, onProgress: ProgressCallback) {
    super();
    this.total = total;
    this.onProgress = onProgress;
  }

  _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
    this.transferred += chunk.length;
    this.delta += chunk.length;

    const now = Date.now();
    if (now >= this.nextUpdate && this.transferred !== this.total) {
      this.nextUpdate = now + 1000;
      this.onProgress({
        total: this.total,
        delta: this.delta,
        transferred: this.transferred,
        percent: (this.transferred / this.total) * 100,
        bytesPerSecond: Math.round(this.transferred / ((now - this.start) / 1000)),
      });
      this.delta = 0;
    }

    callback(null, chunk);
  }

  _flush(callback: TransformCallback): void {
    this.onProgress({
      total: this.total,
      delta: this.delta,
      transferred: this.total,
      percent: 100,
      bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1000)),
    });
    this.delta = 0;

    callback(null);
  }
}
