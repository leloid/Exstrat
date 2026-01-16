import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script pour nettoyer complètement la base de données
 * Supprime toutes les données mais garde la structure des tables
 */
async function cleanDatabase() {
  console.log('🧹 Début du nettoyage de la base de données...\n');

  try {
    // Utilisation de DELETE dans l'ordre inverse des dépendances
    // On supprime d'abord les tables enfants, puis les tables parents
    // Cela évite les erreurs de contraintes de clés étrangères
    // DELETE est plus lent que TRUNCATE mais ne nécessite pas de permissions spéciales
    
    console.log('📋 Suppression des données de toutes les tables...\n');

    // Liste de toutes les tables dans l'ordre inverse des dépendances
    // (enfants avant parents pour éviter les erreurs de contraintes)
    const tables = [
      'TPAlert',
      'TokenAlert',
      'AlertConfiguration',
      'SimulationResult',
      'TokenStrategyConfiguration',
      'UserStrategy',
      'TheoreticalStrategy',
      'Forecast',
      'Holding',
      'Portfolio',
      'Transaction',
      'StrategyStep',
      'StrategyExecution',
      'Strategy',
      'Position',
      'Transfer',
      'Trade',
      'Balance',
      'ExchangeAccount',
      'Token',
      'StrategyTemplate',
      'ProfitTakingTemplate',
      'User',
    ];

    // Supprimer toutes les données de chaque table dans l'ordre
    // L'ordre garantit que les tables enfants sont vidées avant les parents
    for (const table of tables) {
      try {
        const result = await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`);
        const count = typeof result === 'number' ? result : 0;
        console.log(`  ✅ ${table} vidée (${count} lignes supprimées)`);
      } catch (error: any) {
        console.error(`  ❌ Erreur lors du vidage de ${table}:`, error.message);
        throw error;
      }
    }

    // Note: Les séquences ne sont pas réinitialisées avec DELETE
    // Si vous avez besoin de réinitialiser les IDs, utilisez TRUNCATE avec les bonnes permissions

    console.log(`\n  ✅ ${tables.length} tables vidées avec succès`);

    console.log('\n✨ Nettoyage terminé avec succès !');
    console.log('📊 Toutes les tables ont été vidées, la structure est conservée.\n');
  } catch (error) {
    console.error('\n❌ Erreur lors du nettoyage de la base de données:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction principale avec confirmation
async function main() {
  // Vérification de sécurité : empêcher l'exécution en production
  const nodeEnv = process.env.NODE_ENV;
  const databaseUrl = process.env.DATABASE_URL || '';
  
  // Détecter si on est en production
  const isProduction = 
    nodeEnv === 'production' ||
    databaseUrl.includes('railway.app') ||
    databaseUrl.includes('render.com') ||
    databaseUrl.includes('vercel.app') ||
    databaseUrl.includes('herokuapp.com') ||
    databaseUrl.includes('amazonaws.com') ||
    databaseUrl.includes('azure.com') ||
    databaseUrl.includes('production') ||
    databaseUrl.includes('prod-');

  if (isProduction) {
    console.error('\n❌ ERREUR DE SÉCURITÉ : Ce script ne peut PAS être exécuté en production !\n');
    console.error('   Détection de production basée sur :');
    if (nodeEnv === 'production') {
      console.error(`   - NODE_ENV=${nodeEnv}`);
    }
    if (databaseUrl) {
      const maskedUrl = databaseUrl.replace(/:[^:@]+@/, ':****@');
      console.error(`   - DATABASE_URL contient un indicateur de production`);
      console.error(`   - URL masquée: ${maskedUrl.substring(0, 50)}...`);
    }
    console.error('\n   Ce script est uniquement destiné au développement local.\n');
    console.error('   Si vous voulez vraiment nettoyer la production (DANGEREUX),');
    console.error('   vous devez modifier manuellement ce script.\n');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const forceFlag = args.includes('--force') || args.includes('-f');

  if (!forceFlag) {
    console.log('⚠️  ATTENTION: Ce script va supprimer TOUTES les données de la base de données !');
    console.log('   La structure des tables sera conservée.\n');
    console.log('   Pour exécuter sans confirmation, utilisez: npm run clean-db -- --force\n');
    console.log('   Appuyez sur Ctrl+C pour annuler, ou attendez 5 secondes pour continuer...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Exécuter le nettoyage
  await cleanDatabase();
}

// Exécuter le script
main()
  .catch((error) => {
    console.error('Nettoyage échoué:', error);
    process.exit(1);
  });

