const { PrismaClient } = require('@prisma/client');

async function recalculateAllHoldings() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Recalcul de tous les holdings...\n');
    
    // 1. Récupérer tous les portfolios
    const portfolios = await prisma.portfolio.findMany({
      include: {
        user: { select: { email: true } },
        transactions: {
          select: { symbol: true, name: true, cmcId: true },
          distinct: ['symbol']
        }
      }
    });
    
    console.log(`📊 Portfolios trouvés: ${portfolios.length}`);
    
    for (const portfolio of portfolios) {
      console.log(`\n🔄 Recalcul pour ${portfolio.name} (${portfolio.user.email})`);
      
      // Supprimer tous les holdings existants pour ce portfolio
      await prisma.holding.deleteMany({
        where: { portfolioId: portfolio.id }
      });
      console.log(`   ✅ Holdings existants supprimés`);
      
      // Recalculer pour chaque token
      for (const tokenData of portfolio.transactions) {
        // Créer le token s'il n'existe pas
        let token = await prisma.token.findUnique({
          where: { symbol: tokenData.symbol }
        });
        
        if (!token) {
          token = await prisma.token.create({
            data: {
              symbol: tokenData.symbol,
              name: tokenData.name,
              cmcId: tokenData.cmcId
            }
          });
          console.log(`   ✅ Token créé: ${token.symbol}`);
        }
        
        // Recalculer le holding
        await recalculateHolding(prisma, portfolio.userId, portfolio.id, token.id, tokenData.symbol);
        console.log(`   ✅ Holding recalculé pour ${tokenData.symbol}`);
      }
    }
    
    console.log('\n✅ Recalcul terminé');
    
    // Vérifier les résultats
    console.log('\n📊 Vérification des résultats:');
    const portfoliosWithHoldings = await prisma.portfolio.findMany({
      include: {
        user: { select: { email: true } },
        holdings: {
          include: {
            token: { select: { symbol: true } }
          }
        }
      }
    });
    
    portfoliosWithHoldings.forEach(portfolio => {
      console.log(`\n${portfolio.name} (${portfolio.user.email}):`);
      console.log(`  Holdings: ${portfolio.holdings.length}`);
      portfolio.holdings.forEach(holding => {
        console.log(`    - ${holding.token.symbol}: ${holding.quantity} (${holding.investedAmount})`);
      });
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function recalculateHolding(prisma, userId, portfolioId, tokenId, symbol) {
  // Récupérer toutes les transactions pour ce token dans ce portfolio
  const transactions = await prisma.transaction.findMany({
    where: { 
      userId, 
      symbol,
      portfolioId: portfolioId
    },
    orderBy: { transactionDate: 'asc' }
  });

  let totalQuantity = 0;
  let totalInvested = 0;

  // Calculer les totaux
  for (const tx of transactions) {
    if (tx.type === 'BUY' || tx.type === 'TRANSFER_IN' || tx.type === 'STAKING' || tx.type === 'REWARD') {
      totalQuantity += Number(tx.quantity);
      totalInvested += Number(tx.amountInvested);
    } else if (tx.type === 'SELL' || tx.type === 'TRANSFER_OUT') {
      const sellValue = Number(tx.quantity) * Number(tx.averagePrice);
      totalQuantity = Math.max(0, totalQuantity - Number(tx.quantity));
      totalInvested = Math.max(0, totalInvested - (Number(tx.amountInvested) || sellValue));
    }
  }

  const averagePrice = totalQuantity > 0 ? totalInvested / totalQuantity : 0;

  // Mettre à jour ou créer le holding
  if (totalQuantity > 0) {
    await prisma.holding.upsert({
      where: {
        portfolioId_tokenId: {
          portfolioId,
          tokenId
        }
      },
      update: {
        quantity: totalQuantity,
        investedAmount: totalInvested,
        averagePrice: averagePrice
      },
      create: {
        portfolioId,
        tokenId,
        quantity: totalQuantity,
        investedAmount: totalInvested,
        averagePrice: averagePrice
      }
    });
  }
}

recalculateAllHoldings();
