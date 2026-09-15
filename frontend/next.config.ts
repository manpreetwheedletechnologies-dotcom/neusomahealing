import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },

  // Allows accessing the dev server from other devices on the
  // local network (e.g. testing on a phone at http://192.168.x.x:3000).
  // Add/replace the IP below with whatever shows up in the terminal
  // when you run `npm run dev` (the "Network:" URL).
  allowedDevOrigins: ["192.168.1.16"],
};

export default nextConfig;
