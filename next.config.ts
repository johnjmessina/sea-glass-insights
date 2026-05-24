import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep these packages as native Node.js externals so webpack doesn't
  // bundle them away from their internal file dependencies.
  serverExternalPackages: ["pdfkit", "docx", "stripe"],
};

export default nextConfig;
