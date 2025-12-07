/** @type {import('next').NextConfig} */
const config = {
	eslint: {
		// Désactiver ESLint pendant le build (pour éviter les erreurs de déploiement)
		ignoreDuringBuilds: true,
	},
	experimental: {
		esmExternals: "loose", // Fix for React PDF Renderer
	},
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
};

export default config;
