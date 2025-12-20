---
description: Guide to setting up a new AWS Account and configuring CLI with SSO
---

# AWS Account and SSO Setup Guide

You encountered a `permissions error` because your current IAM Role (`PowerUserAccess`) does not have permission to create IAM Roles (`iam:CreateRole`), which is required for SAM deployment.

To fix this, you need **Administrator Access**. The cleanest way is to use a personal AWS account where you are the root owner.

## Step 1: Create a New AWS Account
1.  Go to [https://portal.aws.amazon.com/billing/signup](https://portal.aws.amazon.com/billing/signup).
2.  Follow the steps to create a new account (email, password, contact info).
3.  **Verification**: You will need to provide a credit/debit card (for identity verification, usually $1 pending charge) and verify a phone number.
4.  **Support Plan**: Choose "Basic Support - Free".

## Step 2: Enable IAM Identity Center (SSO)
1.  Log in to your new AWS Console as the **Root User** (using email and password).
2.  Search for **IAM Identity Center** in the top search bar.
3.  Click **Enable** (select your current region, e.g., London / eu-west-2).

## Step 3: Create an Admin User
1.  In IAM Identity Center, go to **Users**.
2.  Click **Add user**.
3.  Fill in details (e.g., Username: `admin`, Email: your email).
4.  Generators a one-time password or send email verification.
5.  Click **Next: Groups**.
    *   (Optional) Create a group called `Administrators`, but for now you can skip.
6.  Complete the user creation.

## Step 4: Assign Permissions
1.  Go to **AWS Accounts** in the sidebar.
2.  Select your AWS Account checkbox.
3.  Click **Assign users or groups**.
4.  Select the `admin` user you just created.
5.  Click **Next**.
6.  **Permission Sets**: Click **Create permission set**.
    *   Select **Predefined permission set**.
    *   Choose **AdministratorAccess**.
    *   Click **Next**, then **Create**.
7.  Select the checkbox for `AdministratorAccess` you just created.
8.  Click **Next**, then **Submit**.

**Result**: You now have an SSO user (`admin`) with full Administrator capabilities.

## Step 5: Get SSO Start URL
1.  On the IAM Identity Center Dashboard (right sidebar usually), find the **AWS access portal URL**.
    *   It looks like: `https://d-xxxxxxxxxx.awsapps.com/start`
2.  Copy this URL.

## Step 6: Configure CLI Locally
Run the following command in your terminal:

```powershell
aws configure sso
```

**Prompts:**
1.  **SSO session name**: `northstar-admin` (arbitrary name)
2.  **SSO start URL**: (Paste the URL from Step 5)
3.  **SSO region**: `eu-west-2` (London) (or whichever region you enabled SSO in)
4.  **Registration**: It will open a browser. Login with your `admin` user (Step 3). Allow access.
5.  **CLI Account Selection**: It will show your account. Select it.
6.  **Permission Set**: Select `AdministratorAccess`.
7.  **CLI Profile Name**: `northstar-admin` (This is important, remember this name).
8.  **Default Region**: `eu-west-2`
9.  **Default Output**: `json`

## Step 7: Completed Deployment
Now you can try deploying again using the new profile.

1.  **Build**:
    ```powershell
    sam build
    ```

2.  **Deploy**:
    ```powershell
    sam deploy --guided --profile northstar-admin
    ```
    *   When asked `Stack Name`: `north-star-api`
    *   When asked `AWS Region`: `eu-west-2`
    *   **Confirm changes before deploy**: `y`
    *   **Allow SAM CLI IAM role creation**: `y` (This checks if YOU have permission to let SAM create roles. Since you are Admin, it works).
    *   **Disable rollback**: `n` (default)
    *   **Save arguments to configuration file**: `y`
    *   **SAM configuration file**: `samconfig.toml` (default)
    *   **SAM configuration environment**: `default` (default)

This should succeed.
