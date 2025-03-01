export class Semaphore {
  max: number;
  current: number;
  queue: Array<() => void>;
  constructor(max: number) {
    this.max = max;
    this.current = 0;
    this.queue = [];
  }
  async acquire(): Promise<void> {
    if (this.current < this.max) {
      this.current++;
      return;
    }
    await new Promise<void>((resolve) => this.queue.push(resolve));
    this.current++;
  }
  release(): void {
    this.current--;
    if (this.queue.length > 0) {
      const resolve = this.queue.shift();
      if (resolve) resolve();
    }
  }
}
