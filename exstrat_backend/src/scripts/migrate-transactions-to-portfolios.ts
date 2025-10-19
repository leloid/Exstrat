import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateTransactionsToPortfolios() {
  console.log('🔄 Migration des transactions vers les portfolios...');

  try {
    // Récupérer tous les utilisateurs qui ont des transactions
    const usersWithTransactions = await prisma.user.findMany({
      where: {
        transactions: {
          some: {},
        },
      },
      select: {
        id: true,
        email: true,
      },
    });

    console.log(`📊 ${usersWithTransactions.length} utilisateurs avec des transactions trouvés`);

    for (const user of usersWithTransactions) {
      console.log(`\n👤 Migration pour ${user.email}...`);

      // 1. Créer un portfolio par défaut s'il n'existe pas
      let defaultPortfolio = await prisma.portfolio.findFirst({
        where: { userId: user.id, isDefault: true },
      });

      if (!defaultPortfolio) {
        defaultPortfolio = await prisma.portfolio.create({
          data: {
            userId: user.id,
            name: 'Portfolio Principal',
            description: 'Portfolio créé automatiquement à partir des transactions existantes',
            isDefault: true,
          },
        });
        console.log(`  ✅ Portfolio par défaut créé`);
      } else {
        console.log(`  ℹ️  Portfolio par défaut existe déjà`);
      }

      // 2. Récupérer tous les tokens uniques des transactions de l'utilisateur
      const userTransactions = await prisma.transaction.findMany({
        where: { userId: user.id },
        select: { symbol: true, name: true, cmcId: true },
        distinct: ['symbol'],
      });

      console.log(`  📈 ${userTransactions.length} tokens uniques trouvés`);

      // 3. Pour chaque token, créer le token et calculer le holding
      for (const tx of userTransactions) {
        // Créer le token s'il n'existe pas
        let token = await prisma.token.findUnique({
          where: { symbol: tx.symbol },
        });

        if (!token) {
          token = await prisma.token.create({
            data: {
              symbol: tx.symbol,
              name: tx.name,
              cmcId: tx.cmcId,
            },
          });
          console.log(`    ✅ Token créé: ${tx.symbol}`);
        }

        // Calculer le holding basé sur toutes les transactions
        const allTransactions = await prisma.transaction.findMany({
          where: { userId: user.id, symbol: tx.symbol },
          orderBy: { transactionDate: 'asc' },
        });

        let totalQuantity = 0;
        let totalInvested = 0;

        for (const transaction of allTransactions) {
          if (transaction.type === 'BUY' || transaction.type === 'TRANSFER_IN' || transaction.type === 'STAKING' || transaction.type === 'REWARD') {
            totalQuantity += Number(transaction.quantity);
            totalInvested += Number(transaction.amountInvested);
          } else if (transaction.type === 'SELL' || transaction.type === 'TRANSFER_OUT') {
            const sellValue = Number(transaction.quantity) * Number(transaction.averagePrice);
            totalQuantity = Math.max(0, totalQuantity - Number(transaction.quantity));
            totalInvested = Math.max(0, totalInvested - (Number(transaction.amountInvested) || sellValue));
          }
        }

        const averagePrice = totalQuantity > 0 ? totalInvested / totalQuantity : 0;

        // Créer ou mettre à jour le holding
        if (totalQuantity > 0) {
          await prisma.holding.upsert({
            where: {
              portfolioId_tokenId: {
                portfolioId: defaultPortfolio.id,
                tokenId: token.id,
              },
            },
            update: {
              quantity: totalQuantity,
              investedAmount: totalInvested,
              averagePrice: averagePrice,
              lastUpdated: new Date(),
            },
            create: {
              portfolioId: defaultPortfolio.id,
              tokenId: token.id,
              quantity: totalQuantity,
              investedAmount: totalInvested,
              averagePrice: averagePrice,
            },
          });
          console.log(`    ✅ Holding mis à jour: ${tx.symbol} (${totalQuantity} tokens, ${totalInvested}€ investis)`);
        } else {
          // Supprimer le holding s'il existe et que la quantité est 0
          await prisma.holding.deleteMany({
            where: {
              portfolioId: defaultPortfolio.id,
              tokenId: token.id,
            },
          });
          console.log(`    🗑️  Holding supprimé: ${tx.symbol} (quantité = 0)`);
        }
      }
    }

    console.log('\n🎉 Migration terminée avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la migration
migrateTransactionsToPortfolios()
  .catch((error) => {
    console.error('Migration échouée:', error);
    process.exit(1);
  });
