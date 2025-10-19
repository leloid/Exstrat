const { PrismaClient } = require('@prisma/client');

async function testSync() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Test de synchronisation des portfolios...\n');
    
    // 1. Vérifier l'état actuel
    console.log('📊 État actuel:');
    const portfolios = await prisma.portfolio.findMany({
      include: {
        user: { select: { email: true } },
        holdings: {
          include: {
            token: { select: { symbol: true } }
          }
        }
      }
    });
    
    portfolios.forEach(portfolio => {
      console.log(`\n${portfolio.name} (${portfolio.user.email}):`);
      console.log(`  Holdings: ${portfolio.holdings.length}`);
      portfolio.holdings.forEach(holding => {
        console.log(`    - ${holding.token.symbol}: ${holding.quantity} (${holding.investedAmount})`);
      });
    });
    
    // 2. Vérifier les transactions
    console.log('\n📊 Transactions:');
    const transactions = await prisma.transaction.findMany({
      select: {
        id: true,
        symbol: true,
        portfolioId: true,
        quantity: true,
        amountInvested: true
      }
    });
    
    console.log(`Total transactions: ${transactions.length}`);
    transactions.forEach(tx => {
      console.log(`  ${tx.symbol}: ${tx.quantity} (Portfolio: ${tx.portfolioId ? 'Oui' : 'Non'})`);
    });
    
    // 3. Simuler la création d'un nouveau portfolio
    console.log('\n🧪 Test de création d\'un nouveau portfolio...');
    
    const user = await prisma.user.findFirst();
    if (user) {
      // Créer un nouveau portfolio
      const newPortfolio = await prisma.portfolio.create({
        data: {
          userId: user.id,
          name: 'Test Portfolio',
          description: 'Portfolio de test',
          isDefault: false
        }
      });
      
      console.log(`✅ Nouveau portfolio créé: ${newPortfolio.name}`);
      
      // Vérifier que les transactions existantes sont toujours dans le portfolio par défaut
      const defaultPortfolio = await prisma.portfolio.findFirst({
        where: { userId: user.id, isDefault: true }
      });
      
      if (defaultPortfolio) {
        const defaultHoldings = await prisma.holding.findMany({
          where: { portfolioId: defaultPortfolio.id },
          include: { token: { select: { symbol: true } } }
        });
        
        console.log(`\nPortfolio par défaut (${defaultPortfolio.name}):`);
        console.log(`  Holdings: ${defaultHoldings.length}`);
        defaultHoldings.forEach(holding => {
          console.log(`    - ${holding.token.symbol}: ${holding.quantity} (${holding.investedAmount})`);
        });
      }
      
      // Nettoyer
      await prisma.portfolio.delete({ where: { id: newPortfolio.id } });
      console.log('🧹 Portfolio de test supprimé');
    }
    
    console.log('\n✅ Test terminé');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSync();
