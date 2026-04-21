import { EXCEL_SEED } from '../js/seed_data.js';

let bal = 0;
EXCEL_SEED.ledger.forEach(l => {
    if (l.type === 'IN') bal += l.amount;
    else bal -= l.amount;
});

console.log(`Calculated Seed Balance: ${bal}`);
console.log(`Expected Excel Balance: 4838`);
