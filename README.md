Glitch Roulette (Next.js) with **local** and **online** multiplayer.

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

## Multiplayer modes

- **Local multiplayer (default)**: works across **tabs/windows on the same device** (BroadcastChannel).
- **Online multiplayer**: works across **different devices/networks** (Firestore). Enable it on the *Create room* / *Join room* pages.

## Online multiplayer (Firestore) setup

1. Create a Firebase project (or use an existing one) and enable Firestore.
2. Add Firebase web env vars in `.env.local` (see `.env.example`).
3. Enable Firestore rooms:

```bash
NEXT_PUBLIC_USE_FIRESTORE_ROOMS=1
```

4. Deploy Firestore rules (required for online rooms to work).

```bash
npm i -g firebase-tools
firebase login
firebase use <your-project-id>
firebase deploy --only firestore:rules
```

This repo includes `firestore.rules` and `firebase.json`.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

To make room codes work across different networks, you need a **public URL**. The easiest is Vercel:

1. Import the repo into Vercel.
2. Add the Firebase env vars + `NEXT_PUBLIC_USE_FIRESTORE_ROOMS=1` in the Vercel project settings.
3. Deploy.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
