import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Désactiver ESLint pendant le build (pour éviter les erreurs de déploiement)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Optionnel : ignorer aussi les erreurs TypeScript pendant le build
    // ignoreBuildErrors: true,
  },
};

export default nextConfig;
