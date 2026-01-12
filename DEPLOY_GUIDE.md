# Deploying Your Backend (Google Sheets)

To sync data across devices, we need a central cloud database. We will use **Google Sheets** and **Google Drive** (for images), connected via a small "Apps Script".

## Step 1: Create the Cloud Script
1. Go to [script.google.com](https://script.google.com/) and click **"New Project"**.
2. **Delete** any code currently in the editor (`function myFunction...`).
3. **Copy-Paste** the code from the file `backend/google-apps-script.js` in your project folder.
4. (Optional) Rename the project at the top to "Warehouse App Backend".

## Step 2: Deploy as API
1. Click the blue **"Deploy"** button (top right) -> **"New deployment"**.
2. Click the **Gear Icon** (Select type) -> **"Web app"**.
3. Fill in the details:
   - **Description**: v1
   - **Execute as**: **"Me"** (your email).
   - **Who has access**: **"Anyone"** (IMPORTANT: This allows your app users to read/write data without logging into your Google account every time).
4. Click **"Deploy"**.
5. You might be asked to **"Authorize access"**. Click it, choose your account, click **"Advanced"** -> **"Go to (Project Name) (unsafe)"**, then click **"Allow"**. (It says unsafe because it's a new script you just wrote).

## Step 3: Connect the App
1. After deployment, copy the **"Web app URL"** (it starts with `https://script.google.com/macros/s/...`).
2. Go back to your Warehouse App.
3. Click the **Settings (Gear Icon)** (I added this to the dashboard).
4. Paste the URL into the field and click **"Save & Sync"**.

Your app is now Online! Images will upload to a folder "Warehouse_App_Images" in your Google Drive, and data is stored in the "DB_Parcels" sheet.
