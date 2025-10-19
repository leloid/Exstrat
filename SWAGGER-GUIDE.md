# 🔧 Guide Swagger - ExStrat API

## 🚀 **Accès à Swagger**
- **URL**: http://localhost:3000/api
- **Interface**: Documentation interactive complète

## 🔐 **Authentification dans Swagger**

### **1. Obtenir un Token JWT**
1. Allez sur la section **"Authentication"**
2. Utilisez l'endpoint `POST /auth/signin`
3. Entrez les données de test :
   ```json
   {
     "email": "test@exstrat.com",
     "password": "SecurePassword123!"
   }
   ```
4. Copiez le `accessToken` de la réponse

### **2. Configurer l'Autorisation**
1. Cliquez sur le bouton **"Authorize"** en haut à droite
2. Dans le champ **"Value"**, entrez : `Bearer <votre-token>`
   ```
   Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. Cliquez sur **"Authorize"**
4. Cliquez sur **"Close"**

### **3. Tester les APIs**
Maintenant vous pouvez tester toutes les APIs protégées !

## 🧪 **Tests Recommandés**

### **🔍 API Tokens**
1. **Recherche par symbole** : `GET /tokens/search?symbol=BTC`
2. **Recherche par nom** : `GET /tokens/search/name?query=bitcoin`
3. **Token par ID** : `GET /tokens/1`

### **💰 API Transactions**
1. **Créer une transaction** : `POST /transactions`
   ```json
   {
     "symbol": "BTC",
     "name": "Bitcoin",
     "cmcId": 1,
     "quantity": 0.1,
     "amountInvested": 12300,
     "averagePrice": 123000,
     "type": "BUY",
     "notes": "Test depuis Swagger"
   }
   ```

2. **Lister les transactions** : `GET /transactions`
3. **Portfolio** : `GET /transactions/portfolio`
4. **Transaction par ID** : `GET /transactions/{id}`

## 🐛 **Dépannage**

### **❌ Erreur 401 Unauthorized**
- **Cause** : Token JWT manquant ou invalide
- **Solution** : 
  1. Vérifiez que vous avez cliqué sur "Authorize"
  2. Vérifiez le format : `Bearer <token>`
  3. Vérifiez que le token n'est pas expiré

### **❌ Erreur 500 Internal Server Error**
- **Cause** : Erreur côté serveur
- **Solution** : Regardez les logs du serveur backend

### **❌ Erreur CoinMarketCap**
- **Cause** : Limite de requêtes ou clé API
- **Solution** : Attendez quelques minutes et réessayez

## 📊 **Logs Détaillés**

Les logs sont maintenant activés dans le serveur. Vous verrez :

```
🔐 [JwtAuthGuard] Checking authentication for: /tokens/search
🔐 [JwtAuthGuard] Authorization header: Present
🎫 [JwtStrategy] Validating payload: { sub: '...', email: '...' }
✅ [JwtStrategy] User validated: ID: ..., Email: ...
🎯 [TokensController] searchBySymbol called with symbol: BTC
🔍 [TokensService] searchTokens called with query: BTC
📡 [TokensService] Making request to CoinMarketCap API...
✅ [TokensService] API Response status: 200
🎯 [TokensService] Found tokens: 1
```

## 🎯 **Token de Test Actuel**
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWczbGh5MjEwMDAwNDRmcDVtaXllMzlhIiwiZW1haWwiOiJ0ZXN0QGV4c3RyYXQuY29tIiwiaWF0IjoxNzU5NjY5MzQ4LCJleHAiOjE3NTk3NTU3NDgsImF1ZCI6ImV4c3RyYXQtY2xpZW50IiwiaXNzIjoiZXhzdHJhdC1hcGkifQ.UbYuFDb7VcC-y5NXINHDxTIA1ilsVGmVx2lb28defcg
```

## ✅ **Vérification**
Si tout fonctionne, vous devriez voir :
- ✅ **Authentification** : Token accepté
- ✅ **Recherche tokens** : Données Bitcoin/Ethereum
- ✅ **Création transaction** : Transaction créée avec ID
- ✅ **Portfolio** : Positions consolidées

## 🚨 **Notes Importantes**
- Le token JWT expire après 24h
- Les logs détaillés sont dans la console du serveur
- CoinMarketCap a des limites de requêtes
- Toutes les APIs (sauf auth) nécessitent une authentification
