import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit reads font .afm files relative to its own location.
  // Bundling it breaks those paths — keep it as a Node.js external.
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
