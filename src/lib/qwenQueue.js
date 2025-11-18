// Simple queue system for Qwen API calls to handle concurrency limit of 1
class QwenQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  async add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const { task, resolve, reject } = this.queue.shift();

    try {
      const result = await task();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.isProcessing = false;
      // Process next item in queue
      if (this.queue.length > 0) {
        this.process();
      }
    }
  }

  getQueueLength() {
    return this.queue.length;
  }
}

// Create a singleton instance
const qwenQueue = new QwenQueue();

export default qwenQueue;
