/**
 * Script de test de charge pour le dashboard
 * Simule 200 utilisateurs chargeant leur dashboard simultanément
 * 
 * Usage: node load-test-dashboard.js
 * 
 * Variables d'environnement:
 * - API_BASE_URL: URL de base de l'API (défaut: http://localhost:3000)
 * - NUM_USERS: Nombre d'utilisateurs à simuler (défaut: 200)
 * - TEST_EMAIL: Email de test pour l'authentification
 * - TEST_PASSWORD: Mot de passe de test
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const NUM_USERS = parseInt(process.env.NUM_USERS || '200', 10);
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'test123456';

// Statistiques globales
const stats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  errors: [],
  responseTimes: [],
  minTime: Infinity,
  maxTime: 0,
  totalTime: 0,
  requestsByEndpoint: {},
};

// Fonction pour créer un client axios avec authentification
function createAuthenticatedClient(token) {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    timeout: 30000, // 30 secondes
  });
}

// Fonction pour mesurer le temps d'exécution d'une requête
async function measureRequest(client, method, url, data = null) {
  const startTime = Date.now();
  const endpoint = url.split('?')[0]; // Enlever les query params pour le regroupement
  
  try {
    let response;
    if (method === 'GET') {
      response = await client.get(url);
    } else if (method === 'POST') {
      response = await client.post(url, data);
    }
    
    const duration = Date.now() - startTime;
    
    // Mettre à jour les statistiques
    stats.totalRequests++;
    stats.successfulRequests++;
    stats.responseTimes.push(duration);
    stats.totalTime += duration;
    stats.minTime = Math.min(stats.minTime, duration);
    stats.maxTime = Math.max(stats.maxTime, duration);
    
    // Statistiques par endpoint
    if (!stats.requestsByEndpoint[endpoint]) {
      stats.requestsByEndpoint[endpoint] = {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
        errors: 0,
      };
    }
    stats.requestsByEndpoint[endpoint].count++;
    stats.requestsByEndpoint[endpoint].totalTime += duration;
    stats.requestsByEndpoint[endpoint].minTime = Math.min(
      stats.requestsByEndpoint[endpoint].minTime,
      duration
    );
    stats.requestsByEndpoint[endpoint].maxTime = Math.max(
      stats.requestsByEndpoint[endpoint].maxTime,
      duration
    );
    
    return { success: true, response, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    stats.totalRequests++;
    stats.failedRequests++;
    stats.responseTimes.push(duration);
    stats.totalTime += duration;
    stats.minTime = Math.min(stats.minTime, duration);
    stats.maxTime = Math.max(stats.maxTime, duration);
    
    const errorInfo = {
      endpoint: url,
      method,
      status: error.response?.status || 'NETWORK_ERROR',
      message: error.response?.data?.message || error.message,
      duration,
    };
    stats.errors.push(errorInfo);
    
    // Statistiques par endpoint
    if (!stats.requestsByEndpoint[endpoint]) {
      stats.requestsByEndpoint[endpoint] = {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
        errors: 0,
      };
    }
    stats.requestsByEndpoint[endpoint].count++;
    stats.requestsByEndpoint[endpoint].totalTime += duration;
    stats.requestsByEndpoint[endpoint].minTime = Math.min(
      stats.requestsByEndpoint[endpoint].minTime,
      duration
    );
    stats.requestsByEndpoint[endpoint].maxTime = Math.max(
      stats.requestsByEndpoint[endpoint].maxTime,
      duration
    );
    stats.requestsByEndpoint[endpoint].errors++;
    
    return { success: false, error, duration };
  }
}

// Fonction pour simuler le chargement du dashboard d'un utilisateur
async function loadUserDashboard(userIndex, token) {
  const client = createAuthenticatedClient(token);
  const userStartTime = Date.now();
  const userStats = {
    index: userIndex,
    startTime: userStartTime,
    requests: [],
    errors: [],
  };
  
  try {
    // 1. Charger les portfolios
    const portfoliosResult = await measureRequest(client, 'GET', '/portfolios');
    userStats.requests.push({
      endpoint: '/portfolios',
      duration: portfoliosResult.duration,
      success: portfoliosResult.success,
    });
    
    if (!portfoliosResult.success || !portfoliosResult.response?.data) {
      userStats.errors.push('Échec du chargement des portfolios');
      return userStats;
    }
    
    const portfolios = portfoliosResult.response.data;
    if (portfolios.length === 0) {
      userStats.errors.push('Aucun portfolio trouvé');
      return userStats;
    }
    
    // Sélectionner le portfolio par défaut ou le premier
    const defaultPortfolio = portfolios.find(p => p.isDefault) || portfolios[0];
    const portfolioId = defaultPortfolio.id;
    
    // 2. Charger les holdings du portfolio
    const holdingsResult = await measureRequest(
      client,
      'GET',
      `/portfolios/${portfolioId}/holdings`
    );
    userStats.requests.push({
      endpoint: `/portfolios/${portfolioId}/holdings`,
      duration: holdingsResult.duration,
      success: holdingsResult.success,
    });
    
    // 3. Charger les prévisions
    const forecastsResult = await measureRequest(client, 'GET', '/portfolios/forecasts');
    userStats.requests.push({
      endpoint: '/portfolios/forecasts',
      duration: forecastsResult.duration,
      success: forecastsResult.success,
    });
    
    // 4. Charger les configurations d'alertes (optionnel)
    const alertsResult = await measureRequest(
      client,
      'GET',
      '/configuration/alerts'
    );
    userStats.requests.push({
      endpoint: '/configuration/alerts',
      duration: alertsResult.duration,
      success: alertsResult.success,
    });
    
    // 5. Charger les stratégies théoriques (optionnel)
    const strategiesResult = await measureRequest(
      client,
      'GET',
      '/portfolios/theoretical-strategies'
    );
    userStats.requests.push({
      endpoint: '/portfolios/theoretical-strategies',
      duration: strategiesResult.duration,
      success: strategiesResult.success,
    });
    
    const totalDuration = Date.now() - userStartTime;
    userStats.totalDuration = totalDuration;
    userStats.success = userStats.errors.length === 0;
    
    return userStats;
  } catch (error) {
    userStats.errors.push(`Erreur inattendue: ${error.message}`);
    userStats.success = false;
    return userStats;
  }
}

// Fonction pour authentifier un utilisateur
async function authenticateUser(email, password) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/signin`,
      { email, password },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    
    // Le token peut être dans response.data.accessToken ou response.data.token
    return response.data.accessToken || response.data.token || response.data;
  } catch (error) {
    console.error('❌ Erreur d\'authentification:', error.response?.data || error.message);
    throw error;
  }
}

// Fonction principale
async function runLoadTest() {
  console.log('🚀 Démarrage du test de charge du dashboard\n');
  console.log(`📊 Configuration:`);
  console.log(`   - API Base URL: ${API_BASE_URL}`);
  console.log(`   - Nombre d'utilisateurs: ${NUM_USERS}`);
  console.log(`   - Email de test: ${TEST_EMAIL}\n`);
  
  const testStartTime = Date.now();
  
  // Authentifier un utilisateur de test (on réutilise le même token pour tous)
  console.log('🔐 Authentification de l\'utilisateur de test...');
  let authToken;
  try {
    authToken = await authenticateUser(TEST_EMAIL, TEST_PASSWORD);
    console.log('✅ Authentification réussie\n');
  } catch (error) {
    console.error('❌ Échec de l\'authentification. Assurez-vous que:');
    console.error('   1. Le backend est démarré');
    console.error('   2. Un utilisateur avec cet email/mot de passe existe');
    console.error('   3. Les variables d\'environnement sont correctes');
    process.exit(1);
  }
  
  // Créer toutes les promesses pour les utilisateurs
  console.log(`🔄 Lancement de ${NUM_USERS} utilisateurs simultanés...\n`);
  const userPromises = [];
  
  for (let i = 0; i < NUM_USERS; i++) {
    userPromises.push(loadUserDashboard(i + 1, authToken));
  }
  
  // Attendre que tous les utilisateurs terminent
  const userResults = await Promise.allSettled(userPromises);
  
  const testEndTime = Date.now();
  const totalTestDuration = testEndTime - testStartTime;
  
  // Analyser les résultats
  const successfulUsers = userResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failedUsers = NUM_USERS - successfulUsers;
  
  // Calculer les statistiques
  const avgTime = stats.totalRequests > 0 ? stats.totalTime / stats.totalRequests : 0;
  const sortedTimes = stats.responseTimes.sort((a, b) => a - b);
  const medianTime = sortedTimes.length > 0 
    ? sortedTimes[Math.floor(sortedTimes.length / 2)] 
    : 0;
  const p95Time = sortedTimes.length > 0
    ? sortedTimes[Math.floor(sortedTimes.length * 0.95)]
    : 0;
  const p99Time = sortedTimes.length > 0
    ? sortedTimes[Math.floor(sortedTimes.length * 0.99)]
    : 0;
  
  // Afficher les résultats
  console.log('\n' + '='.repeat(80));
  console.log('📈 RÉSULTATS DU TEST DE CHARGE');
  console.log('='.repeat(80) + '\n');
  
  console.log('⏱️  Temps total du test:', `${(totalTestDuration / 1000).toFixed(2)}s`);
  console.log(`👥 Utilisateurs simulés: ${NUM_USERS}`);
  console.log(`✅ Utilisateurs réussis: ${successfulUsers} (${((successfulUsers / NUM_USERS) * 100).toFixed(2)}%)`);
  console.log(`❌ Utilisateurs échoués: ${failedUsers} (${((failedUsers / NUM_USERS) * 100).toFixed(2)}%)\n`);
  
  console.log('📊 Statistiques des requêtes:');
  console.log(`   - Total des requêtes: ${stats.totalRequests}`);
  console.log(`   - Requêtes réussies: ${stats.successfulRequests} (${((stats.successfulRequests / stats.totalRequests) * 100).toFixed(2)}%)`);
  console.log(`   - Requêtes échouées: ${stats.failedRequests} (${((stats.failedRequests / stats.totalRequests) * 100).toFixed(2)}%)\n`);
  
  console.log('⏱️  Temps de réponse (par requête):');
  console.log(`   - Minimum: ${stats.minTime}ms`);
  console.log(`   - Maximum: ${stats.maxTime}ms`);
  console.log(`   - Moyenne: ${avgTime.toFixed(2)}ms`);
  console.log(`   - Médiane: ${medianTime}ms`);
  console.log(`   - P95: ${p95Time}ms`);
  console.log(`   - P99: ${p99Time}ms\n`);
  
  // Temps moyen par utilisateur (dashboard complet)
  const userDurations = userResults
    .filter(r => r.status === 'fulfilled' && r.value.totalDuration)
    .map(r => r.value.totalDuration);
  
  if (userDurations.length > 0) {
    const avgUserTime = userDurations.reduce((a, b) => a + b, 0) / userDurations.length;
    const minUserTime = Math.min(...userDurations);
    const maxUserTime = Math.max(...userDurations);
    
    console.log('⏱️  Temps de chargement du dashboard (par utilisateur):');
    console.log(`   - Minimum: ${minUserTime}ms (${(minUserTime / 1000).toFixed(2)}s)`);
    console.log(`   - Maximum: ${maxUserTime}ms (${(maxUserTime / 1000).toFixed(2)}s)`);
    console.log(`   - Moyenne: ${avgUserTime.toFixed(2)}ms (${(avgUserTime / 1000).toFixed(2)}s)\n`);
  }
  
  // Statistiques par endpoint
  console.log('📊 Statistiques par endpoint:');
  console.log('-'.repeat(80));
  Object.entries(stats.requestsByEndpoint)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([endpoint, endpointStats]) => {
      const avgEndpointTime = endpointStats.count > 0
        ? (endpointStats.totalTime / endpointStats.count).toFixed(2)
        : 0;
      const errorRate = endpointStats.count > 0
        ? ((endpointStats.errors / endpointStats.count) * 100).toFixed(2)
        : 0;
      
      console.log(`\n${endpoint}:`);
      console.log(`   - Requêtes: ${endpointStats.count}`);
      console.log(`   - Temps min: ${endpointStats.minTime}ms`);
      console.log(`   - Temps max: ${endpointStats.maxTime}ms`);
      console.log(`   - Temps moyen: ${avgEndpointTime}ms`);
      console.log(`   - Erreurs: ${endpointStats.errors} (${errorRate}%)`);
    });
  
  // Afficher les erreurs si il y en a
  if (stats.errors.length > 0) {
    console.log('\n❌ Erreurs rencontrées:');
    console.log('-'.repeat(80));
    
    // Grouper les erreurs par type
    const errorGroups = {};
    stats.errors.forEach(error => {
      const key = `${error.status}-${error.endpoint}`;
      if (!errorGroups[key]) {
        errorGroups[key] = {
          status: error.status,
          endpoint: error.endpoint,
          count: 0,
          messages: new Set(),
        };
      }
      errorGroups[key].count++;
      if (error.message) {
        errorGroups[key].messages.add(error.message);
      }
    });
    
    Object.values(errorGroups).forEach(group => {
      console.log(`\n${group.endpoint} (${group.status}):`);
      console.log(`   - Nombre: ${group.count}`);
      if (group.messages.size > 0) {
        console.log(`   - Messages: ${Array.from(group.messages).slice(0, 3).join(', ')}`);
      }
    });
    
    // Afficher les 10 premières erreurs détaillées
    console.log('\n📋 Détails des 10 premières erreurs:');
    stats.errors.slice(0, 10).forEach((error, index) => {
      console.log(`\n${index + 1}. ${error.method} ${error.endpoint}`);
      console.log(`   Status: ${error.status}`);
      console.log(`   Message: ${error.message}`);
      console.log(`   Durée: ${error.duration}ms`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Test terminé');
  console.log('='.repeat(80) + '\n');
}

// Exécuter le test
runLoadTest().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

