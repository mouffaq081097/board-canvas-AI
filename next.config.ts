import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow development access from specific IP addresses
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "172.16.31.79", // Added based on user request
  ],
};

export default nextConfig;
