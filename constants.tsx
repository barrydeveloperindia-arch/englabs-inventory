
import { StaffMember, InventoryItem, Supplier } from './types';

export const SHOP_INFO = {
  name: 'ENGLABS INVENTORY',
  address: '1021-1022, Second Floor, Disha Arcade, Mansa Devi Complex, Bhainsa Tibba, MDC Sector 4, Panchkula, Haryana 134114',
  whatsapp: '+91-98764-57934',
  phone: '098764 57934',
  currency: '₹',
  taxType: 'GST',
  taxRate: 18
};

export const SHOP_OPERATING_HOURS: Record<string, { start: string, end: string }> = {
  Monday: { start: '08:00', end: '22:00' },
  Tuesday: { start: '08:00', end: '22:00' },
  Wednesday: { start: '08:00', end: '22:00' },
  Thursday: { start: '08:00', end: '22:00' },
  Friday: { start: '08:00', end: '22:00' },
  Saturday: { start: '08:00', end: '22:00' },
  Sunday: { start: '08:00', end: '22:00' }
};


export const INITIAL_SUPPLIERS: Supplier[] = [
  { 
    id: 'RIDHAAN', 
    name: 'Ridhaan Engineer', 
    contactName: 'CEO/MD', 
    phone: '9023373934', 
    email: 'ridhaanengineers@gmail.com', 
    category: 'Engineering & Industrial', 
    totalSpend: 0, 
    outstandingBalance: 0, 
    orderCount: 0,
    address: 'S.C.O 2 & 3, Vasant Vihar, Behind Shalimar Enclave, Phase III, Dhakoli, Zirakpur, Punjab 160104',
    gstin: '03AFWPA5127P1Z4'
  },
  { 
    id: 'CHD PAINTS', 
    name: 'Chandigarh Paint Stores', 
    contactName: 'Deepak', 
    phone: '9855111160', 
    email: 'chdpaintsstore@yahoo.co.in', 
    category: 'Coatings & Finishing', 
    totalSpend: 0, 
    outstandingBalance: 0, 
    orderCount: 0,
    address: 'SCF No. 2 Chandi Path, Sector 27C, Block C, Sector 27, Chandigarh 160019',
    gstin: '04ALVPK9498E1ZD'
  },
  { 
    id: 'JAIN SONS', 
    name: 'Jain sons Stationery', 
    contactName: 'Rishab Jain', 
    phone: '9877290372', 
    email: 'jainsons_ch@yahoo.com', 
    category: 'Office Supplies', 
    totalSpend: 0, 
    outstandingBalance: 0, 
    orderCount: 0,
    address: 'Housing Board Chowk, SCO-865, NAC Manimajra, Chandigarh 160101',
    gstin: '04AAPPJ2245R1Z9'
  },
  { 
    id: 'REDINGTON', 
    name: 'Redington', 
    contactName: 'Janani', 
    phone: '9381437701', 
    email: 'N/A', 
    category: 'IT & Electronics', 
    totalSpend: 0, 
    outstandingBalance: 0, 
    orderCount: 0,
    address: 'N/A',
    gstin: 'N/A'
  },
  { 
    id: 'BALA JI', 
    name: 'M/S BALA JI ENTERPRISES', 
    contactName: 'MD', 
    phone: '8054229906', 
    email: 'N/A', 
    category: 'Raw Materials & Packing', 
    totalSpend: 0, 
    outstandingBalance: 0, 
    orderCount: 0,
    address: 'Plot No. 309, Industrial Area, Phase-2 Chandigarh',
    gstin: '06AAFCE513H1ZL'
  }
];

export const INITIAL_CATEGORIES: string[] = [
  'Office Supplies',
  'Material Handling and Packaging',
  'Agriculture Garden & Landscaping',
  'Cleaning',
  'Power Tools',
  'Hand Tools',
  'Testing and Measuring Instruments',
  'Furniture, Hospitality and Food Service',
  'Safety',
  'Hydraulics and Pneumatics',
  'Electrical',
  'IT Security',
  'Pumps',
  'Industrial Automation',
  'Automotive Maintenance and Lubricants',
  'Adhesives Sealants and Tape',
  'Lab Supplies',
  'Welding',
  'Motors & Power Transmission',
  'Medical Supplies & Equipment',
  'Abrasives',
  'Tooling and Cutting',
  'Plumbing',
  'Hardware',
  'LED & Lights',
  'Bearings',
  'Solar',
  'Unclassified'
];

export interface DeepTaxonomy {
  [category: string]: {
    [subCategory: string]: string[];
  };
}

export const PRODUCT_TAXONOMY: DeepTaxonomy = {
  'Office Supplies': {
    'Paper Products': ['Copy Paper', 'Ivory Sheets', 'Thermal Paper Rolls', 'Coloured Paper', 'Photo Paper'],
    'Stationary Items': ['Battery Cell', 'Carbon Paper', 'Chalks', 'Clipboards', 'Paper Clip'],
    'Files & Folders': ['Conference Files & Folders', 'Box Files', 'Display Files', 'Folder File', 'Expanding File'],
    'Office Furniture': ['Storage Cabinets', 'Office Chairs', 'Office Table', 'Gaming Chair', 'Chair Accessories'],
    'Pens, Pencils & Writing Supplies': ['Ball Pens', 'Correction Pen', 'Correction Tape', 'Erasers', 'Gel Pens'],
    'Envelopes & Postal Supplies': ['Envelopes', 'Glues & Adhesives', 'Tape', 'Tape Dispensers'],
    'Staplers, Removers & Punches': ['Paper Punches', 'Stapler Pin', 'Staplers', 'Tacker', 'Stapler Pin Remover'],
    'Labels & Label Makers': ['Labels', 'Label Tape', 'Barcode Label Sticker'],
    'Desk Accessories': ['Business Card Holders', 'Desk Organizer', 'Pen Holder', 'Sponge Damper Pad', 'Book Rack']
  },
  'Material Handling and Packaging': {
    'Carts, Dollies & Trolleys': ['Platform Trolley', 'Industrial Carts & Trolley', 'Luggage Trolley', 'Dollies', 'Drum Trolley'],
    'Packaging Products': ['Corrugated Boxes', 'Packaging Labels'],
    'Chain Pulley Blocks and Accessories': ['Chain Pulley Block'],
    'Hoists and Trolleys': ['Electric Hoist', 'Electric Travelling Trolley', 'Winch Machine', 'Geared Travelling Trolley', 'Ratchet Lever Hoists'],
    'Packaging Bags & Sacks': ['Bubble Poly Bag', 'Courier Bags', 'Gunny Bag', 'Polyester Bags', 'HDPE/PP Bags & Films'],
    'Ladder': ['Aluminium Ladder', 'Industrial Ladders', 'Telescopic Ladder', 'Multipurpose Ladder', 'Household Ladder'],
    'Storage Bins & Trays': ['Storage Bins', 'Plastic Trays'],
    'Tents, Tarpaulins & PE Covers': ['Tarpaulin', 'Pond Liner', 'Tent and Accessories'],
    'Protective Packaging Products': ['Bubble Wrap', 'Corrugated & Paper Rolls', 'Foam & Woven Rolls', 'Shrink Wrap', 'Stretch Film Rolls']
  },
  'Agriculture Garden & Landscaping': {
    'Harvester': ['Cultivator', 'Cultivator Accessories', 'Cultivator Attachments', 'Rotary Slashers', 'Tea Plucker'],
    'Brush Cutter and Accessories': ['Brush Cutter', 'Brush Cutter Attachments', 'Brush Cutter Spares', 'Cordless Brush Cutter', 'Grass Trimmer'],
    'Sprayers': ['Knapsack Sprayer', 'Power Sprayers', 'Pressure Sprayer', 'Sprayer Accessories'],
    'Chaff Cutter': ['Chaff Cutter Machine', 'Wood Chipper Shredder', 'Chaff Cutter Accessories'],
    'Grain Processing Machine': ['Grain Processing Machine Accessories', 'Maize Thresher', 'Disc Mill Crusher', 'Rice mill machine'],
    'Garden Hand Tools': ['Garden Tools', 'Plant Cutting Tools', 'Garden Rollers', 'Digging Tools', 'Gardening Accessories'],
    'Earth Auger': ['Earth Auger Machine', 'Earth auger Bits', 'Earth Auger Accessories', 'Wheeled Earth Auger'],
    'Chain Saws': ['Chainsaw Accessories', 'Pole Saw', 'Chain Saw Machine'],
    'Lawn Mower': ['Manual Lawn Mower', 'Grass Cutting Machines', 'Lawn Mower Blades & Accessories', 'Gang Mowers', 'Ride-On Mower'],
    'Agriculture Implements': ['Outboard Motor', 'Flower Pots']
  },
  'Cleaning': {
    'Microfiber Cloth,Towel & Waste Cloth': ['Microfiber Cloth', 'Waste Cloth'],
    'Cleaning Liquid & essentials': ['Floor Cleaner', 'Mould release, Paint & Rust remover', 'Phenyl', 'Room & Air Freshener', 'Tile & Marble cleaner'],
    'Waste & Recycling': ['Dustbins and Waste bins', 'Garbage Bag'],
    'Pressure Washers & Accessories': ['Pressure Washer', 'Pressure Washer Accessories'],
    'Vacuum Cleaners & Accessories': ['Vacuum Cleaners', 'Vacuum Machine Accessories'],
    'Wet Mops, Squeegees, and Buckets': ['Wet Mops and Accessories', 'Squeegees', 'Mop Buckets and Wringer Combinations'],
    'Tissue Paper & Cloth Wipes': ['Tissue paper', 'Toilet Paper & Seat cover']
  },
  'Power Tools': {
    'Cordless Power Tools': ['Cordless Saw', 'Battery & Chargers', 'Cordless Drills', 'Cordless Screwdriver', 'Cordless Impact Wrench'],
    'Saws & Chasers': ['Miter Saw', 'Chop saw', 'Table Saw', 'Chain Saw', 'Circular Saw'],
    'Grinders & Vibrators': ['Air Angle Grinder', 'Angle Grinders', 'Die Grinders', 'Bench Grinder', 'Concrete Grinder'],
    'Drills': ['Broach Cutter', 'Electric Drills', 'Bench drill Press', 'Impact Drills', 'Electric Screw Drivers'],
    'Electric Hammers & Breakers': ['Rotary Hammers', 'Demolition Hammers', 'Percussion Hammer'],
    'Blowers & Heat Guns': ['Electric Blower', 'Heat Guns'],
    'Power Tools Combo': ['Power Tools Combo Kit'],
    'Power Tools Attachments & Accessories': ['Power Tools Accessories', 'Spares', 'Attachments']
  },
  'Solar': {
    'Solar Parts & Accessories': ['BLDC Solar Ceiling Fan', 'Inverter & Battery Trolley', 'Solar ACDB', 'Solar Connectors', 'Solar DC Cables'],
    'Solar Charge Controllers': ['MPPT Solar Charge Controller', 'PWM Solar Charge Controller'],
    'Solar Inverters & UPS': ['Hybrid Solar Inverter', 'Solar Grid Tie Inverter', 'Solar Off Grid Inverter', 'Solar PCU Inverter', 'Solar UPS'],
    'Solar Lighting': ['Solar Bulbs', 'Solar Emergency Light', 'Solar Flood Light', 'Solar Garden Light', 'Solar LED Street Light'],
    'Solar Panels': ['Monocrystalline Solar Panel', 'Polycrystalline Solar Panel', 'Mono PERC Solar Panel', 'Solar Cells'],
    'Solar Water Pumps & Heater': ['Solar Submersible Pumps', 'Solar Water Heater', 'Solar Water Pumps'],
    'Solar Battery': ['Lithium Ion Battery', 'Solar Tubular Battery']
  },
  'Industrial Automation': {
    'Electrical Components and Material': ['Heat Shrink Tubes', 'Axial Fan Accessories', 'Battery', 'Battery and Its Accessories', 'Blank Plate'],
    'Switches and Switch Boxes': ['Actuators', 'Basic Switch', 'Bell Switches', 'Command Switches', 'Control Boxes'],
    'Relay': ['AC Relay', 'Auxiliary Relays', 'Bi-Metal Relay', 'Control Relay', 'Coupling Relay'],
    'Contactor and Accessories': ['Duty Contactors', 'AC Contactors', 'Auxiliary Contactors', 'Block Contactors', 'Capacitor Contactor'],
    'Sensors and Controllers': ['Cylindrical Proximity Sensor', 'Door Sensor', 'Fingerprint Scanner', 'Industrial Displacement Sensor', 'Misc Sensors and Controllers'],
    'Connector': ['Alligator Clips', 'Bus Connector', 'Connector Housings', 'Dupont Connectors', 'Receptacles'],
    'Measuring Equipment and Instrument': ['Ammeter', 'Analog Meters', 'Batch Counters', 'Compact Counter', 'Electronic Counter'],
    'Programmable Logic controllers (PLC)': ['Misc Programmable Logic controllers (PLC)', 'PLC Accessories'],
    'Lights and Illumination': ['Automatic Blinking Device', 'Flashing Lights', 'LED Lights Indicators', 'Light Indicator', 'Lights'],
    'Timers': ['Analog Timer', 'Cyclic Timer', 'Digital Timer', 'Solid State Timers', 'Timer Switch']
  },
  'Automotive Maintenance and Lubricants': {
    'Car Cleaning and Detailing': ['Car Care', 'Cleaners', 'Paints and coatings', 'Automotive Polishers Accessories', 'Car Washer'],
    'Automotive Oil & Lubricants': ['Additives', 'Antifreeze & Coolants', 'Brake Oil', 'Engine Oil', 'Fuel Pumps'],
    'Automotive Lightings': ['Car Headlight Kit', 'Fog Lights', 'Taillight', 'Bulb', 'Automotive LED Lights'],
    'Automotive Exterior Accessories': ['Car Cover', 'Wheel Cover', 'Antenna', 'Beading Roll', 'Blind Spot Mirror'],
    'Automotive Body Parts': ['Automotive - Made In Japan', 'Automotive Spares and Accessories', 'Seat Belt', 'Spring Assembly for Vehicles', 'Screw'],
    'Vehicle Tools': ['Tyre Repair Tools & kit', 'Jumpstart Wires', 'Tire Scrapper Tool', 'Emergency Tools'],
    '2 Wheeler Accessories': ['Bike Accessories', 'Bike Cover', 'Bike Safety', 'Helmets', 'Kawasaki Made in Japan Motorcycle Parts'],
    'Automotive Interior Accessories': ['Car Air Fresheners', 'Car Audio', 'Car Vacuum Cleaners', 'Key Chain', 'Navigation & GPS'],
    'Automotive Filters': ['Vehicle Oil Filters', 'Cabin Filter', 'Fuel Filters', 'Oil Filters', 'Transmission Filters'],
    'Automotive Electricals': ['Battery Charger for Vehicles', 'Fuel Pump Motors', 'Horns', 'Power Window Motor', 'Sensor & Relay']
  },
  'Adhesives Sealants and Tape': {
    'Tapes': ['Aluminium Tapes', 'Anti Skid Tape', 'Cloth Tapes', 'Duct Tapes', 'Foam Tapes'],
    'Repairing Adhesives': ['Belt Repairs & Urethanes', 'Crack Filler', 'Polyester Putty', 'Knifing Paste Filler'],
    'Anaerobic Adhesives': ['Gasketing Compounds', 'Retaining Compounds', 'Thread Sealants', 'Threadlockers'],
    'Solvent Based Adhesives': ['PVC adhesives', 'Rubber & Contact Adhesives', 'Spray Adhesive', 'Solvent Cements', 'PVA Adhesive'],
    'Structural Adhesives': ['Acrylic Adhesives', 'Light Cure Adhesives', 'Chemical Fixing and Mortars'],
    'Adhesive Gum': ['Adhesive Binder', 'Glue Stick', 'Fabric Glue', 'Bonding Agent'],
    'Sealants': ['Sealant Kits', 'Silicone Sealants', 'Polyurethane Sealant', 'Polysulphide Sealant', 'Gasket Sealant'],
    'Waterproofing': ['Leak Sealers', 'Roof Waterproof coatings', 'Tapcrete and Thermoseal', 'Waterproofing additives'],
    'Tile Adhesives': ['Cements Concrete & Asphalts', 'Marble & Granite Adhesives', 'Stone & Tile Adhesives'],
    'Surface Preparation': ['Rust Remover', 'Sealant Removers & degreaser', 'Stainer', 'Mould Release Agents', 'Surface Preparation Coatings']
  },
  'Lab Supplies': {
    'Laboratory Equipments': ['Polarimeter', 'General Laboratory Equipments', 'Shieve Shaker', 'Oil Bath', 'Thermal cycler'],
    'Laboratory Glassware': ['Glassware Assembly', 'Sintered Ware', 'Lab Stopper', 'Lab Accessories', 'Glass Vials'],
    'Lab Utilities': ['Tape, Labels And Seal', 'Parafilm', 'Weighing Dishes', 'Dispenser & Diluters', 'Support Stands'],
    'Laboratory Plasticware': ['Plastic Gas Generator', 'Plastic Gas Sampling Tubes', 'Impingers & Bubblers', 'Multi Well Plates', 'Other Plasticwares'],
    'Filteration & Seperation': ['Filter Papers', 'Syringe Filters', 'Membrane Filter', 'Filtering Funnels', 'Syringeless Filter'],
    'Lab Chemicals': ['pH Indicators', 'Analytical Reagents', 'Silica Gels', 'Calibration Solutions', 'Buffer Solution'],
    'Lab Necessities': ['Respirators', 'Wipes', 'Lab Goggles', 'Lab Markers', 'Lab Coats & Aprons'],
    'Lab Storage Organizers': ['Mini Cooler', 'Liquid Nitrogen canister', 'Technical Trial test3', 'Lab Boxes', 'Lab Trays'],
    'Lab Science Models': ['Atomic Model', 'Biological Model', 'Physics Model']
  },
  'Welding': {
    'Welding Machine': ['Arc Welding Machine', 'MIG Welding Machine', 'TIG Welding Machine', 'Spot Welding Machine', 'Air Plasma Cutting Machine'],
    'Welding Safety Gears': ['Welding Apron & Accessories', 'Welding Blanket', 'Welding Booth', 'Welding Curtains', 'Welding Gloves'],
    'Welding Electrodes': ['Hardfacing Electrodes', 'Low Hydrogen Electrodes', 'MS Welding Rod', 'Stainless Steel Electrodes', 'TIG Rod'],
    'Soldering Equipment': ['Soldering Iron', 'Soldering Kits', 'Soldering Pots', 'Soldering Station', 'SMD Rework Station'],
    'Welding Tools & Accessories': ['Earthing Clamp', 'Electrode Holder', 'Welding Tools', 'Electrode Drying Oven', 'Weld Flux Removal'],
    'Welding Wire & Cable': ['Filler Wire', 'Welding Cables', 'Copper Welding Cable', 'MIG Welding Wire', 'Saw Welding Wire'],
    'Cutting Torch': ['Gas Cutting Torch', 'Plasma Cutting Torch'],
    'Gas Cutting Accessories': ['Cutting Nozzle', 'Nozzle', 'Gas Economiser', 'Gas Adapters', 'Gas Pressure Regulator'],
    'Soldering Spares and Accessories': ['Solder Iron Stand', 'Soldering Spares', 'Soldering Bit', 'Hakko Soldering Supplies Made In Japan', 'Solder Wire']
  },
  'Motors & Power Transmission': {
    'Single Phase Motors': ['Single Phase General Purpose Motor'],
    'Industrial Coolers, Blowers & Fans': ['Blowers', 'Fans', 'Air Ventilator', 'Ventilation Ducts'],
    'Industrial V-Belts': ['Classical Belts', 'FHP Belts', 'HEMM Belts', 'Harvester Combine Belts', 'Hexagonal Belts'],
    'Three Phase Motors': ['Three Phase General Purpose Motor', 'Three Phase Industrial Motor'],
    'DC Motors': ['General Purpose DC Motors', 'Servo Cable', 'Stepper Motors', 'BLDC Motors', 'DC Motor Control Panels'],
    'Motor Starters & Spares': ['Motor Starter Spares', 'Motor Starters'],
    'Power Transmission Tools': ['Gear Boxes', 'Linear Guide', 'Sprockets & Chains', 'V Belt Pulleys'],
    'Motor Spares & Accessories': ['Motor Spares', 'Motor Circuit Breaker'],
    'Special Purpose Motors': ['Energy Efficient Motors', 'Slip Ring Motors', 'Open Drip Proof Motors', 'Brake Motors', 'Crane and Hoist Duty Motors'],
    'Alternators & Generators': ['Ac Alternators']
  },
  'Medical Supplies & Equipment' : {
    'Hospital Furniture & Equipments': ['Hospital Beds', 'Cabinet, Drawers & Bed Side Lockers', 'Examination Table', 'Over Bed Table', 'Hospital Stools'],
    'Medical Accessories': ['Blood Glucose Monitors', 'Height Measuring Scale', 'Medical Models and Charts'],
    'Medical Consumables': ['Diapers and Pants', 'Biohazard bags', 'Bandage', 'Surgical Caps', 'Surgical Gloves'],
    'Diagnostic Products': ['Xray Equipment', 'Infant Care Accessories', 'Body Composition Monitor', 'Pulse Oximeter', 'Hemoglobin Meter'],
    'Fitness and Health care': ['Hearing Machine & Components', 'Insoles & Heel Cups', 'Fitness Equipments', 'Massagers', 'Health Safety'],
    'Mobility Aid': ['Commode', 'Walker', 'Walking Sticks', 'Wheel Chair', 'Crutches'],
    'Braces, Splints & Supports': ['Ankle & Foot Supports', 'Arm Supports', 'Back Support', 'Body Belts', 'Elbow Support'],
    'Respiratory Care': ['Vaporiser', 'Nebulizer', 'Respiratory Equipments', 'Portable oxygen canister', 'Respiratory Exerciser'],
    'Medical Clothing': ['Surgeon Caps', 'Patient Gown', 'Scrub Suits', 'Disposable Shoe Cover', 'Lab Coat'],
    'Gynaecology & Infant Care': ['Infant radiant warmer', 'Baby Bassinet', 'Feeding Pump', 'Photo Therapy Units', 'Medical Accessories']
  },
  'Abrasives': {
    'Cutting Blades & Disc': ['Circular Saw Blade', 'Diamond Cutting Disc', 'Diamond Saw Blades', 'TCT Saw Blades', 'Wood and Marble Cutting Blades', 'Carbide Blades'],
    'Abrasive Disc': ['Fibre Disc', 'Flap Disc', 'Non-Woven Discs', 'Flexible Grinding Discs', 'Sanding Disc', 'Polishing Disc'],
    'Abrasive Tools and Accessories': ['Emery Paste', 'Mounted Points', 'Rotary Grinding Tool Kit', 'Sharpening Stones', 'Abrasive Accessories', 'Stone dresser'],
    'Abrasive Sheets': ['Emery Paper Sheets', 'Sand Paper Sheets', 'Wet & Dry Sheets', 'Polishing Sheets'],
    'Abrasive Belts': ['Sanding Belts', 'Cloth Narrow Belts', 'Zirconia Belts'],
    'Abrasive Wheels': ['Flap Wheels', 'Non-Woven Wheels', 'Cylindrical Wheel', 'Control Wheels', 'Crank Shaft Wheels', 'Bench Grinder Wheels', 'Depressed Center Wheels'],
    'Industrial & Machine Brushes': ['Tube Brush', 'Wire Brushes', 'Wire Cup Brush', 'Wire Wheel Brushes', 'Hand Brushes'],
    'Abrasive Pads': ['Non-Woven Hand Pads', 'Absorption Pad', 'Backup Pad', 'Foam Pad', 'Non-Woven Pads', 'Scrub Pads'],
    'Sanding & Polishing': ['Buffing Disc & Wheel', 'Felt Disc & Wheels', 'Polishing Disc & Wheels', 'Disc Sanders', 'Lapping Plates', 'Polishing Compound'],
    'Abrasive Rolls': ['Cloth Rolls', 'Paper Rolls', 'Sponge Rolls']
  },
  'Tooling and Cutting': {
    'Drilling Tools': ['Drill Accessories', 'Drill Kit', 'NC Spotting Drills', 'Shell Core Drills', 'Reduced Shank Drills'],
    'Milling Tools': ['Aluminium End mill', 'Annular Cutter', 'Ball Nose End Mill', 'CBN End Mills', 'Carbide End Mill'],
    'Cutting Blades': ['Hacksaw Blades', 'Glass Cutting Tools', 'Diamond Dressing Tools', 'Bandsaw Blades', 'Carbide Tipped Blades'],
    'Threading Tools': ['Fluteless Taps', 'Hand Taps', 'Machine Taps', 'Nut Taps', 'Pipe Taps'],
    'Holesaws': ['Bimetal Hole Saw', 'Holesaw Kits', 'Holesaw Cutter', 'Holesaw Accessories', 'TCT Hole Saw'],
    'Tool Holders': ['Adaptors', 'Collet Adaptors', 'Collets', 'ER Collet Chucks', 'ER Collets'],
    'Machine Accessories': ['coolant Pipes', 'Pull Studs', 'Split Sleeves', 'Tool Clamping Fixture', 'Hydrogrip Sleeves'],
    'Carbide Burrs': ['Ball Burrs', 'Cone Burrs', 'Conical Burrs', 'Cylindrical Burrs', 'Flame Burrs'],
    'Reaming Tools': ['Center Reamer', 'Hand Reamer', 'Machine Reamer', 'Pipe Reamer', 'Shell Reamer'],
    'Tungsten Carbide Tipped Tools': ['Parting Off Tools', 'Boring Tool', 'Cranked Finishing Tool', 'Recessing Tool', 'Round Nosed Turning Tool']
  },
  'Plumbing': {
    'Faucets and Showers': ['Basin Faucets', 'Kitchen Faucets', 'Health Faucets', 'Showers', 'Shower Accessories', 'Jet Spray faucet'],
    'Pipe Fittings': ['Agriculture Fittings', 'CPVC Fittings', 'Construction Fittings', 'Drainage Fittings', 'Metal Pipe Fittings', 'Couplings', 'Elbows', 'Tees', 'Reducers'],
    'Industrial Valves': ['Air Valves', 'Ball Valves', 'Butterfly Valve', 'Check Valves', 'Gate Valves', 'Globe Valves', 'Knife Gate Valves', 'Solenoid Valves'],
    'Bathroom Accessories': ['Bathroom Mirrors', 'Bathroom Rack', 'Cloth Hanger', 'Soap Dish', 'Grab Bars', 'Towel Rail'],
    'Industrial Water Purifiers': ['RO Spare Parts', 'Filtration Systems', 'RO Control Panel', 'Industrial Purifiers'],
    'Sanitaryware and Kitchen Sinks': ['Flush Tank', 'Kitchen Sinks', 'Plumbing Traps', 'Sanitary Fixing Sets', 'Toilet Seat Covers', 'Closets'],
    'Pipes': ['CPVC Pipes', 'Connection Pipe', 'Drainage Pipe', 'Metal Pipes', 'PPR Pipes', 'Braided Hoses'],
    'Sewerage & Drainage Products': ['Floor Trap', 'Manhole Covers', 'Gully Trap'],
    'Separators and Strainers': ['Moisture Seperator', 'Strainers', 'Y-Strainers'],
    'Watering System': ['Water Tank', 'Water Tank Accessories', 'Hose Pipe']
  },
  'Hardware': {
    'Door Hardware': ['Tower bolt', 'Door Stopper', 'Sliding Door Fitting', 'Aldrop Lock', 'Door Viewer', 'Door Handles'],
    'Hardware Accessories': ['Drawer Slides', 'Furniture Accessories', 'Handrail', 'Hook', 'Telescopic Channel', 'Shelf Support'],
    'Lock': ['Bicycle Lock', 'Door Lock Set', 'Double Door Lock', 'Drawer Lock', 'Mortise Lock', 'Padlocks'],
    'Door Closer': ['Concealed Door Closer', 'Hold Open Door Closer', 'Overhead Door Closer', 'Floor Spring'],
    'Glass Hardware': ['Aluminium Profile', 'Floor Spring', 'Glass Door Hinge', 'Glass Door Lock', 'Glass Lifter', 'Spider Fitting'],
    'Handle': ['Drawer Handle', 'Mortise Handle', 'Door Pull Handle', 'Glass Door Handle', 'Cabinet Handle'],
    'Hinge': ['Butt Hinge', 'Hydraulic Hinge', 'Piston Hinge', 'Pivot Hinges', 'Piano Hinge'],
    'Anchor': ['Anchor Bolt', 'Anchor Hook', 'Anchor Rod', 'Chemical Anchor', 'Frame Anchor', 'Heavy Duty Anchor'],
    'Bolt': ['Bolt With Nut', 'Coach Bolt', 'Dom Bolt', 'Eye Bolt', 'Hex Bolt', 'U-Bolt'],
    'Fasteners Accessories': ['Blowing Pump', 'Brush', 'Bush', 'Compression Spring', 'Extension Spring', 'Washers']
  },
  'LED & Lights': {
    'Industrial Led Lights': ['Aviation Light', 'Ceiling Luminaires', 'Industrial Lights', 'LED Canopy Light', 'LED Exit Signage'],
    'Led Torch & Emergency Light': ['Hand Torch & Lamps', 'LED Emergency Light'],
    'Light Bulbs': ['LED Filament Bulbs', 'Led Bulbs', 'Rechargeable Led Bulbs', 'Smart Led Bulbs'],
    'Lighting Accessories': ['Choke (Ballast)', 'LED Driver', 'LED Accessories'],
    'LED Panel Light': ['Recessed Led Panel Lights', 'Round Led Panel Lights', 'Smart Led Panel Lights', 'Square Led Panel Lights'],
    'Led Tube Lights and Battens': ['LED Tube Light', 'Rechargeable Led Battens', 'Smart Led Battens'],
    'Decorative Lights': ['Decorative Ceiling Light', 'Hanging Lights', 'Home Decor Lights', 'LED Strip Lights', 'LED Wall Lights']
  },
  'Bearings': {
    'Ball Bearings': ['Angular Contact Ball Bearings', 'Cross Bearings', 'Deep Groove Ball Bearings', 'Four Point Contact Ball Bearings', 'Insert Ball Bearings'],
    'Roller Bearings': ['Cylindrical Roller Bearings', 'Needle Roller Bearings', 'Spherical Roller Bearings', 'Spherical Roller Plain Bearings', 'Tapered Roller Bearings'],
    'Thrust Bearings': ['Thrust Roller Bearings'],
    'Bearings Accessories': ['Adapter Sleeves', 'Seal Rings', 'Rod End Bearings', 'Hub Bearing Unit', 'Bearing Washers'],
    'Pedestal Bearings': ['Flange Bearings', 'Pillow Block Bearings', 'Plummer Block', 'Screw Conveyor Bearings'],
    'Industrial Bearings': ['Linear Bearings', 'Take-up Bearings'],
    'Automotive Bearings': ['Cam Follower Bearings', 'Centre Bearings', 'Clutch Bearings', 'Drac Hub Bearings', 'King Pin Bearings']
  },
  'Testing and Measuring Instruments': {
    'Dimension Measurement': ['Dial Gauge', 'Digital Indicator', 'Mitutoyo Japan Mesuring Instruments', 'Surface Plate', 'Zero Setter'],
    'Weighing Scales and Systems': ['Crane Scales', 'Scale Accessories', 'Weighing Machine Accessories', 'Price Computing Bench Scale', 'Load Cell'],
    'Electrical Power Testing': ['Instrument Combination Kits', 'Test Instrument Carrying Cases', 'Other Electrical Instruments', 'Electric Motor Checker', 'Ac Power Supply'],
    'Non Electrical Properties Testing': ['Shore Hardness Tester (Durometer)', 'Distance Meter', 'Digital Angle Meter', 'Tachometer Accessories', 'Radiation Detectors'],
    'Temperature & Humidity Measuring': ['Temperature Indicating Labels', 'Infrared Thermometer', 'Digital Thermo Hygro Meter', 'Digital Contact Type Thermometer', 'Thermal Imaging Camera'],
    'Flow Meters': ['Water Flow Meter', 'Fuel Meters', 'Oil Measurer', 'Electromagnetic Flow Meters', 'Flow Meter Accessories'],
    'Pressure & Vaccum Gauge': ['Pressure Gauge', 'Pressure Transmitter', 'Pressure & Temperature Test Kits', 'Digital Pressure & Vaccum Gauge', 'Temperature Gauges'],
    'Air Quality & Measuring': ['Halogen Leak Detectors', 'Combustible Gas Detectors', 'Ultrasonic Leak Detectors', 'Anemometers', 'Gas Analyzers'],
    'Electronic Testing': ['Digital Transistor Tester', 'Digital Distortion Meter', 'SMD Tester', 'Capacitance Box', 'Inductance Box'],
    'Data Loggers': ['Temperature & Humidity Logger', 'Electrical Properties Data Logger', 'Multi Function Logger', 'Data Loggers Accessories', 'Energy Logger']
  },
  'Furniture, Hospitality and Food Service': {
    'Furniture': ['Plastic Chairs', 'Furniture Table', 'Trolley & Racks', 'Office Furniture Made in Japan', 'Lounge Chair'],
    'Commercial Kitchen Appliances And Equipments': ['Blender', 'Candy Floss Machine', 'Conveyor Toaster', 'Dishwashers', 'Electric Proofer'],
    'Disposables': ['Fork, Knife, Spoon & Straws', 'Paper Cups', 'Tray And Plates', 'Containers & Boxes'],
    'Commercial Refrigeration': ['Deep Freezer', 'Refrigerators', 'Visi Cooler', 'Wine Chiller', 'Back Bar Chiller'],
    'FMCG Packaging & Wrapping': ['Food Wrapping Paper', 'Packaging Machines'],
    'Tea Coffee & Beverages': ['Coffee', 'Coffee Machine', 'Dairy Whitener/Powder Milk', 'Sugar', 'Tea'],
    'Laundry Machine And Appliances': ['Industrial Iron', 'Washing Machine', 'Garment Steamer And Accessories', 'Iron', 'Industrial Iron Accessories'],
    'Purifiers': ['Water Purifier', 'Vegetable & Fruit Purifier']
  },
  'Safety': {
    'Safety Gloves': ['Chemical Resistance Gloves', 'Cut Resistance Gloves', 'Disposable Gloves', 'Special Purpose Gloves', 'Hand Safety Accessories'],
    'Eye Protection': ['Emergency Eyewash and Shower Equipment', 'Safety Goggles'],
    'Safety Wear': ['Raincoats', 'Reflective Jackets'],
    'Safety Helmets': ['Industrial Safety Helmets'],
    'Road Safety Equipments': ['Delineator and Centre Verge', 'Road Studs', 'Barricade Tape and Reflectors', 'Corner Guard & Wheel Stopper', 'Safety Led Baton and Warning lights'],
    'Workwear': ['Industrial Workwear', 'Safety Aprons'],
    'Public Address Systems': ['Megaphones', 'Call Station and Communication System', 'Amplifier & Audio mixer', 'Speakers', 'Siren'],
    'Respiratory Protection': ['Respirator Accessories', 'Respiratory Protection Equipments', 'Air Filtration System', 'Respiratory Mask']
  },
  'Hydraulics and Pneumatics': {
    'Air Compressors and Accessories': ['Air Compressors', 'Compressor Spares', 'Gas Compressors', 'Air Receiver', 'Measurement Gauges'],
    'Hydraulic & Pneumatic Tools': ['Air Impact Wrench & Screw Driver', 'Air Spray Gun', 'Grease Gun & Accessories', 'Hydraulic Tools', 'Milling Cutters'],
    'Pneumatic System Components': ['Cylinder Accessories', 'Hydraulic & Pneumatic Cylinder', 'Industrial Bellow', 'Magnetic Switch & Sensors', 'Pneumatic Accessories'],
    'Hoses & Hose Fittings': ['Hydraulic Hose and Reel', 'Pipe Fittings', 'Pneumatic Hose Clamps'],
    'Filtration': ['Air Filters, Regulators & Accessories', 'Filter Regulator'],
    'Hydraulic & Pneumatic Equipment': ['Hydraulic Machinery', 'Hydraulic Pump', 'Pneumatic Machines', 'Hydraulic Accumulators', 'Pneumatic Grease Pump'],
    'Hydraulics': ['Hydraulic Shock Absorbers', 'Couplings', 'Hydraulic Jacks', 'Oil Coolers'],
    'Hydraulic Filters': ['Return Line Filters', 'Air Diffuser', 'Hydraulic Filter Element', 'Spin-on Filter', 'Fuel Filter'],
    'Pneumatic Equipment': ['Air Operated Equipment'],
    'HVAC': ['FHP Compressor', 'Can Tap Valve', 'Charging Hose', 'Gauges', 'Hand Shut Off Valve']
  },
  'IT Security': {
    'Network Components': ['Network Cables', 'Patch Cord', 'Routers & Access Point', 'Ethernet Switches', 'Wireless USB Adapters'],
    'Software': ['Accounting Software', 'Antivirus', 'Business Software', 'CRM Software', 'Office Suites'],
    'Speaker & Headphones': ['Amplifiers', 'Audio Mixer', 'MIC', 'Speakers'],
    'Storage Devices': ['Hard Disks', 'Memory Card', 'Network Attached Storage', 'Pen Drive', 'Solid State Drive/SSD'],
    'Computer Accessories': ['Card Reader', 'Desktop Table/Stand/Trolley', 'Keyboard', 'Keyboard & Mouse Sets', 'Microphone and Accessories'],
    'Communication': ['Conference Phones', 'Intercom System', 'Landline Phones', 'Wireless Microphone', 'Walkie Talkie'],
    'Mobiles & Accessories': ['Mobile Charger', 'Features Phone', 'Mobile Stand', 'Power Bank', 'Power Bank Circuit Board'],
    'Label Printer & Accessories': ['Label Printer', 'Printer Ribbons', 'Label Printer Tape'],
    'Computer Components': ['Computer Cabinet', 'Graphic Cards', 'Network Interface Card (Lan Cards)', 'Power Supply/SMPS', 'Processor'],
    'Monitors': ['LCD Monitor', 'Touch Monitor']
  },
  'Electrical': {
    'Air Coolers and Fans': ['Air Coolers', 'Ceiling Fans', 'Exhaust Fan', 'HVLS Fans', 'Mist Fans'],
    'Stabilizers, Inverters, UPS and Batteries': ['Non Rechargeable Battery', 'Inverter & UPS', 'Stabilizer', 'Inverter Battery', 'SMF Battery'],
    'Cables and Wire': ['Co-Axial Cables', 'Flame Retardant (FR) House Wires', 'Flame Retardant Low Smoke & Halogen (FR-LSH)', 'Flat Elevator Cables', 'Flexible Single & Multicore Cables'],
    'Cable and Wiring Components': ['Cable Drums', 'Cable Ties', 'Insulators', 'Tube End Caps', 'Cable Clips'],
    'Fuses, Circuit Breakers & Components': ['AC Circuit Breaker', 'Air Circuit Breaker (ACB)', 'Automatic Circuit Breaker', 'Change Over switch', 'Earth Leakage Circuit Breaker (ELCB)'],
    'Switches, Sockets, Plugs and Connectors': ['Fan Regulators', 'LED Dimmer', 'Rotary Switch', 'Adaptors Plugs & socket', 'Electrical Switch'],
    'Electrical & Electronic Connectors': ['Cable Glands', 'Electronic Connectors'],
    'Generators & Transformers': ['Portable Generators', 'Electrical Transformer'],
    'Alarms, Detector & Devices': ['Alarm & Door Bells'],
    'Electrical Panels & Distribution Box': ['AMF Panel', 'Distribution Box', 'Junction Boxes', 'Busbar System']
  },
  'Pumps': {
    'Water Pumps': ['Centrifugal Pumps', 'Domestic Monoblock Pump', 'Industrial Monoblock Pumps', 'Washing pumps', 'HTP Spray Pump'],
    'Submersible Pumps': ['Borewell Submersible Pumps', 'Cooler Pumps', 'Openwell Submersible Pump', 'Swimming Pool Pumps'],
    'Sewage Pumps': ['Dewatering Sump Pumps', 'Mud Pump', 'Sewage Submersible Pump'],
    'Pump Accessories': ['Pump Protection Unit', 'Pump Starter', 'Valves', 'Fittings & Cables', 'Float Switch'],
    'Grease Pumps': ['Bucket Grease Pumps', 'Air Operated Grease Pump', 'Portable Grease pumps', 'Electrical Fuel Pump', 'Grease Pump Accessories'],
    'Jet Pump': ['Shallow Well Jet Pump', 'Jet Monobloc Pump'],
    'Booster Pumps': ['Booster Pressure Pump', 'Compressor Pump Sets', 'RO Booster Pump'],
    'Special Use Pumps': ['Electric Testing Pumps', 'End Suction Pump', 'Magnetic Drive Pumps', 'Vane Pumps', 'Air Operated Double Diaphragm Pumps'],
    'Self Priming Pumps': ['Self Priming Bare Shaft Pump', 'Self Priming Coupled Pump'],
    'Fuel & Oil Transfer Pump': ['Refrigeration Compressor Oil', 'Air Operated Oil Pump', 'Bucket Oil Pump', 'Electrical Oil Pump', 'Piston Pump']
  }
};

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'p-1',
    name: 'High Tensile Bolt M12',
    brand: 'PrecisionPlus',
    packSize: '50pcs',
    unitType: 'box',
    category: 'Fasteners',
    price: 1499,
    stock: 45,
    costPrice: 1124,
    lastBuyPrice: 1124,
    vatRate: 18,
    barcode: "5040000000000",
    sku: "ENG-FAST-101",
    minStock: 10,
    status: 'Active',
    origin: 'India',
    supplierId: 'sup-1',
    shelfLocation: 'Section A, Shelf 12'
  }
];

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Master Monitor', icon: '📊' },
  { id: 'sales', label: 'Point of Sale', icon: '🛒' },
  { id: 'inventory', label: 'Stock Console', icon: '📦' },
  { id: 'ai-command', label: 'Center', icon: '🧠' },
  { id: 'purchases', label: 'Procurement', icon: '📥' },
  { id: 'staff', label: 'Workforce', icon: '👥' },
  { id: 'financials', label: 'Ledger', icon: '📕' },
  { id: 'system-health', label: 'Mission Control', icon: '🛡️' },
  { id: 'help-support', label: 'Help & Support', icon: '❓' },
  { id: 'about-us', label: 'About Us', icon: '🏭' },
];

export const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'admin-001',
    name: 'ENGLABS ADMIN',
    role: 'Owner',
    contractType: 'Full-time',
    pin: '0001',
    loginBarcode: 'ENG-ADMIN-01',
    rightToWork: true,
    emergencyContact: 'HQ',
    joinedDate: '2026-04-01',
    status: 'Active',
    monthlyRate: 0,
    hourlyRate: 0,
    dailyRate: 0,
    advance: 0,
    holidayEntitlement: 28,
    accruedHoliday: 0,
    niNumber: 'ADMIN-PAN',
    taxCode: 'ADMIN-AADHAR',
    photo: '/assets/englabs_logo.png'
  },
  {
    id: '1',
    name: 'Bharat Anand',
    role: 'Owner',
    contractType: 'Full-time',
    pin: '1111',
    loginBarcode: 'OWNER01',
    rightToWork: true,
    emergencyContact: 'Family',
    joinedDate: '2025-01-01',
    status: 'Active',
    monthlyRate: 0,
    hourlyRate: 0,
    dailyRate: 0,
    advance: 0,
    holidayEntitlement: 28,
    accruedHoliday: 0,
    niNumber: 'PAN Placeholder',
    taxCode: 'Aadhar Placeholder',
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  {
    id: '4',
    name: 'Salil Anand',
    role: 'Business Coordinator',
    contractType: 'Full-time',
    pin: '4444',
    loginBarcode: 'OWNER02',
    niNumber: 'PAN Placeholder',
    taxCode: 'Aadhar Placeholder',
    rightToWork: true,
    emergencyContact: 'Family',
    joinedDate: '2025-01-01',
    status: 'Active',
    monthlyRate: 0,
    hourlyRate: 0,
    dailyRate: 0,
    advance: 0,
    holidayEntitlement: 28,
    accruedHoliday: 0,
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  {
    id: '5',
    name: 'Gaurav Panchal',
    role: 'Manager',
    contractType: 'Full-time',
    pin: '5555',
    loginBarcode: 'MGR01',
    niNumber: 'PAN Placeholder',
    taxCode: 'Aadhar Placeholder',
    rightToWork: true,
    emergencyContact: 'Family',
    joinedDate: '2025-02-01',
    status: 'Active',
    monthlyRate: 0,
    hourlyRate: 15.00,
    dailyRate: 0,
    advance: 0,
    holidayEntitlement: 28,
    accruedHoliday: 0,
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },


  {
    id: '8',
    name: 'Nayan Kumar Godhani',
    role: 'Shop Assistant',
    contractType: 'Part-time',
    pin: '8888',
    loginBarcode: 'STK02',
    niNumber: 'PAN Placeholder',
    taxCode: 'Aadhar Placeholder',
    rightToWork: true,
    emergencyContact: 'Family',
    joinedDate: '2025-02-01',
    status: 'Active',
    monthlyRate: 0,
    hourlyRate: 11.44,
    dailyRate: 0,
    advance: 0,
    holidayEntitlement: 28,
    accruedHoliday: 0,
    photo: 'https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  {
    id: '9',
    name: 'Nisha',
    role: 'Shop Assistant',
    contractType: 'Part-time',
    pin: '9999',
    loginBarcode: 'STK03',
    niNumber: 'PAN Placeholder',
    taxCode: 'Aadhar Placeholder',
    rightToWork: true,
    emergencyContact: 'Family',
    joinedDate: '2025-02-01',
    status: 'Active',
    monthlyRate: 0,
    hourlyRate: 11.44,
    dailyRate: 0,
    advance: 0,
    holidayEntitlement: 28,
    accruedHoliday: 0,
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  {
    id: '10',
    name: 'Paras',
    role: 'Manager',
    contractType: 'Part-time',
    pin: '1010',
    loginBarcode: 'MGR02',
    niNumber: 'PAN Placeholder',
    taxCode: 'Aadhar Placeholder',
    rightToWork: true,
    emergencyContact: 'Family',
    joinedDate: '2025-02-01',
    status: 'Active',
    monthlyRate: 0,
    hourlyRate: 11.44,
    dailyRate: 0,
    advance: 0,
    holidayEntitlement: 28,
    accruedHoliday: 0,
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  {
    id: '11',
    name: 'Parth',
    role: 'Business Coordinator',
    contractType: 'Part-time',
    pin: '1212',
    loginBarcode: 'MGR03',
    niNumber: 'PAN Placeholder',
    taxCode: 'Aadhar Placeholder',
    rightToWork: true,
    emergencyContact: 'Family',
    joinedDate: '2025-02-01',
    status: 'Active',
    monthlyRate: 0,
    hourlyRate: 11.44,
    dailyRate: 0,
    advance: 0,
    holidayEntitlement: 28,
    accruedHoliday: 0,
    photo: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },

];

export const CLEANING_ROTA = {
  daily: [
    '08:30-08:45: Facility walkthrough, safety check',
    '08:45-09:00: Workstation sanitation',
    '09:00-09:10: Tool inventory verification',
    '09:10-09:20: PPE replenishment',
    '09:20-09:30: High-touch surface cleaning',
    'Every 2h: Waste bin check & removal',
    '13:00-13:15: Break room inspection',
    '17:00-17:10: Loading bay clearance',
    '20:30-21:00: Full floor wash, machine covers'
  ],
  weekly: {
    Monday: 'Deep floor scrubbing',
    Tuesday: 'Racking & shelf alignment',
    Wednesday: 'HVAC filter inspection',
    Thursday: 'Hazardous waste audit',
    Friday: 'Equipment calibration check',
    Saturday: 'Exterior & perimeter check',
    Sunday: 'Full facility deep cleaning'
  },
  monthly: [
    'Fire safety system audit',
    'Electrical panel inspection',
    'Material handling equipment service',
    'First aid kit replenishment',
    'Pest control certification'
  ]
};
