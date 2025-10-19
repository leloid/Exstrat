#!/bin/bash

echo "🧪 Test de l'API ExStrat avec logs détaillés"
echo "=============================================="

# Variables
BASE_URL="http://localhost:3000"
EMAIL="test@exstrat.com"
PASSWORD="SecurePassword123!"

echo ""
echo "1️⃣ Connexion pour obtenir un token JWT..."
echo "POST $BASE_URL/auth/signin"
echo ""

# Connexion
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signin" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

echo "📥 Réponse de connexion:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# Extraire le token
TOKEN=$(echo "$RESPONSE" | jq -r '.accessToken' 2>/dev/null)

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Erreur: Impossible d'obtenir le token JWT"
    exit 1
fi

echo ""
echo "✅ Token JWT obtenu: ${TOKEN:0:50}..."
echo ""

echo "2️⃣ Test de l'API de recherche de tokens..."
echo "GET $BASE_URL/tokens/search?symbol=BTC"
echo ""

# Test recherche tokens
echo "📡 Envoi de la requête avec token JWT..."
TOKEN_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/tokens/search?symbol=BTC")

echo "📥 Réponse de l'API tokens:"
echo "$TOKEN_RESPONSE" | jq '.' 2>/dev/null || echo "$TOKEN_RESPONSE"

echo ""
echo "3️⃣ Test de l'API de création de transaction..."
echo "POST $BASE_URL/transactions"
echo ""

# Test création transaction
TRANSACTION_RESPONSE=$(curl -s -X POST "$BASE_URL/transactions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTC",
    "name": "Bitcoin",
    "cmcId": 1,
    "quantity": 0.05,
    "amountInvested": 6150,
    "averagePrice": 123000,
    "type": "BUY",
    "notes": "Test depuis Swagger"
  }')

echo "📥 Réponse de l'API transactions:"
echo "$TRANSACTION_RESPONSE" | jq '.' 2>/dev/null || echo "$TRANSACTION_RESPONSE"

echo ""
echo "4️⃣ Test de l'API portfolio..."
echo "GET $BASE_URL/transactions/portfolio"
echo ""

# Test portfolio
PORTFOLIO_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/transactions/portfolio")

echo "📥 Réponse de l'API portfolio:"
echo "$PORTFOLIO_RESPONSE" | jq '.' 2>/dev/null || echo "$PORTFOLIO_RESPONSE"

echo ""
echo "✅ Tests terminés !"
echo ""
echo "🔍 Pour voir les logs détaillés du serveur, regardez la console du backend."
echo "📊 Pour tester avec Swagger, allez sur: http://localhost:3000/api"
echo "🔑 Utilisez ce token dans Swagger: $TOKEN"
