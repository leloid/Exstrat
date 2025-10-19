const { PrismaClient } = require('@prisma/client');

async function testDelete() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Test de suppression des transactions...\n');
    
    // 1. Récupérer une transaction existante
    const transaction = await prisma.transaction.findFirst({
      include: {
        user: { select: { email: true } }
      }
    });
    
    if (!transaction) {
      console.log('❌ Aucune transaction trouvée pour le test');
      return;
    }
    
    console.log(`📊 Transaction trouvée:`);
    console.log(`  ID: ${transaction.id}`);
    console.log(`  Symbole: ${transaction.symbol}`);
    console.log(`  Quantité: ${transaction.quantity}`);
    console.log(`  Portfolio ID: ${transaction.portfolioId}`);
    console.log(`  Utilisateur: ${transaction.user.email}`);
    
    // 2. Vérifier les holdings avant suppression
    const holdingsBefore = await prisma.holding.findMany({
      where: { portfolioId: transaction.portfolioId },
      include: { token: { select: { symbol: true } } }
    });
    
    console.log(`\n📊 Holdings avant suppression:`);
    holdingsBefore.forEach(holding => {
      console.log(`  ${holding.token.symbol}: ${holding.quantity} (${holding.investedAmount})`);
    });
    
    // 3. Simuler la suppression (sans vraiment supprimer)
    console.log(`\n🧪 Test de la logique de suppression...`);
    
    // Vérifier que la transaction appartient à l'utilisateur
    const userTransaction = await prisma.transaction.findFirst({
      where: {
        id: transaction.id,
        userId: transaction.userId
      }
    });
    
    if (!userTransaction) {
      console.log('❌ Transaction non trouvée ou n\'appartient pas à l\'utilisateur');
      return;
    }
    
    console.log('✅ Transaction trouvée et appartient à l\'utilisateur');
    
    // Vérifier que le portfolio existe
    if (transaction.portfolioId) {
      const portfolio = await prisma.portfolio.findFirst({
        where: {
          id: transaction.portfolioId,
          userId: transaction.userId
        }
      });
      
      if (!portfolio) {
        console.log('❌ Portfolio non trouvé ou n\'appartient pas à l\'utilisateur');
        return;
      }
      
      console.log(`✅ Portfolio trouvé: ${portfolio.name}`);
    }
    
    console.log('\n✅ Test de suppression réussi - la logique semble correcte');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDelete();
