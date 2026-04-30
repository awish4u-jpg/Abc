# Claude for Chrome — prompt pack

Each section is a self-contained prompt you paste into Claude for Chrome. Run them top-down on Day 1. Stay near your phone for SMS verification codes; everything else, Claude for Chrome handles.

**Before starting**: open these tabs already logged in (skip if you already are):
- `gmail.com` (or your email provider) — for verification emails
- `awish@layer1.tech` Microsoft 365
- Your password manager (1Password / Bitwarden / browser saved)

**Staging file**: create a temporary text file `aryaaos-secrets.txt` somewhere safe (e.g., 1Password secure note). Tell Claude for Chrome: *"Paste every API key, secret, and credential into this note as you go, with clear labels."* You'll bulk-load them into Vercel + Convex env at the end.

---

## §A — Account creations (~60 min, you're nearby for codes)

### A1. GitHub repo

```
Open github.com. I'm logged in as awish4u-jpg. Create a new private
repository named "aryaaos". Description: "AryaaOS — personal+Layer 1 AI
workspace." Do NOT initialize with a README, .gitignore, or license.
After creation, copy the repository's HTTPS URL and SSH URL into the
secrets staging note labelled GITHUB_REPO_HTTPS and GITHUB_REPO_SSH.
```

### A2. Convex

```
Go to convex.dev and click "Sign in" → "Continue with GitHub". Authorize
Convex on the awish4u-jpg account. Once in the Convex dashboard, create
a new project called "aryaaos". Choose the Production plan setting at
sign-up if asked (we'll be on free tier initially).

After project creation:
1. Open Settings → Deploy Keys. Generate a new deploy key. Copy it to
   the staging note as CONVEX_DEPLOY_KEY.
2. Open Settings → URL & Deploy Key. Copy the project URL to the staging
   note as CONVEX_URL (looks like https://xxxx-yyyy-1234.convex.cloud).

Stop and tell me when done.
```

### A3. Anthropic Console

```
Open console.anthropic.com. Sign in (use Google SSO with awish@layer1.tech
if available, otherwise email). If a new account, complete email/phone
verification — alert me for the SMS code.

Once in:
1. Workspaces → create a workspace named "aryaaos".
2. API Keys → Create Key, name it "aryaaos-prod". Copy the key to the
   staging note as ANTHROPIC_API_KEY.
3. Settings → Plans → add a payment method (I will tell you the card
   to use).
4. Settings → Limits → set Monthly Spend Limit to USD 200. Save.
5. Settings → Limits → set Daily Spend Notification at USD 10. Save.

Stop and tell me when done. Do NOT close the tab.
```

### A4. Vercel

```
Open vercel.com. Sign in with GitHub (awish4u-jpg). Authorize Vercel
to read the awish4u-jpg/aryaaos repo when prompted.

In the dashboard:
1. Skip "Import Project" for now — we'll deploy from the local Claude
   Code session later.
2. Settings → Domains → Add Domain → enter "aryaaos.casaaria.in".
   Vercel will show CNAME instructions. Copy the CNAME value (looks
   like cname.vercel-dns.com) to the staging note as
   VERCEL_CNAME_TARGET. Don't worry that the domain shows "Invalid
   Configuration" — we add the DNS record next.

Stop and tell me when done.
```

### A5. Voyage AI

```
Open voyageai.com. Sign up with awish@layer1.tech. Verify email.
Go to Dashboard → API Keys → Create Key. Copy the key to the staging
note as VOYAGE_API_KEY.

Add a payment method (alert me for card details). Set spend cap at
USD 30/month if the option is available.
```

### A6. Google AI Studio (Nano Banana / Gemini)

```
Open aistudio.google.com. Sign in with awish@layer1.tech (or your
personal Google account if Layer 1 doesn't allow Gemini API).

1. Click "Get API key" → "Create API key in new project". Project
   name: aryaaos. Copy the key to the staging note as GEMINI_API_KEY.
2. Open console.cloud.google.com → select the aryaaos project →
   Billing → link a billing account → set a USD 50/month budget
   alert.
3. Confirm Gemini 2.5 image generation (Nano Banana) is enabled in
   the API library for this project.

Stop when done.
```

### A7. OpenAI (Whisper fallback only)

```
Open platform.openai.com. Sign in or sign up. We only need Whisper
API (no GPT use), so this should be cheap.

1. Settings → Billing → add payment method.
2. Settings → Limits → Hard limit USD 20/month. Save.
3. API Keys → Create new secret key, name it "aryaaos-whisper".
   Copy to staging note as OPENAI_API_KEY.
```

### A8. Wispr Flow (Windows)

```
Open wisprflow.ai. Check whether Windows is supported on the download
page. If yes:
1. Download Windows installer.
2. Sign up using awish@layer1.tech.
3. Start the trial / paid plan (alert me for card).
4. After install, walk the user through: enable accessibility
   permissions, set hotkey to Caps Lock (single-tap to toggle),
   test in any text field.

If Wispr Flow does NOT support Windows: stop and tell me. We'll switch
to Aqua Voice (aqua.ai) as fallback — same flow.
```

### A9. Granola

```
Open granola.ai. Sign up with awish@layer1.tech. Start the paid plan
(alert me for card).

1. Download desktop app (Windows).
2. Install. Sign in.
3. Connect Outlook calendar (Layer 1 awish@layer1.tech).
4. Connect Google Calendar (personal account).
5. Settings → Integrations → check whether a public API or webhook
   exists. If yes, copy the API base URL and any token to staging
   note as GRANOLA_API_BASE and GRANOLA_API_TOKEN. If no public API,
   tell me — we'll use Granola's Notion or Zapier export as the sync
   path.

Tell me what integration options you found.
```

### A10. Sentry

```
Open sentry.io. Sign in with GitHub.
1. Create organization "aryaaos" (or use an existing one).
2. Create a new project: platform = Next.js, name = aryaaos-web.
3. After creation, copy the DSN to the staging note as SENTRY_DSN.
4. Stay on the free tier.
```

---

## §B — DNS + domain (~5 min)

### B1. GoDaddy CNAME

```
Open godaddy.com → My Products → casaaria.in → DNS Manage. I'm logged
in as the domain owner.

Add a new DNS record:
- Type: CNAME
- Name (host): aryaaos
- Value (points to): cname.vercel-dns.com   (use whatever Vercel gave us
  in the staging note as VERCEL_CNAME_TARGET)
- TTL: 1 hour

Save. Then tell me when saved. (Propagation: 15-30 min on GoDaddy.)
```

### B2. Verify

```
After 15 minutes, open vercel.com → aryaaos project → Settings →
Domains → aryaaos.casaaria.in → click "Refresh". Confirm it now shows
"Valid Configuration." If still invalid after 30 min, screenshot and
tell me.
```

---

## §C — OAuth and integration grants (~30 min, you click "Allow" a lot)

### C1. Microsoft Graph app registration (Layer 1 tenant)

```
Open portal.azure.com. Sign in as awish@layer1.tech (admin). Navigate
to Azure Active Directory → App Registrations → New Registration.

- Name: AryaaOS
- Supported account types: Accounts in this organizational directory
  only (Layer 1 only - Single tenant).
- Redirect URI: Web → https://aryaaos.casaaria.in/api/auth/callback/microsoft

Click Register. Then:
1. Overview → copy "Application (client) ID" → staging note as
   MS_CLIENT_ID.
2. Overview → copy "Directory (tenant) ID" → staging note as
   MS_TENANT_ID.
3. Certificates & secrets → New client secret → 24 months expiry.
   Copy the secret VALUE (not the ID) to staging note as
   MS_CLIENT_SECRET.
4. API Permissions → Add Permission → Microsoft Graph → Delegated:
   - User.Read
   - Mail.ReadWrite
   - Mail.Send (we won't use it but reserve for later)
   - Calendars.Read
   - Files.ReadWrite.All
   - Sites.ReadWrite.All
   - offline_access
5. Grant admin consent for Layer 1.

Tell me when done.
```

### C2. Google OAuth (calendar + Gemini if needed)

```
Open console.cloud.google.com → APIs & Services → Credentials →
Create Credentials → OAuth client ID.

- Application type: Web application
- Name: AryaaOS
- Authorized redirect URIs:
  - https://aryaaos.casaaria.in/api/auth/callback/google

Save. Copy Client ID and Client Secret to staging note as
GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.

Then enable these APIs on the project:
- Google Calendar API
- (Gemini API should already be enabled from §A6)
```

### C3. Odoo API key

```
The user already has an Odoo instance with a long-lived API key.
Confirm with the user:
- Odoo URL (e.g., https://layer1.odoo.com or self-hosted URL) →
  staging note as ODOO_URL
- Odoo database name → ODOO_DB
- Odoo username (email) → ODOO_USER
- Odoo API key → ODOO_API_KEY

If any are missing, walk the user through:
1. Log into Odoo as awish@layer1.tech.
2. Settings → Users & Companies → Users → click your user.
3. Account Security tab → API Keys → New API Key.
4. Name: "AryaaOS". Generate. Copy to staging note as ODOO_API_KEY.
```

### C4. GitHub fine-grained PAT (for Convex/Vercel build hooks)

```
Open github.com/settings/tokens?type=beta. Generate a fine-grained
personal access token:
- Name: aryaaos-deploy
- Expiration: 1 year
- Repository access: only awish4u-jpg/aryaaos
- Permissions:
  - Contents: Read & Write
  - Metadata: Read
  - Webhooks: Read & Write
  - Pull requests: Read & Write

Generate and copy to staging note as GITHUB_PAT.
```

---

## §D — Bulk-load secrets into hosting (~10 min)

### D1. Convex env vars

```
Open dashboard.convex.dev → aryaaos project → Settings → Environment
Variables. Add each of these, copying values from the staging note:

ANTHROPIC_API_KEY
GEMINI_API_KEY
VOYAGE_API_KEY
OPENAI_API_KEY            (Whisper)
ODOO_URL
ODOO_DB
ODOO_USER
ODOO_API_KEY
MS_CLIENT_ID
MS_CLIENT_SECRET
MS_TENANT_ID
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GRANOLA_API_BASE          (if Granola has API)
GRANOLA_API_TOKEN         (if Granola has API)

Save each. Tell me when done.
```

### D2. Vercel env vars

```
Open vercel.com → aryaaos project → Settings → Environment Variables.
Add each, set them for "Production, Preview, and Development":

NEXT_PUBLIC_CONVEX_URL    (= CONVEX_URL from staging)
CONVEX_DEPLOY_KEY
NEXTAUTH_URL              = https://aryaaos.casaaria.in
NEXTAUTH_SECRET           (generate via: openssl rand -base64 32 — tell
                           the user to run this in a terminal and paste back)
MS_CLIENT_ID
MS_CLIENT_SECRET
MS_TENANT_ID
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
SENTRY_DSN
NEXT_PUBLIC_SENTRY_DSN    (= SENTRY_DSN)

(Anthropic, Gemini, Voyage, OpenAI, Odoo, Granola keys are server-only
and live in Convex env, NOT Vercel.)

Save. Tell me when done.
```

### D3. OneDrive folder

```
Open office.com → OneDrive (signed in as awish@layer1.tech).

Create folder structure under root:
- /Layer 1/AryaaOS/
  - /Files/
  - /Backups/
  - /Exports/
  - /Generated Images/

Tell me the share path of /Layer 1/AryaaOS/. Confirm folders created.
```

### D4. Claude.ai Project (for ongoing AryaaOS context)

```
Open claude.ai. Sign in with awish@layer1.tech (Layer 1 workspace if
you have Team/Enterprise; personal otherwise).

1. Create a new Project named "AryaaOS".
2. Custom instructions: paste the following:

   "This Project is for ongoing context about AryaaOS — Awish's personal
   AI workspace. The repo is awish4u-jpg/aryaaos. The live URL is
   aryaaos.casaaria.in. Tech stack: Next.js 15, Convex, Anthropic SDK,
   Microsoft Graph, Odoo, Granola, Gemini image gen. ADHD-tuned design:
   capture-first omnibox, three modes (Stage/Default/Solo), gentle daily
   nudges (8am/2pm/9pm). Always preserve these design principles when
   suggesting changes."

3. Upload the five bootstrap files (00-index.md through 05-execution-plan.md)
   to the Project as reference docs.

Tell me when done.
```

---

## §E — Final smoke test (~10 min)

### E1. Stack health check

```
Verify in this order. Stop and report errors at any step.

1. Open https://aryaaos.casaaria.in — Vercel placeholder should load
   over HTTPS (cert auto-provisioned).
2. Test Convex connection: in the Convex dashboard, run a test query
   on the deployed schema. Confirm tables exist.
3. Test Microsoft SSO: at aryaaos.casaaria.in/login, click "Sign in
   with Microsoft". You should be redirected to Microsoft, sign in
   with awish@layer1.tech, and land back on /app.
4. Test omnibox: hit Ctrl+K, type "test ping". Confirm it appears in
   the Inbox.
5. Test Sentry: in Convex dashboard, manually trigger an error in any
   action. Confirm it appears in Sentry within 60 seconds.

Report status: green / yellow / red for each.
```

---

## Recovery prompts (run if something breaks)

### R1. Reset Vercel deploy

```
Open vercel.com → aryaaos → Deployments → most recent → Redeploy. Use
production environment. Wait for completion. If it fails, copy the
build log error and tell me.
```

### R2. Rotate a leaked key

```
The key [KEY_NAME] may be leaked. Walk through:
1. Revoke at provider (open provider dashboard, find the key, delete).
2. Generate replacement.
3. Update staging note.
4. Update Convex/Vercel env var.
5. Redeploy.
```

### R3. Find Odoo record IDs

```
Log into the Odoo web UI. For each of these I name, navigate to the
record, and copy the URL. The ID is the number after /id/. Tell me:
- Zydus client record ID
- Coast Guard client record ID
- NPBMA client record ID
- NAMTech client record ID
- [other clients I'll list when needed]
```

---

## Tips for Claude for Chrome

- **Permission scopes**: when in doubt, prefer "Read" over "Write" until tested.
- **Clipboard**: ask CfC to paste credentials directly into the staging note rather than echoing them in chat.
- **2FA**: if Authenticator app codes are required, you'll need to be in front of your phone — can't delegate this.
- **Captchas**: CfC solves most. Hard ones (image-grid) need you.
- **Confirmation emails**: keep email open in another tab so CfC can fetch the verification link.
