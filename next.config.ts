import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

// This machine's LAN IPv4 addresses, so a phone on the same Wi-Fi can load the
// dev server's scripts (Next blocks non-localhost dev origins by default).
const lanAddresses = Object.values(networkInterfaces())
  .flat()
  .filter((net) => net?.family === "IPv4" && !net.internal)
  .map((net) => net!.address);

const nextConfig: NextConfig = {
  allowedDevOrigins: lanAddresses,
};

export default nextConfig;
