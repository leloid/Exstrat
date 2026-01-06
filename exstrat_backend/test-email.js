/**
 * Script de test pour l'envoi d'emails
 * 
 * Usage:
 *   node test-email.js <email> <type>
 * 
 * Exemples:
 *   node test-email.js test@example.com strategy
 *   node test-email.js test@example.com tp
 */

const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const EMAIL = process.argv[2];
const TYPE = process.argv[3] || 'strategy'; // 'strategy' ou 'tp'

if (!EMAIL) {
  console.error('❌ Erreur: Veuillez fournir une adresse email');
  console.log('\nUsage: node test-email.js <email> [strategy|tp]');
  console.log('\nExemples:');
  console.log('  node test-email.js test@example.com strategy');
  console.log('  node test-email.js test@example.com tp');
  process.exit(1);
}

// Pour obtenir un token JWT, vous devez vous connecter via l'API auth
// Pour les tests, vous pouvez temporairement retirer @UseGuards(JwtAuthGuard)
// ou utiliser un token de test
const JWT_TOKEN = process.env.JWT_TOKEN || '';

async function testEmail() {
  try {
    const endpoint = TYPE === 'tp' 
      ? `${BACKEND_URL}/email/test/tp-alert`
      : `${BACKEND_URL}/email/test/strategy-alert`;

    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Ajouter le token si disponible
    if (JWT_TOKEN) {
      config.headers['Authorization'] = `Bearer ${JWT_TOKEN}`;
    }

    console.log(`\n📧 Envoi d'un email de test (${TYPE}) à ${EMAIL}...\n`);

    const response = await axios.post(
      endpoint,
      { email: EMAIL },
      config
    );

    console.log('✅ Succès!', response.data);
    console.log(`\n📬 Vérifiez votre boîte mail: ${EMAIL}`);
    console.log('💡 N\'oubliez pas de vérifier les spams si l\'email n\'arrive pas\n');
  } catch (error) {
    if (error.response) {
      console.error('❌ Erreur HTTP:', error.response.status);
      console.error('Message:', error.response.data);
      
      if (error.response.status === 401) {
        console.error('\n💡 Astuce: Vous devez être authentifié.');
        console.error('   Option 1: Retirez temporairement @UseGuards(JwtAuthGuard) du contrôleur');
        console.error('   Option 2: Fournissez un JWT_TOKEN: JWT_TOKEN=your_token node test-email.js ...');
      }
    } else {
      console.error('❌ Erreur:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        console.error('\n💡 Astuce: Le backend n\'est pas démarré.');
        console.error('   Démarrez-le avec: cd exstrat_backend && npm run start:dev');
      }
    }
    process.exit(1);
  }
}

testEmail();


