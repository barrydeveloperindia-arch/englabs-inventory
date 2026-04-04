import csv
import re
import sys

def parse_currency(value):
    try:
        return float(value.replace(',', ''))
    except:
        return 0.0

def analyze_sales(file_path):
    print(f"Analyzing {file_path}...")
    
    products = []
    current_category = "Unknown"
    current_sub_category = "Unknown"
    
    try:
        with open(file_path, 'r', encoding='latin-1') as f:
            lines = f.readlines()
            
        reader = csv.reader(lines)
        
        row_idx = 0
        for row in reader:
            if not row: continue
            row_idx += 1
            if row_idx < 10:
                print(f"DEBUG ROW {row_idx}: {row}")
            
            # Text check for Category Headers
            if len(row) >= 2:
                text = row[1]
                if "Products Sold in Category" in text:
                    current_category = row[0].strip()
                    continue
                elif "Products Sold in Sub Category" in text:
                    sub_cat = row[0].strip()
                    continue

            # Detect Product Line (Starts with ="...)
            if row[0].startswith('="') and len(row) > 6:
                # Extract Data
                # Barcode, Issue, Description, Tax, Price, Qty, Sales, VAT, Cost, Profit, GM
                try:
                    product = {
                        'category': current_category,
                        'description': row[2],
                        'price': parse_currency(row[4]),
                        'qty': parse_currency(row[5]),
                        'revenue': parse_currency(row[6]),
                        'profit': parse_currency(row[9]),
                        'margin_percent': row[10]
                    }
                    products.append(product)
                except Exception as e:
                    pass

        # --- ANALYSIS ---
        total_revenue = sum(p['revenue'] for p in products)
        total_profit = sum(p['profit'] for p in products)
        total_items = sum(p['qty'] for p in products)
        
        avg_margin = (total_profit / total_revenue * 100) if total_revenue else 0
        
        # Top Products by Revenue
        sorted_by_rev = sorted(products, key=lambda x: x['revenue'], reverse=True)
        top_5_rev = sorted_by_rev[:5]
        
        # Top Products by Quantity
        sorted_by_qty = sorted(products, key=lambda x: x['qty'], reverse=True)
        top_5_qty = sorted_by_qty[:5]
        
        # Category Analysis
        categories = {}
        for p in products:
            cat = p['category']
            if cat not in categories:
                categories[cat] = {'revenue': 0, 'profit': 0, 'qty': 0}
            categories[cat]['revenue'] += p['revenue']
            categories[cat]['profit'] += p['profit']
            categories[cat]['qty'] += p['qty']
            
        sorted_cats = sorted(categories.items(), key=lambda x: x[1]['revenue'], reverse=True)

        print("\n" + "="*40)
        print(" SALES ANALYSIS SUMMARY (Oct 2025 - Jan 2026)")
        print("="*40)
        print(f"Total Revenue:      £{total_revenue:,.2f}")
        print(f"Total Gross Profit: £{total_profit:,.2f}")
        print(f"Overall Margin:     {avg_margin:.2f}%")
        print(f"Total Items Sold:   {int(total_items):,}")
        print("-" * 40)
        
        print("\n🏆 TOP 5 CATEGORIES (By Revenue)")
        for cat, data in sorted_cats[:5]:
            margin = (data['profit'] / data['revenue'] * 100) if data['revenue'] else 0
            print(f" - {cat:<20} £{data['revenue']:,.2f}  (Margin: {margin:.1f}%)")
            
        print("\n🔥 TOP 5 PRODUCTS (By Revenue)")
        for p in top_5_rev:
            print(f" - {p['description']:<30} £{p['revenue']:,.2f} (Qty: {int(p['qty'])})")

        print("\n📦 TOP 5 PRODUCTS (By Volume)")
        for p in top_5_qty:
            print(f" - {p['description']:<30} Sold: {int(p['qty'])}")

        print("\n⚠️ LOW MARGIN CATEGORIES (Revenue > £500)")
        low_margin_cats = [c for c in sorted_cats if c[1]['revenue'] > 500]
        low_margin_cats.sort(key=lambda x: (x[1]['profit'] / x[1]['revenue']) if x[1]['revenue'] else 0)
        for cat, data in low_margin_cats[:3]:
            margin = (data['profit'] / data['revenue'] * 100) if data['revenue'] else 0
            print(f" - {cat:<20} Margin: {margin:.1f}% (£{data['revenue']:,.2f})")

    except Exception as e:
        print(f"Error analyzing file: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    analyze_sales(r"c:\Users\SAM\Documents\Antigravity\hop-in-express---1\assets\Sales_20250930-20260101.csv")
