import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep these packages as native Node.js externals so webpack doesn't
  // bundle them away from their internal file dependencies.
  serverExternalPackages: ["pdfkit", "docx", "stripe"],

  // Include public/logos and public/fonts in the serverless bundle for the
  // generate-pdf route. On Vercel, public/ is CDN-only at runtime — these
  // globs force Next.js file tracing to copy the assets into /var/task so
  // fs.readFileSync can reach them inside the serverless function.
  outputFileTracingIncludes: {
    "/api/generate-pdf": [
      "./public/logos/logo_cover_white.png",
      "./public/logos/logo_icon_white.png",
      "./public/fonts/CormorantGaramond-Regular.ttf",
      "./public/fonts/CormorantGaramond-Bold.ttf",
      "./public/fonts/CormorantGaramond-Italic.ttf",
      "./public/fonts/Montserrat-Regular.ttf",
      "./public/fonts/Montserrat-Bold.ttf",
      "./public/fonts/Montserrat-Light.ttf",
    ],
  },
};

export default nextConfig;
