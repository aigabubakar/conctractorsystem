const cron = require('node-cron');
const db = require('./db');
const PendingStore = require('./PendingStore');

// Schedule a task to run every 15 minutes (or 5 mins) to sweep the JSON file
cron.schedule('*/5 * * * *', async () => {
    console.log('[CRON] Running check for pending payments in JSON store...');
    try {
        const pendingPayments = PendingStore.getAll();
        const rrrs = Object.keys(pendingPayments);

        if (rrrs.length === 0) {
            console.log('[CRON] No pending payments found in off-database store.');
            return;
        }

        console.log(`[CRON] Found ${rrrs.length} pending payment(s). Verifying...`);

        for (const rrr of rrrs) {
            const payment = pendingPayments[rrr];
            try {
                // Wait to avoid rate limiting
                await new Promise(res => setTimeout(res, 500));
                
                // Mock Remita verification
                const remitaStatus = /^\d{12}$/.test(rrr) || rrr.startsWith('DEV-') ? 'successful' : 'pending';

                if (remitaStatus === 'successful') {
                    // Check if it already exists in DB to prevent duplicates
                    const [exists] = await db.query('SELECT id FROM payments WHERE rrr = ?', [rrr]);
                    if (exists.length === 0) {
                        await db.query(
                            'INSERT INTO payments (transaction_id, payment_type, company_name, email, phone, rrr, amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                            [payment.transaction_id, payment.payment_type, payment.name, payment.email, payment.phone, rrr, payment.amount, 'successful']
                        );
                    }
                    PendingStore.remove(rrr);
                    console.log(`[CRON] Payment ${rrr} auto-resolved and saved to DB!`);
                } else {
                    // If it's been pending for more than 24 hours, clear it from memory to avoid permanent clutter
                    const createdAt = new Date(payment.created_at);
                    if ((new Date() - createdAt) > 24 * 60 * 60 * 1000) {
                        PendingStore.remove(rrr);
                        console.log(`[CRON] Payment ${rrr} expired and removed from memory.`);
                    }
                }
            } catch (err) {
                console.error(`[CRON] Failed to verify payment ${rrr}:`, err.message);
            }
        }
    } catch (err) {
        console.error('[CRON] Error sweeping pending payments:', err.message);
    }
});

console.log('Off-Database Payment verification cron job initialized.');
