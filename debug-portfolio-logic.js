const { PrismaClient } = require('@prisma/client');

async function debugPortfolioLogic() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Debug de la logique des portfolios...\n');
    
    // 1. Vérifier tous les portfolios avec leurs holdings
    const portfolios = await prisma.portfolio.findMany({
      include: {
        user: { select: { email: true } },
        holdings: {
          include: {
            token: { select: { symbol: true, name: true } }
          }
        },
        transactions: {
          select: {
            symbol: true,
            quantity: true,
            amountInvested: true,
            type: true
          }
        }
      }
    });
    
    console.log(`📊 Portfolios trouvés: ${portfolios.length}\n`);
    
    portfolios.forEach((portfolio, index) => {
      console.log(`${index + 1}. ${portfolio.name} (${portfolio.user.email})`);
      console.log(`   ID: ${portfolio.id}`);
      console.log(`   Par défaut: ${portfolio.isDefault}`);
      console.log(`   Holdings: ${portfolio.holdings.length}`);
      
      if (portfolio.holdings.length > 0) {
        console.log('   Tokens dans ce portfolio:');
        portfolio.holdings.forEach(holding => {
          console.log(`     - ${holding.token.symbol}: ${holding.quantity} (${holding.investedAmount})`);
        });
      } else {
        console.log('   ❌ Aucun holding dans ce portfolio');
      }
      
      console.log(`   Transactions: ${portfolio.transactions.length}`);
      if (portfolio.transactions.length > 0) {
        console.log('   Détails des transactions:');
        portfolio.transactions.forEach(tx => {
          console.log(`     - ${tx.symbol}: ${tx.quantity} (${tx.type}) - ${tx.amountInvested}`);
        });
      } else {
        console.log('   ❌ Aucune transaction dans ce portfolio');
      }
      
      console.log('');
    });
    
    // 2. Vérifier les relations Prisma
    console.log('🔍 Vérification des relations Prisma...\n');
    
    // Test de la relation Portfolio -> Holdings
    const portfolioWithHoldings = await prisma.portfolio.findFirst({
      where: { name: 'Portfolio Principal' },
      include: {
        holdings: {
          include: {
            token: true
          }
        }
      }
    });
    
    if (portfolioWithHoldings) {
      console.log(`Portfolio Principal holdings: ${portfolioWithHoldings.holdings.length}`);
      portfolioWithHoldings.holdings.forEach(holding => {
        console.log(`  - ${holding.token.symbol}: ${holding.quantity}`);
      });
    }
    
    // Test de la relation Portfolio -> Transactions
    const portfolioWithTransactions = await prisma.portfolio.findFirst({
      where: { name: 'Portfolio Principal' },
      include: {
        transactions: true
      }
    });
    
    if (portfolioWithTransactions) {
      console.log(`Portfolio Principal transactions: ${portfolioWithTransactions.transactions.length}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPortfolioLogic();
