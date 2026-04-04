
import json
import os

# Professional Mapping for EngLabs Inventory
# Using curated high-fidelity URLs from Unsplash for categories
category_images = {
    "Office Supplies": "https://images.unsplash.com/photo-1586075010633-2470ac006f1d?auto=format&fit=crop&q=80&w=800",
    "Furniture, Hospitality and Food Service": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800",
    "Cleaning": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800",
    "Adhesives Sealants and Tape": "https://images.unsplash.com/photo-1589939705384-5185138a04b9?auto=format&fit=crop&q=80&w=800",
    "Abrasives": "https://images.unsplash.com/photo-1563721300063-2287f71fe987?auto=format&fit=crop&q=80&w=800",
    "Power Tools": "https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?auto=format&fit=crop&q=80&w=800",
    "Hand Tools": "https://images.unsplash.com/photo-1530124566582-a618bc2615ad?auto=format&fit=crop&q=80&w=800",
    "Material Handling and Packaging": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800",
    "Electronics": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800",
    "Solar": "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=80&w=800",
    "Electrical": "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&q=80&w=800"
}

# Special High-Fidelity Items
id_images = {
    "ENG03": "https://images.unsplash.com/photo-1589939705384-5185138a04b9?auto=format&fit=crop&q=80&w=800", # Thinner
    "ENG06": "https://images.unsplash.com/photo-1590644365607-1c5a519a7a37?auto=format&fit=crop&q=80&w=800", # Black Paint
    "ENG01": "https://images.unsplash.com/photo-1590644365607-1c5a519a7a37?auto=format&fit=crop&q=80&w=800", # Chemilac Black
    "ENG02": "https://images.unsplash.com/photo-1591104711683-021abc357793?auto=format&fit=crop&q=80&w=800"  # Grey Paint
}

dump_path = 'c:/Users/SAM/Documents/Antigravity/ENGLABS Inventory & Project Management Roadmap/public/inventory_dump.json'

if not os.path.exists(dump_path):
    print("❌ Error: public/inventory_dump.json not found.")
    exit(1)

with open(dump_path, 'r', encoding='utf-8') as f:
    inventory = json.load(f)

print(f"📦 Processing {len(inventory)} items for professional image update...")

updated_count = 0
for item in inventory:
    item_id = item.get('id')
    item_name = item.get('name', '').lower()
    cat = item.get('category', 'Unclassified')

    # 1. ID Match
    if item_id in id_images:
        item['imageUrl'] = id_images[item_id]
        updated_count += 1
    # 2. Pattern Match (Paint/Ink)
    elif "paint" in item_name or "enamel" in item_name or "varnish" in item_name:
        item['imageUrl'] = "https://images.unsplash.com/photo-1590644365607-1c5a519a7a37?auto=format&fit=crop&q=80&w=800"
        updated_count += 1
    # 3. Category Fallback
    else:
        item['imageUrl'] = category_images.get(cat, "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800")
        updated_count += 1

with open(dump_path, 'w', encoding='utf-8') as f:
    json.dump(inventory, f, indent=2)

print(f"✅ SUCCESSFULLY UPDATED IMAGES FOR {updated_count} ITEMS.")
print(f"📂 Updated file: {dump_path}")
