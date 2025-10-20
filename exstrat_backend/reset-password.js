const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const email = 'vdfgfdd@gmail.com';
  const newPassword = 'Test123!@#';
  
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword }
  });
  
  console.log(`✅ Mot de passe mis à jour pour ${email}`);
  console.log(`   Nouveau mot de passe: ${newPassword}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
