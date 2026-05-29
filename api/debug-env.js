export default function handler(req, res) {
  const env = {
    APP_URL: process.env.APP_URL || null,
    VITE_STRIPE_PUBLISHABLE_KEY: process.env.VITE_STRIPE_PUBLISHABLE_KEY || null,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || null,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || null,
    STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY || null,
    NODE_ENV: process.env.NODE_ENV || null,
  };
  res.status(200).json(env);
}
