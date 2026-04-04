import json
import os

raw_data = """
RACK-1	Painting Brush	ENG54	2		(in pcs)	 ₹ 103.40 
RACK-1	A4 Paper rim	ENG23	11		(in pack)	 ₹ 247.21 
RACK-1	NOTES PADS	ENG24	34		(in pcs)	 ₹ 41.00 
RACK-1	White Envelopes	ENG25	650		(in pcs)	 ₹ 1.62 
RACK-1	White labal Sticker	ENG26	17		(in roll)	 ₹ 2.00 
RACK-1	Cell CR 2032	ENG27	48		(in pcs)	 ₹ 203.36 
RACK-1	Cell GP 12V	ENG28	2		(in pcs)	 ₹ 38.98 
RACK-1	(D) Size Big Battrey	ENG29	2		(in pcs)	 ₹ 125.83 
RACK-1	9V Battery	ENG30	2		(in pcs)	 ₹ 15.00 
RACK-1	Clay	ENG31	0		(in pcs)	 ₹ 100.00 
RACK-1	Dura Cell	ENG32	0		(in pcs)	
RACK-1	Book Marks	ENG33	20		(in pcs)	 ₹ 10.00 
RACK-1	Binder Clips	ENG34	2		(in box)	 ₹ 44.00 
RACK-1	Birthday Decoration	ENG35	1		(in pack)	 ₹ 10.00 
RACK-1	Bussiness Card Holder	ENG36	0		(in pcs)	 ₹ 4.00 
RACK-1	Big Size Staple Pin	ENG37	17		(in box)	 ₹ 33.60 
RACK-1	Small Size Staple Pin	ENG38	22		(in pcs)	 ₹ 33.60 
RACK-1	Cutter Blade	ENG39	144		(in box)	 ₹ 4.90 
RACK-1	Surgical Blade	ENG40	0		(in pcs)	 ₹ 5.70 
RACK-1	Birthday Card	ENG41	1		(in pack)	 ₹ 150.00 
RACK-1	Insert M3*4	ENG42	8		(in pack)	 ₹ 3.50 
RACK-1	AA Cell 	ENG43	12		(in pcs)	 ₹ 12.00 
RACK-1	AAA Cell	ENG44	5		(in pcs)	 ₹ 10.00 
RACK-1	White Board Marker Ink	ENG45	8		(in bottal)	 ₹ 25.00 
RACK-1	Inkjet Ink	ENG46	1		(in bottal)	 ₹ 3,000.00 
RACK-1	Fevicol	ENG47	1		(in kg)	 ₹ 357.71 
RACK-1	Sharpner	ENG48	9		(in pcs)	 ₹ 10.00 
RACK-1	Pen	ENG49	12		(in pcs)	 ₹ 17.75 
RACK-1	Pencil	ENG50	8		(in pcs)	 ₹ 10.00 
RACK-1	Fevikwik	ENG51	14		(in pcs)	 ₹ 41.30 
RACK-1	Fevibond	ENG52	0		(in pcs)	 ₹ 41.40 
RACK-1	Araldite Glue	ENG53	2		(in pcs)	 ₹ 224.00 
RACK-1	A4 Bond Paper	ENG122	6		(pack)	 ₹ 390.00 
RACK-1	Prmanent Marker	ENG55	7		(in pcs)	 ₹ 20.00 
RACK-1	Notice Board Pin	ENG56	1		(in box)	 ₹ 144.00 
RACK-1	Fragile Sticker Roll	ENG57	0		(in roll)	 ₹ 1,177.00 
RACK-1	Cello Tape (1inch)	ENG58	9		(in roll)	
RACK-1	Double Side Tape	ENG59	5		(in roll)	 ₹ 56.41 
RACK-1	Masking Tape	ENG60	97		(in pcs)	 ₹ 21.00 
RACK-1	Day Book 	ENG61	1		(in pcs)	 ₹ 219.00 
RACK-1	Attendance Register	ENG62	1		(in pcs)	 ₹ 150.00 
RACK-1	L  Folder Paper	ENG63	9		(in pcs)	 ₹ 10.00 
RACK-1	A4 Colour Sheet	ENG64	2		(in pack)	 ₹ 100.00 
RACK-1	A4 Courier Envelope	ENG65	13		(in pcs)	 ₹ 2.11 
RACK-1	Clear Bag	ENG66	8		(in pcs)	 ₹ 41.66 
RACK-1	Lamination Sheet	ENG67	10		(in pcs)	 ₹ 8.00 
RACK-1	A3 Sheet	ENG68	18		(in pcs)	 ₹ 390.00 
RACK-1	Surgical Blade Rod	ENG69	6		(in pcs)	 ₹ 260.00 
RACK-1	Fevitite Glue	ENG70	2		(in pcs)	 ₹ 485.00 
RACK-2	Plastic Box (small)	ENG71	0		(in box)	 ₹ 10.66 
RACK-2	Chimtti	ENG72	8		(in pcs)	 ₹ 5.77 
RACK-2	Exam Board	ENG73	3		(in pcs)	 ₹ 845.76 
RACK-2 	Zip Lock 	ENG98	0		(in pack)	 ₹ 0.83 
RACK-2	Rabber Band 	ENG99	5		(in pack)	 ₹ 14.19 
RACK-2	Slicon Glue	ENG103	1		(in pcs)	 ₹ 126.00 
RACK-2	Mouse Pad	ENG105	0		(in pcs)	 ₹ 200.00 
RACK-2	Hot Glue Stick	ENG108	9		(in pcs)	 ₹ 333.92 
RACK-2	Sanding Paper 2000	ENG109	65		(in pcs)	 ₹ 19.98 
RACK-2	Sanding Paper 600	ENG110	80		(in pcs)	 ₹ 18.59 
RACK-2	Sanding Paper 320	ENG111	50		(in pcs)	 ₹ 17.27 
RACK-2	Sanding Paper 100	ENG123	40		(in pcs)	 ₹ 19.00 
RACK-2	Sanding Paper 220	ENG112	105		(in pcs)	 ₹ 17.37 
RACK-2	Big Size Flag	ENG113	3		(in pcs)	 ₹ 649.00 
RACK-2	Rubber Liquid Silicon	ENG114	1		(in kg)	 ₹ 941.64 
RACK-2	Weight Machine	ENG104	2		(in pcs)	 ₹ 595.76 
RACK-2	Zip Tie	ENG106	1		(in pack)	 ₹ 0.83 
RACK-2	Curtain Rod	ENG118	1		(in box)	 ₹ 758.00 
RACK-2	Toth pic	ENG119	1		(in box)	 ₹ 62.56 
RACK-4	Birthday And Coffee Mug	ENG83	5		(in pcs)	 ₹ 100.00 
RACK-4	Tea cups 	ENG90	3		(in pcs)	 ₹ 55.59 
RACK-4	Food Handling Tool	ENG94	2		(in pcs)	 ₹ 100.00 
RACK-4	Tea Basket	ENG95	1		(in pcs)	 ₹ 1,000.00 
RACK-4	Diamand Tool 	ENG100	3		(in pcs)	 ₹ 589.83 
RACK-4	Standard Lac	ENG101	12		(in pcs)	 ₹ 100.00 
RACK-4	Baking Pawder	ENG88	5		(in box)	 ₹ 313.56 
RACK-4	Urinal Matt	ENG84	7		(in pcs)	 ₹ 33.47 
RACK-4	Odonil	ENG87	1		(in pcs)	 ₹ 34.53 
RACK-4	Harpic	ENG89	2		(in ltr)	 ₹ 173.30 
RACK-4	Tissue Roll	ENG91	12		(in roll)	 ₹ 27.95 
RACK-4	Colin	ENG92	1		(in ltr)	 ₹ 157.62 
RACK-4	Vim Gel  	ENG93	2		(in ltr)	 ₹ 296.00 
RACK-4	Cleaning Cloth	ENG96	2		(in pcs)	 ₹ 5.00 
RACK-4	Dettol Hand Wash	ENG97	0		(in ltr)	 ₹ 121.96 
RACK-4	Plastic Gloves	ENG102	5		(in pack)	 ₹ 62.90 
RACK-4	Room Freshner	ENG117	0		(in bottal)	 ₹ 114.41 
RACK-4	Garbeg Bag	ENG82	2		(in roll)	 ₹ 47.53 
RACK-5	Lint Free Cloth	ENG74	2627		(in pcs)	 ₹ 4.00 
RACK-5	Masks	ENG75	1320		(in pcs)	 ₹ 2.00 
RACK-5	Gloves	ENG76	1270		(in pcs)	 ₹ 4.85 
RACK-5	Woollen Gloves	ENG77	4		(in pair)	 ₹ 103.00 
RACK-5	Cap	ENG81	835		(in pcs)	 ₹ 1.25 
RACK-5	Apran Small Size	ENG85	1		(in pcs)	 ₹ 188.57 
RACK-6	Chemilac Black paint	ENG01	16		(in ltr)	 ₹ 510.00 
RACK-6	CHEMILAC GREY PAINT	ENG02	4		(in ltr)	 ₹ 510.00 
RACK-6	Chemilac Thinner	ENG03	3		( in ltr)	 ₹ 183.00 
RACK-6	 SBL PRIMER GREY	ENG04	4		(In ltr)	 ₹ 490.00 
RACK-6	SBL P.P. Primer	ENG05	3		(in ltr)	 ₹ 468.00 
RACK-6	SBL BLACK MATT	ENG121	8		(in ltr)	 ₹ 557.00 
RACK-6	SBL Black Paint	ENG06	0		(in ltr)	 ₹ 520.00 
RACK-6	SBL Glass Coat Black	ENG07	1		(in ltr)	 ₹ 520.00 
RACK-6	Sevens PU Pearl White	ENG12	8		(in ltr)	 ₹ 550.00 
RACK-6	Sevens Black Paint(Gloss)	ENG13	3		(in ltr)	 ₹ 850.00 
RACK-6	Asian Paint Grey	ENG15	4		(in ltr)	 ₹ 1,082.00 
RACK-6	Acrylic Lacquer	ENG17	1		(in bottle)	 ₹ 250.00 
RACK-6	Rit Black Dye	ENG18	6		(in bottle)	 ₹ 3,302.00 
RACK-6	Duco PU Matt	ENG20	2		(in ltr)	 ₹ 720.00 
RACK-6	Rit Brown dye	ENG21	1		(in pack)	 ₹ 3,306.00 
RACK-6	Wall Paint Brush	ENG115	2		(in pcs)	 ₹ 100.00 
RACK-6	Nc Thinner	ENG120	10		(in ltr)	 ₹ 130.00 
RACK-6	PU Chemical Hikott	ENG22	8		(in ltr)	 ₹ 850.00 
"""

items = []
for line in raw_data.strip().split('\n'):
    parts = line.split('\t')
    if len(parts) >= 4:
        rack = parts[0].strip()
        name = parts[1].strip()
        eng_code = parts[2].strip()
        qty_str = parts[3].strip()
        
        qty = 0
        try:
            qty = int(qty_str) if qty_str else 0
        except: pass
            
        rate = 0.0
        for p in parts[4:]:
            if '₹' in p:
                rate_str = p.replace('₹', '').replace(',', '').strip()
                try:
                    rate = float(rate_str)
                    break
                except: pass
        
        category = "Office Supplies"
        if "RACK-4" in rack: category = "Furniture, Hospitality and Food Service"
        if "RACK-5" in rack: category = "Cleaning"
        if "RACK-6" in rack: category = "Adhesives Sealants and Tape"
        
        unit = "pcs"
        if "ltr" in line.lower() or "bottal" in line.lower(): unit = "litre"
        elif "pack" in line.lower(): unit = "pack"
        elif "roll" in line.lower(): unit = "roll"
        elif "box" in line.lower(): unit = "box"
        elif "kg" in line.lower(): unit = "kg"

        items.append({
            "id": eng_code,
            "sku": eng_code,
            "name": name,
            "brand": "Generic",
            "category": category,
            "stock": qty,
            "minStock": 10,
            "costPrice": rate,
            "price": round(rate * 1.5, 2) if rate > 0 else 0,
            "unitType": unit,
            "packSize": "1",
            "vatRate": 18,
            "status": "LIVE",
            "shelfLocation": rack,
            "updatedAt": "2026-04-01T00:00:00.000Z"
        })

dump_path = 'c:/Users/SAM/Documents/Antigravity/ENGLABS Inventory & Project Management Roadmap/public/inventory_dump.json'
try:
    with open(dump_path, 'r') as f: existing = json.load(f)
except: existing = []

inventory_dict = {item['id']: item for item in existing}
for item in items: inventory_dict[item['id']] = item

with open(dump_path, 'w') as f:
    json.dump(list(inventory_dict.values()), f, indent=2)

print(f"Ingested {len(items)} items.")
