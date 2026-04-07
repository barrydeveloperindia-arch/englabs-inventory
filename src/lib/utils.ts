import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import moment from "moment-timezone";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function finalPrice(price: number, vatPercent: number): number {
    return +(price * (1 + vatPercent / 100)).toFixed(2);
}

export function generateInventoryReport(products: { name: string; price: number; vatRate: number; stock: number }[]) {
    return products.map(p => ({
        name: p.name,
        price_inr: p.price,
        price_with_gst: finalPrice(p.price, p.vatRate),
        stock: p.stock
    }));
}

export function formatTransactionDate(date: string | Date | number) {
    return moment(date).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
}

export function getVATByCategory(category: string): number {
    const zeroGstItems = ["WIP", "Project Assets", "Services"];
    return zeroGstItems.includes(category) ? 0 : 18;
}

export function isExpired(expiryDate: string | Date | undefined): boolean {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
}

export function checkExpiryRisk(product: { name: string; expiryDate?: string }) {
    if (!product.expiryDate) return;
    const diff = (new Date(product.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
    if (diff <= 7) {
        console.warn(`[EXPIRY] ⚠️ Expiry soon: ${product.name} (${Math.ceil(diff)} days)`);
    }
}

export function checkLowStock(product: { name: string; stock: number }) {
    if (product.stock <= 5) {
        console.warn(`[STOCK] ⚠️ Low stock alert: ${product.name} (${product.stock} units)`);
    }
}

export function getAutoImageForAsset(name: string): string {
    const n = name.toLowerCase();
    
    if (n.includes('sanding') || n.includes('emery')) return '/assets/sanding_paper.png';
    // Removed paint and thinner unsplash loops because they were inaccurate (blue paint roller for black paint, man on mountain for thinner).
    if (n.includes('glue') || n.includes('fevicol') || n.includes('araldite')) return 'https://images.unsplash.com/photo-1596769931885-30fa900f6074?q=80&w=800';
    if (n.includes('tool') || n.includes('diamond') || n.includes('blade') || n.includes('drill') || n.includes('milwaukee') || n.includes('dewalt') || n.includes('bosch') || n.includes('makita') || n.includes('hammer') || n.includes('power')) return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800';
    if (n.includes('cleaning') || n.includes('harpic') || n.includes('colin') || n.includes('dettol') || n.includes('vim') || n.includes('brush')) return 'https://images.unsplash.com/photo-1585421514738-01798e348b17?q=80&w=800';
    if (n.includes('paper') && !n.includes('sanding')) return 'https://images.unsplash.com/photo-1628126235206-5260b9ea6441?q=80&w=800';
    if (n.includes('tissue')) return 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?q=80&w=800';
    if (n.includes('glove') || n.includes('apran') || n.includes('mask') || n.includes('safety')) return 'https://images.unsplash.com/photo-1584308666744-24d5e4b2d5a3?q=80&w=800';
    if (n.includes('tape') || n.includes('zip lock') || n.includes('adhesive')) return 'https://images.unsplash.com/photo-1622322306265-1d4cb803aede?q=80&w=800';
    if (n.includes('cell') || n.includes('battery')) return 'https://images.unsplash.com/photo-1616422285623-1d0e1bbaaa0c?q=80&w=800';
    if (n.includes('tie') || n.includes('zip tie') || n.includes('cable tie')) return 'https://images.unsplash.com/photo-1655184638708-cf1feaf8a623?q=80&w=800'; // Specific industrial zip tie mapping
    if (n.includes('hardware') || n.includes('screw') || n.includes('nut') || n.includes('bolt')) return 'https://images.unsplash.com/photo-1581280650962-d922a9eef113?q=80&w=800';
    if (n.includes('mouse') || n.includes('mouse pad') || n.includes('keyboard') || n.includes('computer')) return 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=800';

    return '/assets/englabs_logo.png'; // Fallback
}
