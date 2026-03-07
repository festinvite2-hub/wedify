function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createSyncQueue({ onError } = {}) {
  const queue = [];
  const queuedByKey = new Map();
  let running = false;
  let flushResolver = null;

  const resolveFlushIfIdle = () => {
    if (!running && queue.length === 0 && flushResolver) {
      flushResolver();
      flushResolver = null;
    }
  };

  const processNext = async () => {
    if (running) return;
    const next = queue.shift();
    if (!next) {
      resolveFlushIfIdle();
      return;
    }

    queuedByKey.delete(next.key);
    running = true;

    let attempts = 0;
    while (attempts < 3) {
      try {
        await next.asyncFn();
        break;
      } catch (error) {
        attempts += 1;
        if (attempts >= 3) {
          onError?.(error);
          break;
        }
        await wait(1000);
      }
    }

    running = false;
    if (queue.length > 0) {
      void processNext();
    } else {
      resolveFlushIfIdle();
    }
  };

  const push = (key, asyncFn) => {
    const existingIndex = queuedByKey.get(key);
    if (existingIndex !== undefined) {
      queue[existingIndex] = { key, asyncFn };
      return;
    }

    queue.push({ key, asyncFn });
    queuedByKey.set(key, queue.length - 1);

    // Repair index map in case queue head was shifted previously.
    for (let i = 0; i < queue.length; i += 1) {
      queuedByKey.set(queue[i].key, i);
    }

    void processNext();
  };

  const flush = async () => {
    if (!running && queue.length === 0) return;
    await new Promise(resolve => {
      flushResolver = resolve;
      void processNext();
    });
  };

  const pending = () => queue.length;

  return { push, flush, pending };
}

export { createSyncQueue };
