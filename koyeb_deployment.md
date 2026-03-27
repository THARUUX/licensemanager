# Deployment Guide: License Manager on Koyeb (PostgreSQL)

This guide provides step-by-step instructions to deploy the **License Manager** project on Koyeb using a **Managed PostgreSQL Database**. This ensures permanent data persistence and solves compatibility issues.

## Prerequisites
- A [Koyeb account](https://app.koyeb.com/).
- Your project pushed to a GitHub repository.

## Step 1: Create a Managed Database
Koyeb provides a free tier for PostgreSQL, which is perfect for this project.

1.  Log in to the [Koyeb Console](https://app.koyeb.com/).
2.  Click **Create** > **Database**.
3.  **Engine**: Select `PostgreSQL`.
4.  **Region**: Choose a region close to you (e.g., `Washington, D.C. (us-east-1)`).
5.  **Instance**: Select the `Free` or `Nano` instance.
6.  **Name**: `license-db`.
7.  Click **Create Database**.
8.  **IMPORTANT**: Once created, copy the **Connection String** (it starts with `postgres://...`). You will need this as your `DATABASE_URL`.

## Step 2: Deploy the Web Service
Now, let's deploy the application and connect it to your database.

1.  Click **Create** > **Web Service**.
2.  Choose **GitHub** as the deployment method.
3.  Select your `licensemanager` repository.
4.  **Service Name**: `license-manager`.
5.  **Region**: Choose a region close to your database.
6.  **Environment Variables**:
    - `PORT`: `4000`
    - `DATABASE_URL`: Paste the Connection String you copied in Step 1.
    - `NODE_ENV`: `production`.
7.  **Exposed Ports**: Ensure Port `4000` is exposed as `HTTP` on path `/`.
8.  Click **Deploy**.

## Step 3: Verify the Deployment
Once the deployment is finished:
1.  Open your service's public URL (e.g., `https://license-manager-<user>.koyeb.app/`).
2.  The application will automatically detect the `DATABASE_URL` and initialize the PostgreSQL tables on first start.
3.  Create a test license, redeploy the service, and verify that the data persists.

## Why PostgreSQL?
-   **No GLIBC Errors**: Avoids binary compatibility issues with SQLite.
-   **Free Tier Persistence**: Your data is stored in a managed database that survives application restarts, even on Koyeb's free tier.
-   **Scalability**: Easier to manage and scale if your project grows.
