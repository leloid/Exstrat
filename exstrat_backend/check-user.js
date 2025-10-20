const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const strategies = await prisma.userStrategy.findFirst({
    include: {
      user: true
    }
  });
  
  if (strategies) {
    console.log('👤 Utilisateur avec des stratégies:');
    console.log(`  - ID: ${strategies.user.id}`);
    console.log(`  - Email: ${strategies.user.email}`);
  } else {
    console.log('Aucune stratégie trouvée');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
