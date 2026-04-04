# Command OS: Machine Learning Roadmap & Deep Dive

## Executive Summary
This document outlines the strategic roadmap for transforming the **ENGLABS INVENTORY Command OS** from a reactive management tool into a **Predictive, Autonomous Operating System**. By leveraging Machine Learning (ML), we aim to optimize inventory, streamline workforce management, and maximize profitability through data-driven decisions.

## 1. Inventory Intelligence (The "Smart Stock" Module)
**Goal**: Eliminate stockouts and reduce waste by *predicting* demand rather than reacting to depletion.

### Features
*   **Predictive Replenishment**:
    *   **Algorithm**: Time-series forecasting (ARIMA / LSTM).
    *   **Input**: Historical sales (`transactions`), seasonality, local events, weather data.
    *   **Output**: Suggested order quantities for each supplier.
    *   **Action**: Automated generation of `Purchase` orders in Draft state.
*   **Expiry Risk Detection**:
    *   **Algorithm**: Regression analysis on sell-through rates vs. batch expiry dates.
    *   **Input**: Inventory `batch` data, daily sales velocity.
    *   **Output**: "Risk Alerts" for items likely to expire before selling.
    *   **Action**: Suggest dynamic discounts (e.g., "Reduce to Clear" labels) to clear stock.
*   **Shrinkage Anomaly Detection**:
    *   **Algorithm**: Anomaly detection (Isolation Forest).
    *   **Input**: Stock adjustments vs. Sales vs. Delivery logs.
    *   **Output**: Flag specific shifts or product categories with abnormal loss rates.

## 2. Workforce Optimization (The "Smart Rota" Module)
**Goal**: Match staffing levels to predicted footfall to optimize cost-efficiency and prevent burnout.

### Features
*   **Demand-Based Rostering**:
    *   **Algorithm**: Multi-objective optimization.
    *   **Input**: Predicted hourly sales volume, staff skills (`UserRole`), availability `RotaPreference`.
    *   **Output**: Optimal shift schedules.
*   **Performance Anomaly Detection**:
    *   **Algorithm**: Clustering (K-Means).
    *   **Input**: Scan speed, void rates, upsell success rates from `AuditEntry` and `Transaction` logs.
    *   **Output**: Identification of training needs or high-performers for reward.
*   **Attrition Prediction**:
    *   **Algorithm**: Classification (Random Forest).
    *   **Input**: Attendance patterns (lateness/sick leave), overtime hours, tenure.
    *   **Action**: Early warning to management for retention intervention.

## 3. Computer Vision & Physical Intelligence
**Goal**: Digitize the physical store state using existing cameras and mobile devices.

### Features
*   **Automated Shelf Audits (SmartIntake 2.0)**:
    *   **Tech**: Object Detection (YOLO / MobileNet via TensorFlow.js).
    *   **Usage**: Staff snaps a photo of a shelf.
    *   **Output**: Identifies gaps (Out of Stock), misplaced items, and planogram compliance.
*   **Enhanced Face Auth**:
    *   **Tech**: `face-api.js` (Existing).
    *   **Upgrade**: Liveness detection to prevent photo spoofing.
*   **Queue Length Monitoring**:
    *   **Tech**: Crowd counting on CCTV feed.
    *   **Action**: Alert back-office staff to open a new till if line > 5 people.

## 4. Customer & Sales Analytics
**Goal**: Increase basket size and customer lifetime value.

### Features
*   **Market Basket Analysis**:
    *   **Algorithm**: Association Rule Mining (Apriori).
    *   **Input**: Transaction logs.
    *   **Output**: "Customers who buy Beer also buy Crisps 80% of the time."
    *   **Action**: Suggest layout changes or "Meal Deal" bundles.
*   **Dynamic Pricing Engine**:
    *   **Algorithm**: Reinforcement Learning.
    *   **Input**: Expiry dates, time of day, competitor pricing (scraped).
    *   **Action**: Adjust electronic shelf labels (ESL) prices for maximum margin/clearance.

## 5. Technical Architecture for ML

### Frontend (Edge Inference)
*   **Libraries**: `TensorFlow.js`, `ONNX Runtime Web`.
*   **Use Cases**: Face Auth, Barcode scanning, basic object detection (Shelf audit).
*   **Benefit**: Low latency, works offline, privacy-preserving.

### Backend (Training & Batch Processing)
*   **Stack**: Python (FastAPI / Flask) + Scikit-learn / PyTorch.
*   **Deployment**: Cloud Run / AWS Lambda (Triggered weekly/daily).
*   **Data Warehouse**: Export Firestore data to **BigQuery** for heavy analysis.

### Integration Plan
1.  **Data Pipeline**: Set up automated ETL from Firestore to BigQuery (Daily).
2.  **Model Registry**: Store trained models (weights) in Cloud Storage.
3.  **Inference**: 
    *   Lightweight models run in-browser (`Command OS` Client).
    *   Heavy models (Forecasting) run as scheduled Cloud Functions.

## 6. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)
*   [ ] Set up BigQuery export for `Transactions`, `Inventory`, `Attendance`.
*   [ ] Implement basic **Basket Analysis** (Association Rules) script.
*   [ ] Dashboard Widget: "Recommended Bundles".

### Phase 2: Predictive Core (Weeks 5-8)
*   [ ] Train ARIMA model on Sales History.
*   [ ] Feature: **Suggested Order Quantity** in Procurement View.
*   [ ] Feature: **Expiry Risk** dashboard.

### Phase 3: Vision & Optimization (Weeks 9-12)
*   [ ] Integrate **Object Detection** for Shelf Audits.
*   [ ] Implement **Smart Rota** builder.
*   [ ] Deploy **Liveness Detection** for Security Terminal.

## 7. Immediate Next Steps
1.  **Data Quality Audit**: Ensure `Transactions` and `Inventory` logs have clean, consistent timestamps and categorization.
2.  **Pilot Feature**: Implement **Predictive Reordering** for Top 50 Sellers using simple Moving Average (MVP).
