const { PrismaClient } = require('@prisma/client');

async function restorePortfolioData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Restauration des données des portfolios...\n');
    
    // 1. Récupérer tous les utilisateurs
    const users = await prisma.user.findMany({
      select: { id: true, email: true }
    });
    
    console.log(`👥 Utilisateurs trouvés: ${users.length}`);
    
    for (const user of users) {
      console.log(`\n👤 Traitement pour ${user.email}...`);
      
      // 2. Récupérer tous les portfolios de cet utilisateur
      const portfolios = await prisma.portfolio.findMany({
        where: { userId: user.id },
        include: {
          transactions: {
            select: { symbol: true, name: true, cmcId: true },
            distinct: ['symbol']
          }
        }
      });
      
      console.log(`   Portfolios: ${portfolios.length}`);
      
      // 3. Pour chaque portfolio, recalculer les holdings
      for (const portfolio of portfolios) {
        console.log(`   📁 Portfolio: ${portfolio.name}`);
        console.log(`   📊 Transactions: ${portfolio.transactions.length}`);
        
        // Supprimer les holdings existants pour ce portfolio
        await prisma.holding.deleteMany({
          where: { portfolioId: portfolio.id }
        });
        
        // Recalculer pour chaque token
        for (const tx of portfolio.transactions) {
          // Créer le token s'il n'existe pas
          let token = await prisma.token.findUnique({
            where: { symbol: tx.symbol }
          });
          
          if (!token) {
            token = await prisma.token.create({
              data: {
                symbol: tx.symbol,
                name: tx.name,
                cmcId: tx.cmcId
              }
            });
            console.log(`     ✅ Token créé: ${token.symbol}`);
          }
          
          // Recalculer le holding
          await recalculateHolding(prisma, user.id, portfolio.id, token.id, tx.symbol);
          console.log(`     ✅ Holding recalculé pour ${tx.symbol}`);
        }
      }
    }
    
    console.log('\n✅ Restauration terminée');
    
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

restorePortfolioData();
