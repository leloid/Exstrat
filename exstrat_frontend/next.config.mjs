/** @type {import('next').NextConfig} */
const config = {
	eslint: {
		// Désactiver ESLint pendant le build (pour éviter les erreurs de déploiement)
		ignoreDuringBuilds: true,
	},
	// Configuration pour React PDF Renderer (si nécessaire)
	// Note: esmExternals n'est plus recommandé dans Next.js 15, mais peut être nécessaire pour certaines librairies
	serverExternalPackages: ["@react-pdf/renderer"],
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "s2.coinmarketcap.com",
			},
			{
				protocol: "https",
				hostname: "cryptologos.cc",
			},
			{
				protocol: "https",
				hostname: "assets.binance.com",
			},
			{
				protocol: "https",
				hostname: "cryptoicons.org",
			},
			{
				protocol: "https",
				hostname: "assets.coingecko.com",
			},
		],
	},
	// Configuration pour réduire les erreurs de hot reload CSS
	onDemandEntries: {
		// Garder les pages en mémoire plus longtemps pour éviter les rechargements
		maxInactiveAge: 25 * 1000,
		pagesBufferLength: 2,
	},
};

export default config;
