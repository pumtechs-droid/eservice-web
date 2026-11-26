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

Configure these values in the deployment environment:

- `RESEND_API_KEY`: Resend API key.
- `RESEND_FROM_EMAIL`: verified sender address, for example `E-SERVICE HUB <notifications@your-verified-domain>`.
- `CRON_SECRET`: long random secret used to authorize the notification retry job.
- `APP_URL`: canonical site URL used to build administrator password-reset links. Production must use HTTPS.

System-change and sign-in/security alerts are sent to `aylatechs.hub@gmail.com`. Failed sign-ins are grouped into a single alert per account per 15-minute window. Unsent alerts are retained and retried by the Vercel cron job daily (the Hobby-plan-compatible schedule).

Apply migrations to the intended production database with `npx prisma migrate deploy` using the secure production environment. Never paste API keys or database URLs into chat or source control.

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
