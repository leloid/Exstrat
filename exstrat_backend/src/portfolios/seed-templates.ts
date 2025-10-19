import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTemplates() {
  console.log('🌱 Initialisation des templates...');

  // Templates de stratégies
  const strategyTemplates = [
    {
      name: 'Sans TP (défaut)',
      description: 'Aucune prise de profit automatique',
      type: 'no_tp',
      isDefault: true,
    },
    {
      name: 'Prise de profit par pourcentage',
      description: 'Vendre un pourcentage à des niveaux de prix spécifiques',
      type: 'percentage',
      isDefault: false,
    },
    {
      name: 'DCA (Dollar Cost Averaging)',
      description: 'Achat régulier pour lisser le prix moyen',
      type: 'dca',
      isDefault: false,
    },
    {
      name: 'Stratégie personnalisée',
      description: 'Configuration manuelle des règles',
      type: 'custom',
      isDefault: false,
    },
  ];

  for (const template of strategyTemplates) {
    const existing = await prisma.strategyTemplate.findFirst({
      where: { name: template.name },
    });
    
    if (!existing) {
      await prisma.strategyTemplate.create({
        data: template,
      });
      console.log(`✅ Template de stratégie créé: ${template.name}`);
    } else {
      console.log(`⚠️  Template de stratégie existe déjà: ${template.name}`);
    }
  }

  // Templates de prises de profit
  const profitTakingTemplates = [
    {
      name: 'Détails',
      description: 'Configuration détaillée des prises de profit',
      rules: {
        type: 'custom',
        levels: [],
      },
      isDefault: true,
    },
    {
      name: 'Prise de profit 25/50/75',
      description: 'Vendre 25% à +50%, 50% à +100%, 75% à +200%',
      rules: {
        type: 'percentage',
        levels: [
          { percentage: 25, targetPrice: 1.5, description: 'Vendre 25% à +50%' },
          { percentage: 50, targetPrice: 2.0, description: 'Vendre 50% à +100%' },
          { percentage: 75, targetPrice: 3.0, description: 'Vendre 75% à +200%' },
        ],
      },
      isDefault: false,
    },
    {
      name: 'Prise de profit 10/20/30',
      description: 'Vendre 10% à +25%, 20% à +50%, 30% à +100%',
      rules: {
        type: 'percentage',
        levels: [
          { percentage: 10, targetPrice: 1.25, description: 'Vendre 10% à +25%' },
          { percentage: 20, targetPrice: 1.5, description: 'Vendre 20% à +50%' },
          { percentage: 30, targetPrice: 2.0, description: 'Vendre 30% à +100%' },
        ],
      },
      isDefault: false,
    },
    {
      name: 'HODL',
      description: 'Aucune vente, garder tous les tokens',
      rules: {
        type: 'hodl',
        levels: [],
      },
      isDefault: false,
    },
  ];

  for (const template of profitTakingTemplates) {
    const existing = await prisma.profitTakingTemplate.findFirst({
      where: { name: template.name },
    });
    
    if (!existing) {
      await prisma.profitTakingTemplate.create({
        data: template,
      });
      console.log(`✅ Template de prise de profit créé: ${template.name}`);
    } else {
      console.log(`⚠️  Template de prise de profit existe déjà: ${template.name}`);
    }
  }

  // Créer quelques tokens populaires
  const tokens = [
    { symbol: 'BTC', name: 'Bitcoin', cmcId: 1 },
    { symbol: 'ETH', name: 'Ethereum', cmcId: 1027 },
    { symbol: 'SOL', name: 'Solana', cmcId: 5426 },
    { symbol: 'ARB', name: 'Arbitrum', cmcId: 16509 },
    { symbol: 'USDT', name: 'Tether', cmcId: 825 },
    { symbol: 'USDC', name: 'USD Coin', cmcId: 3408 },
  ];

  for (const token of tokens) {
    const existing = await prisma.token.findUnique({
      where: { symbol: token.symbol },
    });
    
    if (!existing) {
      await prisma.token.create({
        data: token,
      });
      console.log(`✅ Token créé: ${token.symbol}`);
    } else {
      console.log(`⚠️  Token existe déjà: ${token.symbol}`);
    }
  }

  console.log('🎉 Initialisation terminée !');
}

seedTemplates()
  .catch((e) => {
    console.error('❌ Erreur lors de l\'initialisation:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
