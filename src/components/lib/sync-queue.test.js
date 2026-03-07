import { describe, it, expect, vi } from 'vitest';
import { createSyncQueue } from './sync-queue';

describe('createSyncQueue', () => {
  it('executes jobs sequentially', async () => {
    const queue = createSyncQueue();
    const events = [];

    queue.push('a', async () => {
      events.push('a:start');
      await new Promise(resolve => setTimeout(resolve, 20));
      events.push('a:end');
    });

    queue.push('b', async () => {
      events.push('b:start');
      await new Promise(resolve => setTimeout(resolve, 5));
      events.push('b:end');
    });

    await queue.flush();
    expect(events).toEqual(['a:start', 'a:end', 'b:start', 'b:end']);
  });

  it('debounces by key and keeps only the latest pending job', async () => {
    const queue = createSyncQueue();
    const runs = [];

    queue.push('same', async () => {
      runs.push('first');
      await new Promise(resolve => setTimeout(resolve, 30));
    });

    queue.push('same', async () => {
      runs.push('second');
    });

    queue.push('same', async () => {
      runs.push('third');
    });

    await queue.flush();
    expect(runs).toEqual(['first', 'third']);
  });

  it('retries failed jobs up to 2 times and then calls onError', async () => {
    vi.useFakeTimers();
    const onError = vi.fn();
    const queue = createSyncQueue({ onError });
    const job = vi.fn(async () => {
      throw new Error('boom');
    });

    queue.push('fail', job);

    await vi.runAllTimersAsync();
    await queue.flush();

    expect(job).toHaveBeenCalledTimes(3);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0].message).toBe('boom');

    vi.useRealTimers();
  });

  it('flush() processes everything currently queued', async () => {
    const queue = createSyncQueue();
    const done = [];

    queue.push('1', async () => {
      await new Promise(resolve => setTimeout(resolve, 5));
      done.push(1);
    });

    queue.push('2', async () => {
      await new Promise(resolve => setTimeout(resolve, 5));
      done.push(2);
    });

    expect(queue.pending()).toBeGreaterThanOrEqual(1);
    await queue.flush();
    expect(done).toEqual([1, 2]);
    expect(queue.pending()).toBe(0);
  });
});
