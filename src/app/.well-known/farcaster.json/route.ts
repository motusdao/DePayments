import { NextResponse } from 'next/server';

export async function GET() {
  const manifest = {
    name: "Motus PSM",  // e.g., "PSM Dashboard"
    description: "A dashboard for PSM interactions, payments, and more.",
    short_name: "PSMDash",
    icons: [
      {
        src: "/icon-192.png",  // Path to your app icon (create PNG icons)
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ],
    start_url: "/",  // Entry point of your app
    display: "standalone",  // Makes it feel like a native app
    background_color: "#ffffff",
    theme_color: "#635BFF",
    farcaster: {
      developer_fid: 12345,  // Your Farcaster FID (account ID)
      capabilities: ["auth", "wallet", "social"],  // e.g., auth for login, wallet for transactions
    }
  };

  // Optionally sign the manifest for verification (using a library like @farcaster/core)
  // For now, serve as-is; add signing later for production

  return NextResponse.json(manifest);
}