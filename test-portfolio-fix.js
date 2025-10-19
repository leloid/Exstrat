const { PrismaClient } = require('@prisma/client');

async function testPortfolioFix() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Test de la correction des portfolios...\n');
    
    // 1. Vérifier les transactions avec portfolioId
    console.log('📊 Transactions avec portfolioId:');
    const transactionsWithPortfolio = await prisma.transaction.findMany({
      where: {
        portfolioId: { not: null }
      },
      select: {
        id: true,
        symbol: true,
        portfolioId: true,
        quantity: true,
        amountInvested: true
      }
    });
    
    console.log(`Nombre de transactions avec portfolioId: ${transactionsWithPortfolio.length}`);
    transactionsWithPortfolio.forEach((tx, index) => {
      console.log(`${index + 1}. ${tx.symbol} - Portfolio: ${tx.portfolioId} - Qty: ${tx.quantity} - Amount: ${tx.amountInvested}`);
    });
    
    // 2. Vérifier les transactions sans portfolioId
    console.log('\n📊 Transactions sans portfolioId:');
    const transactionsWithoutPortfolio = await prisma.transaction.findMany({
      where: {
        portfolioId: null
      },
      select: {
        id: true,
        symbol: true,
        quantity: true,
        amountInvested: true
      }
    });
    
    console.log(`Nombre de transactions sans portfolioId: ${transactionsWithoutPortfolio.length}`);
    transactionsWithoutPortfolio.forEach((tx, index) => {
      console.log(`${index + 1}. ${tx.symbol} - Qty: ${tx.quantity} - Amount: ${tx.amountInvested}`);
    });
    
    // 3. Vérifier les holdings par portfolio
    console.log('\n📊 Holdings par portfolio:');
    const holdings = await prisma.holding.findMany({
      include: {
        portfolio: {
          select: {
            name: true,
            id: true
          }
        },
        token: {
          select: {
            symbol: true
          }
        }
      }
    });
    
    // Grouper par portfolio
    const holdingsByPortfolio = {};
    holdings.forEach(holding => {
      const portfolioName = holding.portfolio.name;
      if (!holdingsByPortfolio[portfolioName]) {
        holdingsByPortfolio[portfolioName] = [];
      }
      holdingsByPortfolio[portfolioName].push({
        symbol: holding.token.symbol,
        quantity: holding.quantity,
        investedAmount: holding.investedAmount
      });
    });
    
    Object.entries(holdingsByPortfolio).forEach(([portfolioName, portfolioHoldings]) => {
      console.log(`\n${portfolioName}:`);
      portfolioHoldings.forEach(holding => {
        console.log(`  - ${holding.symbol}: ${holding.quantity} (${holding.investedAmount})`);
      });
    });
    
    // 4. Test de création d'une transaction avec portfolioId
    console.log('\n🧪 Test de création d\'une transaction avec portfolioId...');
    
    // Récupérer un utilisateur et un portfolio
    const user = await prisma.user.findFirst();
    const portfolio = await prisma.portfolio.findFirst({
      where: { userId: user.id }
    });
    
    if (user && portfolio) {
      console.log(`Utilisateur: ${user.email}`);
      console.log(`Portfolio: ${portfolio.name} (${portfolio.id})`);
      
      // Créer une transaction de test
      const testTransaction = await prisma.transaction.create({
        data: {
          userId: user.id,
          symbol: 'TEST',
          name: 'Test Token',
          cmcId: 999999,
          quantity: 1.0,
          amountInvested: 100.0,
          averagePrice: 100.0,
          type: 'BUY',
          transactionDate: new Date(),
          portfolioId: portfolio.id
        }
      });
      
      console.log(`✅ Transaction de test créée: ${testTransaction.id}`);
      
      // Vérifier que le holding a été créé
      const testHolding = await prisma.holding.findFirst({
        where: {
          portfolioId: portfolio.id,
          token: { symbol: 'TEST' }
        },
        include: {
          token: true
        }
      });
      
      if (testHolding) {
        console.log(`✅ Holding créé: ${testHolding.token.symbol} - ${testHolding.quantity}`);
      } else {
        console.log('❌ Aucun holding créé');
      }
      
      // Nettoyer la transaction de test
      await prisma.transaction.delete({
        where: { id: testTransaction.id }
      });
      console.log('🧹 Transaction de test supprimée');
    } else {
      console.log('❌ Aucun utilisateur ou portfolio trouvé pour le test');
    }
    
    console.log('\n✅ Test terminé');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPortfolioFix();
