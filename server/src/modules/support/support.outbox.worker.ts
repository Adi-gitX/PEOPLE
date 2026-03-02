import { processDueOutboxJobs } from './support.service.js';

const DEFAULT_POLL_INTERVAL_MS = 15_000;

class SupportOutboxWorker {
    private timer: NodeJS.Timeout | null = null;
    private running = false;

    start(pollIntervalMs: number = DEFAULT_POLL_INTERVAL_MS): void {
        if (this.timer) return;

        this.timer = setInterval(() => {
            void this.tick();
        }, pollIntervalMs);

        void this.tick();
    }

    stop(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    private async tick(): Promise<void> {
        if (this.running) return;
        this.running = true;

        try {
            const result = await processDueOutboxJobs(10);
            if (result.picked > 0) {
                console.log(
                    `[SUPPORT][OUTBOX] picked=${result.picked} sent=${result.sent} retried=${result.retried} failed=${result.failed} skipped=${result.skipped}`
                );
            }
        } catch (error) {
            const detail = error instanceof Error ? error.message : 'Unknown error';
            console.error(`[SUPPORT][OUTBOX][FAIL] ${detail}`);
        } finally {
            this.running = false;
        }
    }
}

export const supportOutboxWorker = new SupportOutboxWorker();

