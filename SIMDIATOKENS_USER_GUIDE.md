# SimdiaTokens — User Guide

> **Welcome to SimdiaTokens.** This guide explains everything you need to know to use the platform to test email security, capture tokens, and conduct adversary simulations.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [The Dashboard](#2-the-dashboard)
3. [Capturing Targets](#3-capturing-targets)
4. [Managing Captured Tokens](#4-managing-captured-tokens)
5. [Extracting Contacts](#5-extracting-contacts)
6. [Inbox Rules](#6-inbox-rules)
7. [The Mailbox (Outlook Interface)](#7-the-mailbox-outlook-interface)
8. [OPSEC (How You Stay Hidden)](#8-opsec-how-you-stay-hidden)
9. [Lure Email Generation](#9-lure-email-generation)
10. [Reconnaissance](#10-reconnaissance)
11. [Analytics](#11-analytics)
12. [AI-Powered Features](#12-ai-powered-features)
13. [Settings](#13-settings)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Getting Started

### How to Log In
1. Open the web address provided to you (e.g., `https://your-name.vercel.app`)
2. Enter your **Username** and **Password**
3. Click **Sign In**

### Your Subscription
- At the top right of your dashboard, next to the bell icon, you will see an **expiration badge**.
- It shows the date your access expires and how many days are left.
- If it says **"Expired"**, your access has ended. You must contact the administrator to extend your subscription.

---

## 2. The Dashboard

When you log in, you arrive at the main dashboard. This is where you see every email account you have successfully captured.

### The Token Table
Each row represents a captured email account. You will see:

| Column | What It Shows |
|--------|---------------|
| **Email** | The captured email address |
| **Status** | ACTIVE (working) or EXPIRED/REVOKED (dead) |
| **Type** | Enterprise (work email) or Consumer (personal email like Hotmail/Outlook) |
| **IP Address** | The target's IP address when they clicked the link |
| **Location** | Approximate geographic location of the target |
| **Captured** | When the token was captured |
| **Last Refreshed** | When the system last renewed access |

### Action Buttons
Each captured token has a row of action buttons:

- **EXCHANGE**: Takes you to the Inbox Rules management page
- **OUTLOOK**: Opens the target's email inbox (looks exactly like Outlook)
- **Contacts**: Extracts all email contacts from the target's mailbox
- **ONEDRIVE**: Browse files stored in the target's OneDrive
- **Refresh**: Forces the system to renew access to this account
- **Delete**: Removes this token from your dashboard

---

## 3. Capturing Targets

To capture a target's email, you need to send them a special link that makes Microsoft ask them for permission to access their email.

### Step 1: Generate the Link
1. Click **Campaigns** in the left sidebar menu
2. Click the **Generate OAuth Link** button
3. A window will pop up showing you **two types of links**:

- **Redirect Link (Recommended)**: This is a short, clean link (e.g., `https://api.../api/campaigns/redirect`). When the target clicks it, they are seamlessly redirected to the Microsoft login page. **Use this one.**
- **Full OAuth URL**: This is the long, direct Microsoft link. Use this only if the Redirect Link is not working for a specific target.

4. Click **Copy Redirect Link** to copy it to your clipboard

### Step 2: Send the Link to the Target
You can send this link through:
- An email message
- A Microsoft Teams chat message
- A calendar invite (embedded as a "Join Meeting" link using the Calendar Lure feature)
- Any messaging platform

### Step 3: What Happens When They Click
1. The target sees a normal Microsoft login page
2. They enter their email and password
3. If they have Multi-Factor Authentication (MFA/2FA), they complete it normally
4. Microsoft asks them: "Do you allow this app to access your data?" — they click **Accept**
5. The target is redirected to their normal Outlook inbox — they don't notice anything wrong
6. **You now have full, silent access to their mailbox for 90 days**

---

## 4. Managing Captured Tokens

Once a token is captured, you can interact with the target's mailbox exactly as if you had their password.

### Accessing the Mailbox
- Click the **OUTLOOK** button on any active token to open the full Outlook interface.
- You can read, send, reply, forward, and delete emails just like a normal email client.

### OneDrive Access
- Click **ONEDRIVE** to browse, search, and download files from the target's OneDrive cloud storage.

### Refreshing Access
- Tokens automatically refresh themselves in the background for 90 days.
- If a token shows as EXPIRED or REVOKED, the target likely changed their password or removed the app from their Microsoft account.
- You can click **Refresh** to attempt to renew it manually, but if the target revoked it, you will need to send them a new lure link.

### Deleting a Token
- Click **Delete** to remove a token from your dashboard.
- When you delete a token, the system also automatically cleans up any hidden rules it created in the target's Outlook, leaving no trace.

---

## 5. Extracting Contacts

The Contacts feature allows you to extract every email address the target has ever communicated with, categorized by type.

### How to Use It
1. Click the **Contacts** button on any token
2. The system scans:
   - The target's personal address book (up to 500 contacts)
   - Emails received in the inbox (last 200 messages)
   - Emails sent by the target (last 200 sent emails)
3. All extracted emails are categorized into three groups:

| Category | Description | Examples |
|----------|-------------|----------|
| **Enterprise** | Business/company emails powered by Office 365 | user@company.com |
| **Consumer** | Microsoft personal emails | outlook.com, hotmail.com, live.com, msn.com |
| **Other Email Service** | Non-Microsoft free email providers | gmail.com, yahoo.com, aol.com, icloud.com, qq.com |

4. Use the filter buttons at the top to show only one category
5. Click **Copy All** to copy the filtered email list to your clipboard
6. The number on the Copy button shows how many emails are in the current filter

---

## 6. Inbox Rules

Inbox rules are powerful tools that automatically act on incoming emails in the target's mailbox. Rules fire **instantly on Microsoft's servers** — emails are intercepted before they ever reach the target's inbox.

### Creating a Rule
1. Click the **EXCHANGE** button on a token, or go to the **Rules** page
2. Set up your **Conditions** (what triggers the rule):
   - **Subject contains**: Trigger when the email subject includes specific words
   - **Body contains**: Trigger when email body includes words
   - **Sender contains**: Trigger when sender address includes words
   - **Has attachments**: Trigger only for emails with files attached
   - **Importance**: Trigger only for high/normal/low importance emails
   - **Size range**: Trigger only for emails within a specific size
   - And many more boolean flags (encrypted, meeting request, signed, etc.)

3. Set up your **Actions** (what happens when the rule triggers):
   - **Forward to**: Forward the email to an external address you control
   - **Forward as attachment**: Send the email as an EML attachment
   - **Redirect to**: Redirect the email to another address
   - **Delete message**: Move to deleted items
   - **Permanent delete**: Delete entirely (unrecoverable)
   - **Mark as read**: Mark the email as read without the target seeing the unread badge
   - **Move to folder**: Move to a hidden folder (visible only to you, invisible to target)
   - **Stop processing**: Prevent other rules from running

4. **Self-destructing rules**: You can set a "Max fires" limit. For example, if you set it to 3, the rule will fire 3 times and then automatically delete itself. No trace is left in the target's Outlook or your dashboard.

5. Click **Create Rule**

### Graph API Rules Tab
- Click the **Graph API Rules** tab to see all rules that currently exist in the target's real Outlook.
- This includes system-created OPSEC rules (see the OPSEC section for details).

---

## 7. The Mailbox (Outlook Interface)

Clicking **OUTLOOK** on a token opens a full replica of the target's Outlook email interface.

### Layout
- **Left Sidebar**: All mail folders (Inbox, Sent Items, Drafts, Deleted Items, Archive, Junk Email, etc.)
- **Middle Panel**: List of emails in the selected folder
- **Right Panel**: Reading pane showing the full email content

### What You Can Do
- **Read emails**: Full HTML content with clickable links
- **Compose new emails**: Send emails as the target (To, CC, BCC, Subject, Body, Attachments)
- **Reply / Reply All / Forward**: Respond to existing emails
- **Delete**: Single or bulk delete emails
- **Move**: Move emails between folders
- **Search**: Real-time search across all messages
- **All folders**: Access all folders including Sent Items, Drafts, Deleted Items

---

## 8. OPSEC (How You Stay Hidden)

OPSEC (Operational Security) is the most important feature of SimdiaTokens. It ensures the target never finds out they have been compromised. **This happens automatically — you do not need to do anything.**

### What Gets Auto-Deleted
When a token is captured, the system immediately creates hidden rules in the target's Outlook that auto-delete security notifications from Microsoft. The target never sees these emails:

- "New app connected to your account" notifications
- "Suspicious sign-in activity" alerts
- "Unusual sign-in" warnings
- "Password changed" notifications
- **"Creation of forwarding/redirect rule" alerts** (Office 365 security alerts)
- **"Informational alert has been triggered"** emails
- Any email from `security@microsoft.com`, `office365alerts@microsoft.com`, and 12 other Microsoft security sender addresses

### How It Works
- **4 hidden rules** are created in the target's Outlook instantly upon capture
- Rules fire on Microsoft's server — emails are deleted before reaching the inbox
- A backup system also polls for and deletes any alerts that arrived before the rules were set up
- All rules are disguised with names like "External Mail Filter"
- The target never sees your login because the system clones their browser fingerprint

---

## 9. Lure Email Generation

The Lure feature uses AI to help you craft convincing emails to send to targets with the OAuth link embedded.

### How to Generate a Lure
1. Click **Lure** in the sidebar
2. Select a template:
   - **Shared Document**: Appears to share a file via OneDrive/SharePoint
   - **Meeting Follow-up**: Appears to follow up from a Teams meeting
   - **Invoice**: Appears to be a routine vendor invoice
   - **Password Reset**: Appears to be an IT password expiration notice
   - **Package Delivery**: Appears to be a delivery confirmation
   - **Default**: Generic business email
3. The AI generates a realistic email with the OAuth link embedded
4. You can also use **AI Email Mimicking** to learn the target's writing style and generate emails that look like they came from the target themselves
5. Use **Conversation Hijacking** to inject into existing email threads naturally

---

## 10. Reconnaissance

The Recon feature gathers intelligence about the target and their organization.

### What You Can See
For any captured token, click **Recon** to view:
- **User Profile**: Full name, job title, department, office location, phone number, company name
- **Manager**: Who the target reports to (name, email, title)
- **Direct Reports**: Who reports to the target
- **Group Memberships**: All Azure AD groups the target belongs to
- **Organization**: Company tenant name and verified email domains

This information helps you understand the target's position in the company and identify other high-value targets to go after.

---

## 11. Analytics

The Analytics page gives you an overview of your operations.

### What You Can See
- **Token Health**: How many tokens are active vs expired vs revoked
- **Success Rate**: Percentage of successful captures
- **Activity Timeline**: Chart showing when tokens were created vs revoked over time
- **Action Distribution**: Breakdown of all actions taken (recon, rules created, tokens stored, etc.)
- **Top Domains**: Which organizations have the most captured accounts
- **Activity Feed**: Live log of all actions with timestamps

### Filtering
Use the date range selector to view data for the last 24 hours, 7 days, 30 days, or a custom range.

---

## 12. AI-Powered Features

SimdiaTokens includes several AI-powered features to make your operations more effective:

### AI Email Mimicking
- Analyzes the target's sent emails to learn their writing style
- Copies greeting, closing, vocabulary, formality, sentence structure
- Generates new emails that look exactly like the target wrote them

### Conversation Hijacking
- Scans the target's inbox for active email threads
- AI generates replies that naturally continue the conversation
- Embeds the OAuth link as a natural call-to-action

### Smart Rule Suggestions
- AI analyzes inbox patterns and suggests 3-5 interception rules
- Targets financial emails, invoices, and executive communications

### Financial Pattern Detection
- Scans inbox for 30+ financial keywords (invoice, payment, wire transfer, IBAN, SWIFT)
- Auto-forwards matching emails to an external address
- Deletes the originals from the inbox

### Polymorphic Lure Generation
- Every generated lure email is structurally unique
- Randomized greetings, closings, link text, fonts, and paragraph count
- Defeats pattern-based detection by email security gateways

---

## 13. Settings

The Settings page allows you to configure your panel:

- **AI Configuration**: Set your OpenAI API key to enable AI features
- **Encryption**: Set or change your master passphrase for response encryption
- **Stealth Mode**: Toggle stealth configuration
- **Rules Management**: View all rules you've created across all tokens
- **Purge Expired**: Bulk delete expired or revoked tokens to clean up your dashboard
- **Password Change**: Change your admin login password

---

## 14. Troubleshooting

### "SUBSCRIPTION EXPIRED" when trying to log in
- Your access period has ended. Contact the administrator to extend your subscription.

### "Failed to fetch" error on login
- The server may be temporarily unavailable. Wait a few minutes and try again. If persistent, contact the administrator.

### I generated a link but the target's token didn't appear on the dashboard
- This could mean the target hasn't clicked the link yet, or they clicked it but didn't complete the Microsoft sign-in.
- If they completed sign-in and you still don't see it, the system may have encountered an error. Contact the administrator with the time the target clicked the link.

### A token shows as REVOKED
- The target likely changed their password or manually removed the app from their Microsoft account settings.
- You can click **Refresh** to try renewing it, but if it's truly revoked, you'll need to send the target a new lure link.

### I don't see "Sent Items" or certain folders in the Outlook view
- All folders should be visible. If some are missing, try refreshing the page. The system fetches up to 100 folders from the mailbox.

### The Contacts button doesn't find any emails
- The target's mailbox may be empty or newly created. Try again later or try a different target.

### Rules I created aren't working
- Check the **Graph API Rules** tab to see if the rule exists in the target's Outlook. If it shows there but isn't firing, Microsoft may have disabled it. Try recreating the rule.

---

**SimdiaTokens** — User Guide v5.0