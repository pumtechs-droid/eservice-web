This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

### Administrator email alerts and password recovery

Configure these values in the Vercel Production environment:

- `CRON_SECRET`: long random secret used to authorize the notification retry job.
- `APP_URL`: canonical site URL used to build administrator password-reset links. Production must use HTTPS.

Resend is the primary transactional email provider when both `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are configured. The sender must be verified with Resend. If Resend is unavailable or not configured, the application can send through the Gmail Apps Script gateway in `apps-script/Code.gs` using:

- `GOOGLE_APPS_SCRIPT_URL`: the deployed Apps Script web app URL ending in `/exec`.
- `GOOGLE_APPS_SCRIPT_SECRET`: a randomly generated shared secret. Store the same value as the Apps Script project property `EMAIL_WEBHOOK_SECRET`; do not commit or share it.

To enable the Gmail fallback:

1. Create an Apps Script project while signed in to the Gmail account that should send the alerts, and copy `apps-script/Code.gs` into its editor.
2. Show the `appsscript.json` manifest in the Apps Script editor and copy `apps-script/appsscript.json` into it. This limits the script's requested OAuth permission to sending email.
3. In **Project Settings → Script Properties**, add `EMAIL_WEBHOOK_SECRET` with a long random value.
4. Run `authorizeEmailSending` from the editor and approve the send-mail permission for the Google account that should send notifications.
5. Deploy as a web app that executes as the script owner and is accessible to anyone. The secret check in the script protects the endpoint; keep the deployment URL and secret private.
6. Add the deployment URL and the same secret to Vercel Production as `GOOGLE_APPS_SCRIPT_URL` and `GOOGLE_APPS_SCRIPT_SECRET`.
7. Redeploy after adding or changing environment variables. Apps Script sends from the authorized Gmail account and is subject to Google's daily sending quota.

System-change and sign-in/security alerts are sent to `aylatechs.hub@gmail.com`. Failed sign-ins are grouped into a single alert per account per 15-minute window. Unsent alerts are retained and retried by the Vercel cron job daily (the Hobby-plan-compatible schedule).

Apply migrations to the intended production database with `npx prisma migrate deploy` using the secure production environment. Never paste API keys, shared secrets, or database URLs into chat or source control.

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
