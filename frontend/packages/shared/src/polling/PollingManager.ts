import { PollingConfig } from '@snackflow/shared-types';

type PollCallback = () => void | Promise<void>;

interface PollTask {
  id: string;
  callback: PollCallback;
  config: PollingConfig;
  timerId: ReturnType<typeof setInterval> | null;
  failureCount: number;
}

export class PollingManager {
  private tasks: Map<string, PollTask> = new Map();
  private isPaused = false;

  register(id: string, callback: PollCallback, config: PollingConfig): void {
    if (this.tasks.has(id)) {
      this.unregister(id);
    }

    const task: PollTask = {
      id,
      callback,
      config: { ...config },
      timerId: null,
      failureCount: 0,
    };

    this.tasks.set(id, task);

    if (config.enabled && !this.isPaused) {
      this.startTask(task);
    }
  }

  unregister(id: string): void {
    const task = this.tasks.get(id);
    if (task?.timerId) {
      clearInterval(task.timerId);
    }
    this.tasks.delete(id);
  }

  private startTask(task: PollTask): void {
    if (task.timerId) clearInterval(task.timerId);

    task.timerId = setInterval(async () => {
      try {
        await task.callback();
        task.failureCount = 0;
      } catch {
        task.failureCount++;
        if (task.failureCount >= 3) {
          this.adjustInterval(task);
        }
      }
    }, task.config.interval);
  }

  private adjustInterval(task: PollTask): void {
    const newInterval = Math.min(
      task.config.interval * 1.5,
      task.config.maxInterval
    );
    task.config.interval = newInterval;

    if (task.timerId) clearInterval(task.timerId);
    this.startTask(task);
  }

  pause(): void {
    this.isPaused = true;
    this.tasks.forEach((task) => {
      if (task.timerId) {
        clearInterval(task.timerId);
        task.timerId = null;
      }
    });
  }

  resume(): void {
    this.isPaused = false;
    this.tasks.forEach((task) => {
      if (task.config.enabled && !task.timerId) {
        this.startTask(task);
      }
    });
  }

  pauseTask(id: string): void {
    const task = this.tasks.get(id);
    if (task?.timerId) {
      clearInterval(task.timerId);
      task.timerId = null;
    }
  }

  resumeTask(id: string): void {
    const task = this.tasks.get(id);
    if (task && task.config.enabled && !task.timerId && !this.isPaused) {
      this.startTask(task);
    }
  }

  destroy(): void {
    this.tasks.forEach((task) => {
      if (task.timerId) clearInterval(task.timerId);
    });
    this.tasks.clear();
  }
}

export const pollingManager = new PollingManager();
export default pollingManager;
