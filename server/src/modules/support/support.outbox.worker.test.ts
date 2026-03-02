import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { supportOutboxWorker } from './support.outbox.worker.js';
import { processDueOutboxJobs } from './support.service.js';

vi.mock('./support.service.js', () => ({
    processDueOutboxJobs: vi.fn(),
}));

describe('support outbox worker', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.mocked(processDueOutboxJobs).mockResolvedValue({
            picked: 0,
            sent: 0,
            retried: 0,
            failed: 0,
            skipped: 0,
        });
    });

    afterEach(() => {
        supportOutboxWorker.stop();
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('processes outbox immediately and on interval', async () => {
        supportOutboxWorker.start(1000);

        await vi.runOnlyPendingTimersAsync();
        const firstCount = vi.mocked(processDueOutboxJobs).mock.calls.length;
        expect(firstCount).toBeGreaterThanOrEqual(1);

        await vi.advanceTimersByTimeAsync(1000);
        const secondCount = vi.mocked(processDueOutboxJobs).mock.calls.length;
        expect(secondCount).toBeGreaterThanOrEqual(firstCount + 1);
    });
});
