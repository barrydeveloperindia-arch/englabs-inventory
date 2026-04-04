# Cloud Architecture Flowchart

This flowchart illustrates how your **Client Phone App** (or Web Dashboard) communicates with the backend in the new "Serverless" architecture.

```mermaid
graph TD
    %% Nodes
    Client[📱 Client Phone App<br>(Staff / Owner)]
    Vercel[☁️ Vercel / Hosting<br>(Serves the App Code)]
    
    subgraph "🔥 Firebase Backend (Google Cloud)"
        Auth[🔐 Authentication<br>(Login / Identity)]
        Firestore[🗄️ Firestore Database<br>(Inventory / Staff Records)]
        Storage[🖼️ Cloud Storage<br>(Product Photos / ID Cards)]
    end

    %% Flows
    Client -- "1. Load App (HTTPS)" --> Vercel
    Client -- "2. Sign In" --> Auth
    Auth -- "Token" --> Client
    
    Client -- "3. Read/Update Stock" --> Firestore
    Client -- "4. Upload Photos" --> Storage
    
    %% Local Interaction
    subgraph "Device Capabilities"
        Camera[📷 Camera / Scanner]
    end
    
    Camera -- "Scan Barcode" --> Client
    Client -- "Sync Result" --> Firestore
```

## How It Works
1.  **Initialization**: The phone downloads the app interface from the **Vercel Cloud**.
2.  **Security**: The user logs in via **Firebase Auth**.
3.  **Operations**: 
    *   **Data**: All inventory changes (Adding items, changing stock) are sent directly to **Firestore**.
    *   **Photos**: Images are uploaded directly to **Firebase Storage** (bypassing your laptop).
    *   **Scanning**: The phone uses its **Built-in Camera** to read barcodes. The logic runs on the phone itself, then updates the database.

## Key Change
*   **Before**: Phone -> Your Laptop (`server.js`) -> Database
*   **Now**: Phone -> Database (Directly)
*   **Benefit**: Your laptop does NOT need to be turned on for the app to work.
