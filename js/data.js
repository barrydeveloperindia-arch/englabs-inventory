/**
 * 📊 Englabs_Accounts_Team: Static Master Data
 */

const MASTER_DATA = {
    categories: [
        'Construction Materials',
        'Electrical & Lighting',
        'Plumbing & Sanitization',
        'Paints & Coatings',
        'Tools & Equipment',
        'Safety & PPE',
        'Housekeeping',
        'Office Supplies'
    ],
    units: [
        'Nos',
        'Kg',
        'Mtr',
        'SqFt',
        'Ltr',
        'Bag',
        'Pkt',
        'Set'
    ]
};

if (typeof window !== 'undefined') window.MASTER_DATA = MASTER_DATA;
export default MASTER_DATA;
