const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Vérification des stratégies...\n');
  
  const strategies = await prisma.userStrategy.findMany({
    include: {
      portfolio: true,
      tokenConfigs: {
        include: {
          holding: {
            include: {
              token: true
            }
          }
        }
      }
    }
  });
  
  console.log(`📊 Nombre de stratégies: ${strategies.length}\n`);
  
  strategies.forEach((s, i) => {
    console.log(`Stratégie ${i + 1}:`);
    console.log(`  - ID: ${s.id}`);
    console.log(`  - Nom: ${s.name}`);
    console.log(`  - Portfolio: ${s.portfolio ? s.portfolio.name : 'AUCUN!'}`);
    console.log(`  - Configurations: ${s.tokenConfigs.length}`);
    if (s.tokenConfigs.length > 0) {
      s.tokenConfigs.forEach((c, j) => {
        console.log(`    Config ${j + 1}: ${c.holding.token.symbol}, règles: ${JSON.stringify(c.customProfitTakingRules)}`);
      });
    }
    console.log('');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
