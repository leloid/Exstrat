const axios = require('axios');

async function testTransactionsAPI() {
  try {
    // 1. Login pour obtenir un token
    console.log('🔐 Connexion...');
    const loginResponse = await axios.post('http://localhost:3000/auth/signin', {
      email: 'test@test.com',
      password: 'test123'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('✅ Token obtenu:', token.substring(0, 20) + '...');
    
    // 2. Récupérer les transactions
    console.log('\n📊 Récupération des transactions...');
    const transactionsResponse = await axios.get('http://localhost:3000/transactions', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('✅ Transactions reçues:', transactionsResponse.data.transactions.length);
    
    if (transactionsResponse.data.transactions.length > 0) {
      const firstTx = transactionsResponse.data.transactions[0];
      console.log('\n📋 Première transaction:');
      console.log('  - ID:', firstTx.id);
      console.log('  - Symbol:', firstTx.symbol);
      console.log('  - portfolioId:', firstTx.portfolioId);
      console.log('  - portfolio:', firstTx.portfolio);
      console.log('\n📋 Transaction complète:');
      console.log(JSON.stringify(firstTx, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
  }
}

testTransactionsAPI();

