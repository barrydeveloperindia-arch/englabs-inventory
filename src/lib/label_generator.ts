
import { jsPDF } from 'jspdf';
import JsBarcode from 'jsbarcode';
import { InventoryItem } from '../types';
import { SHOP_INFO } from '../constants';

/**
 * Shelf-Edge Label (SEL) Generator
 * 
 * Generates enterprise-standard price tags for retail shelves.
 * Template: Standard A4 sheet with 21 labels (3 columns x 7 rows).
 * Each label: ~70mm x 42mm.
 */

export interface LabelOptions {
    includeBarcode: boolean;
    includeBrand: boolean;
    showVatStatus: boolean;
    currency: string;
}

const DEFAULT_OPTIONS: LabelOptions = {
    includeBarcode: true,
    includeBrand: true,
    showVatStatus: true,
    currency: SHOP_INFO.currency
};

export const generateShelfLabels = async (items: InventoryItem[], options: LabelOptions = DEFAULT_OPTIONS) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const marginX = 5;
    const marginY = 10;

    const cols = 3;
    const rows = 7;
    const labelsPerPage = cols * rows;

    const labelWidth = (pageWidth - (marginX * 2)) / cols;
    const labelHeight = (pageHeight - (marginY * 2)) / rows;

    let currentItemIndex = 0;

    while (currentItemIndex < items.length) {
        if (currentItemIndex > 0 && currentItemIndex % labelsPerPage === 0) {
            doc.addPage();
        }

        const posInPage = currentItemIndex % labelsPerPage;
        const col = posInPage % cols;
        const row = Math.floor(posInPage / cols);

        const x = marginX + (col * labelWidth);
        const y = marginY + (row * labelHeight);

        const item = items[currentItemIndex];
        renderLabel(doc, item, x, y, labelWidth, labelHeight, options);

        currentItemIndex++;
    }

    const fileName = `SEL_Labels_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    return fileName;
};

const renderLabel = (
    doc: jsPDF,
    item: InventoryItem,
    x: number,
    y: number,
    width: number,
    height: number,
    options: LabelOptions
) => {
    // 1. Draw Border
    doc.setDrawColor(230, 230, 230);
    doc.rect(x, y, width, height);

    // 2. Brand (If enabled)
    let textY = y + 8;
    if (options.includeBrand && item.brand) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(item.brand.toUpperCase(), x + 4, textY);
        textY += 4;
    }

    // 3. Product Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    const nameLines = doc.splitTextToSize(item.name, width - 8);
    doc.text(nameLines.slice(0, 2), x + 4, textY);
    textY += (nameLines.length > 1 ? 10 : 6);

    // 4. Price (Primary Focus)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(0, 0, 0);
    const priceText = `${options.currency}${item.price.toFixed(2)}`;
    doc.text(priceText, x + width - 4, y + height - 12, { align: 'right' });

    // 5. Unit / Pack Size
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`${item.packSize || '1'} ${item.unitType || 'pcs'}`, x + 4, y + height - 18);

    // 6. Barcode
    if (options.includeBarcode && item.barcode) {
        try {
            const canvas = document.createElement('canvas');
            JsBarcode(canvas, item.barcode, {
                format: "EAN13",
                width: 1,
                height: 30,
                displayValue: false,
                margin: 0
            });
            const barcodeData = canvas.toDataURL("image/png");
            doc.addImage(barcodeData, 'PNG', x + 4, y + height - 15, width / 2, 10);

            doc.setFontSize(6);
            doc.text(item.barcode, x + 4, y + height - 4);
        } catch (e) {
            console.warn("Barcode generation failed for", item.barcode);
        }
    }

    // 7. VAT Status
    if (options.showVatStatus) {
        doc.setFontSize(6);
        doc.text(item.vatRate === 0 ? "ZERO RATED" : "VAT INC", x + width - 4, y + height - 4, { align: 'right' });
    }
};
