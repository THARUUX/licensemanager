# Deployment Guide: License Manager on Vercel (PostgreSQL)

This guide provides step-by-step instructions to deploy the **License Manager** project on Vercel with a **Serverless PostgreSQL Database (Neon)**.

## Prerequisites
- A [Vercel account](https://vercel.com/invite).
- Your project pushed to a GitHub repository.

## Step 1: Create a Vercel Project
1.  Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **Add New...** > **Project**.
3.  Import your `licensemanager` repository.
4.  In the configuration:
    - **Framework Preset**: Select `Other` (it will auto-detect Express).
    - **Build and Output Settings**: Defaults are fine.
5.  Click **Deploy**. (It might fail initially because the database isn't connected yet—that's okay).

## Step 2: Set up Vercel Postgres (Neon)
1.  Navigate to your new project in the Vercel Dashboard.
2.  Click the **Storage** tab.
3.  Click **Create Database** and select **Postgres**.
4.  Select a region (e.g., `Washington, D.C. (us-east-1)`).
5.  Click **Create**.
6.  Once created, click **Connect**. This will automatically add several environment variables to your project, including `POSTGRES_URL`.

## Step 3: Configure Environment Variables
1.  Go to the **Settings** > **Environment Variables** tab of your Vercel project.
2.  Your app uses `DATABASE_URL` for the connection string.
3.  Add a new environment variable:
    - **Key**: `DATABASE_URL`
    - **Value**: Copy the value of `POSTGRES_URL` (which was added in Step 2).
4.  Ensure `NODE_ENV` is set to `production`.

## Step 4: Final Deployment
1.  Go to the **Deployments** tab.
2.  Click on the latest deployment and select **Redeploy**.
3.  Once the redeploy is finished, your app will be live! Vercel handles the serverless scaling and database initialization automatically.

## Why Vercel?
-   **Free Forever**: The Hobby plan is free for personal projects.
-   **Global CDN**: Faster asset loading for your dashboard.
-   **Zero Maintenance**: No servers to manage.

> [!NOTE]
> Vercel is highly recommended for this project because it provides "free forever" hosting and a reliable PostgreSQL database on the free tier.
