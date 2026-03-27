# Deployment Guide: License Manager on Koyeb

This guide provides step-by-step instructions to deploy the **License Manager** project on Koyeb with SQLite persistence.

## Prerequisites
- A [Koyeb account](https://app.koyeb.com/).
- Your project pushed to a GitHub repository.

## Step 1: Create a Persistent Volume
Since SQLite is file-based, we need a volume to ensure your licenses aren't lost when the application restarts or redeploys.

1.  Go to the [Koyeb Console](https://app.koyeb.com/).
2.  Navigate to **Storage** > **Volumes**.
3.  Click **Create Volume**.
4.  **Name**: `license-data` (or any name you prefer).
5.  **Region**: Choose the same region where you plan to deploy your service (e.g., `Washington, D.C. (us-east-1)`).
6.  **Size**: 1GB (plenty for a small SQLite database).
7.  Click **Create Volume**.

## Step 2: Deploy the Web Service
Now, let's deploy the application and link it to the volume.

1.  Click **Create** > **Web Service**.
2.  Choose **GitHub** as the deployment method.
3.  Select your `licensemanager` repository.
4.  **Service Name**: `license-manager`.
5.  **Region**: Select the SAME region as your volume.
6.  **Instance Type**: `Nano` or `Micro` is sufficient.
7.  **Environment Variables**:
    - `PORT`: `4000` (Matches your app's default).
    - `DB_PATH`: `/data/licenses.db` (This tells the app to store the DB on the volume).
    - `NODE_ENV`: `production`.
8.  **Volumes**:
    - Click **Add Volume**.
    - **Physical Volume**: Select `license-data`.
    - **Mount Path**: `/data`.
9.  **Exposed Ports**:
    - Ensure Port `4000` is exposed as `HTTP` on path `/`.
10. Click **Deploy**.

## Step 3: Verify the Deployment
Once the deployment is finished:
1.  Open your service's public URL (e.g., `https://license-manager-<user>.koyeb.app/`).
2.  The application should initialize the database in `/data/licenses.db` automatically.
3.  Create a test license, then try redeploying the service from the Koyeb console.
4.  Verify that the test license still exists after the redeploy.

## Troubleshooting
- **Database Error**: Ensure the `DB_PATH` directory (`/data`) matches the Volume mount path.
- **Port Error**: If the app fails to start, double-check that the `PORT` environment variable matches the port your Express app is listening on.
