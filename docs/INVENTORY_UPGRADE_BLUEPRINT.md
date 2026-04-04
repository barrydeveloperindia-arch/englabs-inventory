# 🚀 Inventory Module Upgrade Blueprint

## Executive Summary
**Goal:** Transform the current "Passive Level" inventory viewer (which only shows low stock) into a "Pro-Active Management System" capable of handling 10,000+ items, creating purchase orders, and auditing stock history directly from the shop floor.

---

## 🏗️ Phase 1: Scalability & Access (The Foundation)
**Problem:** The app currently downloads *all* 2,320+ items at startup. This will crash the app as you grow.
**Solution:** Implement **Pagination & Search-On-Demand**.

### 1.1 Implement Firestore Pagination
Instead of listening to the entire `inventory` collection:
*   **Action:** Modify `useInventory` hook.
*   **Logic:** Fetch only the first 50 items initially.
*   **UI:** Add "Load More" / Infinite Scroll to lists.

### 1.2 Create "Stock Master" Screen (`/staff/inventory/all`)
**Problem:** You can currently only see items with < 5 stock. You cannot check if a "Milk" is in stock if it has 10 units.
*   **Feature:** A dedicated Search Bar & List View.
*   **Logic:** use `orderBy('name')` and `startAt(searchTerm)`.
*   **UI Components:**
    *   `InventorySearchInput`
    *   `InventoryListRow` (Image, Name, Price, **Current Stock**, Status Pill)

---

## 🛠️ Phase 2: Operational Control (The "Fix It" Tools)
**Problem:** Staff can see stock is wrong but cannot fix it in the app.
**Solution:** Enable **Stock Adjustments**.

### 2.1 Stock Adjustment Action
*   **Feature:** "Quick Edit" button on Inventory Row.
*   **Logic:** Firestore Transaction to update `stock`.
*   **Audit Trail:** Every change MUST record a reason.
    *   `Sale` (Automatic)
    *   `Restock` (Delivery)
    *   `Damage/Spoilage` (Write-off)
    *   `Audit Correction` (Stock Take)
*   **UI:** Pop-up modal: `[ + ] [ 5 ] [ - ]` -> `Reason: Expired`.

### 2.2 Purchase Order Generation (Fixing the Swiper)
**Problem:** Swiping "Reorder" currently just shows an alert.
*   **Feature:** Create a `Draft Purchase Order`.
*   **Logic:**
    1.  Create `shops/{id}/draft_orders` collection.
    2.  When Swiping Right -> Add item to "Draft Order #123".
    3.  Manager Screen: "Review Draft Order" -> "Send PDF to Supplier".

---

## 🧠 Phase 3: Intelligence & History
**Problem:** Staff don't know *why* an item is low (Did we sell 50 today? Or did we forget to order?).
**Solution:** **Item Detail View**.

### 3.1 Item Detail Screen (`/staff/inventory/[barcode]`)
*   **Stats:**
    *   "Sold Today": X units
    *   "Last Purchased": Date
    *   "Average Weekly Sales": Y units
*   **Graph:** Simple Sparkline showing stock level over last 30 days.

---

## 📅 Implementation Roadmap

| Phase | Task | Estimated Effort |
| :--- | :--- | :--- |
| **P1** | `InventoryExplorer` Screen (Search/List) | ⚡ 1 Day |
| **P1** | Firestore Pagination Hook | ⚡ 0.5 Day |
| **P2** | Stock Adjustment Modal & Logic | ⚡ 1 Day |
| **P2** | Connect Swiper to `draft_orders` | ⚡ 1 Day |
| **P3** | Item Detail View (Stats) | ⚡ 1.5 Days |

**Ready to start?** I recommend beginning with **Phase 1: The Stock Master Screen** so you immediately gain visibility of your full inventory.
