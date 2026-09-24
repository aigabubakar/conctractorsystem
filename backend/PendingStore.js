const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, 'pending_transactions.json');

function readStore() {
    if (!fs.existsSync(STORE_PATH)) return {};
    try {
        const data = fs.readFileSync(STORE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return {};
    }
}

function writeStore(data) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
    add: function(rrr, transactionData) {
        const store = readStore();
        store[rrr] = { ...transactionData, created_at: new Date().toISOString() };
        writeStore(store);
    },
    get: function(rrr) {
        const store = readStore();
        return store[rrr] || null;
    },
    remove: function(rrr) {
        const store = readStore();
        delete store[rrr];
        writeStore(store);
    },
    getAll: function() {
        return readStore();
    },
    findByEmailAndType: function(email, payment_type) {
        const store = readStore();
        for (const [rrr, data] of Object.entries(store)) {
            if (data.email === email && data.payment_type === payment_type) {
                return { rrr, ...data };
            }
        }
        return null;
    }
};
