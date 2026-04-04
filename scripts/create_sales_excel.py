import pandas as pd

data = [
    {
        "Date": "2026-01-01",
        "Alcohol": 11.54,
        "Tobacco": 70.25,
        "Drinks": 12.01,
        "Groceries": 15.30,
        "Snacks": 4.29,
        "Confect": 1.05,
        "Paypoint": 20.95,
        "Household": 0.00,
        "Misc": 10.00,
        "Total Category": 145.39,
        "Cash Component": 65.95,
        "Cash Purchase": 0.00
    },
    {
        "Date": "2025-12-30",
        "Alcohol": 69.79,
        "Tobacco": 182.55,
        "Drinks": 55.76,
        "Groceries": 104.44,
        "Snacks": 57.21,
        "Confect": 30.58,
        "Paypoint": 101.50,
        "Household": 0.00,
        "Misc": 8.56, 
        "Total Category": 610.39,
        "Cash Component": 331.59,
        "Cash Purchase": 0.00
    },
    {
        "Date": "2025-12-29",
        "Alcohol": 106.19,
        "Tobacco": 60.51,
        "Drinks": 38.51,
        "Groceries": 98.77,
        "Snacks": 17.02,
        "Confect": 16.11,
        "Paypoint": 0.00,
        "Household": 4.37,
        "Misc": 1.50,
        "Total Category": 342.98,
        "Cash Component": 130.28,
        "Cash Purchase": 0.00
    },
    {
        "Date": "2025-12-28",
        "Alcohol": 48.80,
        "Tobacco": 31.83,
        "Drinks": 3.59,
        "Groceries": 106.33,
        "Snacks": 22.73,
        "Confect": 20.82,
        "Paypoint": 0.00,
        "Household": 0.00,
        "Misc": 18.41,
        "Total Category": 252.51,
        "Cash Component": 50.74,
        "Cash Purchase": 0.00
    },
    {
        "Date": "2025-12-27",
        "Alcohol": 67.70,
        "Tobacco": 111.62,
        "Drinks": 43.18,
        "Groceries": 51.58,
        "Snacks": 16.63,
        "Confect": 10.87,
        "Paypoint": 0.00,
        "Household": 0.69,
        "Misc": 4.71,
        "Total Category": 306.98,
        "Cash Component": 109.37,
        "Cash Purchase": 0.00
    }
]

df = pd.DataFrame(data)
output_path = "assets/Sales_Update_2026-01-29.xlsx"
df.to_excel(output_path, index=False)
print(f"Created {output_path}")
