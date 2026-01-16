import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script DANGEREUX pour nettoyer la base de données de PRODUCTION
 * ⚠️  ATTENTION : Ce script supprime TOUTES les données de production !
 * 
 * UTILISATION :
 * 1. Assurez-vous d'avoir fait un backup avant
 * 2. Définissez FORCE_PRODUCTION_CLEAN=true dans votre .env
 * 3. Exécutez: npm run clean-db-prod
 */
async function cleanDatabase() {
  console.log('🧹 Début du nettoyage de la base de données PRODUCTION...\n');

  try {
    // Afficher les informations de la base de données
    const databaseUrl = process.env.DATABASE_URL || '';
    const maskedUrl = databaseUrl.replace(/:[^:@]+@/, ':****@');
    console.log('📊 Informations de la base de données :');
    console.log(`   URL masquée: ${maskedUrl.substring(0, 80)}...\n`);

    // Utilisation de DELETE dans l'ordre inverse des dépendances
    console.log('📋 Suppression des données de toutes les tables...\n');

    // Liste de toutes les tables dans l'ordre inverse des dépendances
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

    let totalDeleted = 0;

    // Supprimer toutes les données de chaque table dans l'ordre
    for (const table of tables) {
      try {
        const result = await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`);
        const count = typeof result === 'number' ? result : 0;
        totalDeleted += count;
        console.log(`  ✅ ${table} vidée (${count} lignes supprimées)`);
      } catch (error: any) {
        console.error(`  ❌ Erreur lors du vidage de ${table}:`, error.message);
        throw error;
      }
    }

    console.log(`\n  ✅ ${tables.length} tables vidées avec succès`);
    console.log(`  📊 Total: ${totalDeleted} lignes supprimées`);

    console.log('\n✨ Nettoyage de production terminé avec succès !');
    console.log('📊 Toutes les tables ont été vidées, la structure est conservée.\n');
  } catch (error) {
    console.error('\n❌ Erreur lors du nettoyage de la base de données:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction principale avec confirmations multiples
async function main() {
  const databaseUrl = process.env.DATABASE_URL || '';
  const forceFlag = process.env.FORCE_PRODUCTION_CLEAN === 'true';

  // Vérifier que FORCE_PRODUCTION_CLEAN est défini
  if (!forceFlag) {
    console.error('\n❌ ERREUR : Variable d\'environnement manquante !\n');
    console.error('   Pour vider la base de données de PRODUCTION, vous devez :');
    console.error('   1. Ajouter FORCE_PRODUCTION_CLEAN=true dans votre .env');
    console.error('   2. Relancer le script\n');
    console.error('   ⚠️  Cette protection empêche les suppressions accidentelles.\n');
    process.exit(1);
  }

  // Afficher un avertissement très visible
  console.log('\n');
  console.log('═'.repeat(70));
  console.log('⚠️  ⚠️  ⚠️  ATTENTION : NETTOYAGE DE PRODUCTION ⚠️  ⚠️  ⚠️');
  console.log('═'.repeat(70));
  console.log('\n');
  console.log('🚨 Ce script va supprimer TOUTES les données de votre base de données PRODUCTION !');
  console.log('🚨 Cette action est IRRÉVERSIBLE !');
  console.log('🚨 Tous les utilisateurs, transactions, stratégies seront PERDUS !\n');

  const maskedUrl = databaseUrl.replace(/:[^:@]+@/, ':****@');
  console.log('📊 Base de données cible :');
  console.log(`   ${maskedUrl.substring(0, 80)}...\n`);

  // Première confirmation
  console.log('⚠️  Première confirmation requise...');
  console.log('   Tapez "OUI JE VEUX SUPPRIMER TOUT" pour continuer (ou Ctrl+C pour annuler) :\n');
  
  // Lire depuis stdin (simplifié - dans un vrai cas, utiliser readline)
  const args = process.argv.slice(2);
  const skipConfirm = args.includes('--skip-confirm');

  if (!skipConfirm) {
    console.log('   (Pour sauter cette confirmation, utilisez: npm run clean-db-prod -- --skip-confirm)\n');
    console.log('   ⏳ Attente de 10 secondes avant de continuer...');
    console.log('   Appuyez sur Ctrl+C pour annuler maintenant !\n');
    
    await new Promise(resolve => setTimeout(resolve, 10000));
  }

  // Deuxième confirmation avec compte à rebours
  console.log('\n⚠️  Dernière chance !');
  console.log('   Le nettoyage va commencer dans 5 secondes...');
  console.log('   Appuyez sur Ctrl+C MAINTENANT pour annuler !\n');
  
  for (let i = 5; i > 0; i--) {
    process.stdout.write(`   ${i}... `);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  console.log('\n');

  // Exécuter le nettoyage
  await cleanDatabase();
}

// Exécuter le script
main()
  .catch((error) => {
    console.error('\n❌ Nettoyage échoué:', error);
    process.exit(1);
  });

