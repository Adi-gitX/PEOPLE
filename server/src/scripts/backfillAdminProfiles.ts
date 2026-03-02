import { bootstrapAdminProfiles } from '../modules/admin/admin.service.js';

const run = async (): Promise<void> => {
    console.log('[ADMIN][BOOTSTRAP] Backfilling adminProfiles...');
    const result = await bootstrapAdminProfiles();
    console.log(
        `[ADMIN][BOOTSTRAP] Done. scanned=${result.scanned} created=${result.created} skipped=${result.skipped}`
    );
};

run().catch((error) => {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[ADMIN][BOOTSTRAP][FAIL] ${message}`);
    process.exit(1);
});
