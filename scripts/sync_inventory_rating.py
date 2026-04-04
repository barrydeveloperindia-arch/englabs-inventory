import pandas as pd
import json
import os
import sys

excel_path = r'G:\Englabs Inventory 2026-27\Inventory 2026-27\ENGLABS_Complete_Inventory_with_Purchase_Time_Invoice.xlsx'
json_path = r'c:\Users\SAM\Documents\Antigravity\ENGLABS Inventory & Project Management Roadmap\public\inventory_dump.json'

def sync():
    if not os.path.exists(excel_path):
        print(f"Error: Excel file not found at {excel_path}")
        return

    # Load Excel
    try:
        df = pd.read_excel(excel_path)
    except Exception as e:
        print(f"Error reading excel: {e}")
        return

    # Normalize columns
    df.columns = [str(c).strip() for c in df.columns]
    
    def normalize_id(oid):
        oid = str(oid).strip()
        if oid.startswith('ENG'):
            try:
                num_part = int(oid[3:])
                return f"ENG{num_part}"
            except:
                return oid
        return oid

    # Premium Image Mapping
    IMAGE_MAP = {
        'PAINT SECTION': 'https://images.unsplash.com/photo-1590644365607-1c5a519a7a37?auto=format&fit=crop&q=80&w=800',
        'STATIONARY SECTION': 'https://images.unsplash.com/photo-1586075010633-2470ac006f1d?auto=format&fit=crop&q=80&w=800',
        'CLEANING': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800',
        'ELECTRONICS': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800',
        'ABRASIVES': 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&q=80&w=800',
        'MATERIAL HANDLING': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800',
        'ADHESIVES': 'https://images.unsplash.com/photo-1589939705384-5185138a04b9?auto=format&fit=crop&q=80&w=800'
    }

    excel_items = {}
    for _, row in df.iterrows():
        raw_id = row.get('Inventory ID') or row.get('Inventory ID ') 
        if pd.isnull(raw_id):
            continue
            
        inv_id = normalize_id(raw_id)
        if inv_id.startswith('ENG'):
            cat = str(row.get('Categories', '')).upper()
            img_url = IMAGE_MAP.get(cat)
            if not img_url:
                # Fallback check descriptive category
                desc_cat = str(row.get('Descriptions/Category', '')).upper()
                for key in IMAGE_MAP:
                    if key in desc_cat:
                        img_url = IMAGE_MAP[key]
                        break

            excel_items[inv_id] = {
                'rating': row.get('Rating', None),
                'price': row.get('Price', None),
                'stock': row.get('Stock', None),
                'imageUrl': img_url
            }

    # Load JSON
    if os.path.exists(json_path):
        with open(json_path, 'r', encoding='utf-8') as f:
            inventory = json.load(f)
    else:
        print("Error: JSON file not found")
        return

    updated_count = 0
    for item in inventory:
        id_val = normalize_id(item.get('id', ''))
        if id_val in excel_items:
            data = excel_items[id_val]
            
            # Update rating
            if pd.notnull(data['rating']):
                try: item['rating'] = float(data['rating'])
                except: pass
            
            # Update price
            if pd.notnull(data['price']):
                try: item['price'] = float(data['price'])
                except: pass
            
            # Update stock
            if pd.notnull(data['stock']):
                try: item['stock'] = int(float(data['stock']))
                except: pass

            # Update Image
            if data['imageUrl']:
                item['imageUrl'] = data['imageUrl']
            
            updated_count += 1

    # Save JSON back
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(inventory, f, indent=2)

    print(f"Successfully enriched {updated_count} items with ratings and professional imagery.")

if __name__ == "__main__":
    sync()
