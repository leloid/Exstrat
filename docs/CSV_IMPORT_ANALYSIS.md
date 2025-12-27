# 📊 Analyse d'Intégration CSV - Import de Transactions

## 🎯 Objectif
Permettre aux utilisateurs d'importer leurs transactions depuis des fichiers CSV exportés par **Coinbase**, **Crypto.com** et **Binance**, avec calcul automatique du prix moyen et synchronisation avec les portfolios.

---

## 📋 Analyse des Formats CSV

### 1. **Coinbase** (`coinbase_tx_list.csv`)

**Structure :**
```
ID,Timestamp,Transaction Type,Asset,Quantity Transacted,Price Currency,Price at Transaction,Subtotal,Total (inclusive of fees and/or spread),Fees and/or Spread,Notes
```

**Types de transactions identifiés :**
- `Advanced Trade Buy` → `BUY`
- `Advanced Trade Sell` → `SELL`
- `Buy` → `BUY`
- `Send` → `TRANSFER_OUT` (quantité négative)
- `Receive` → `TRANSFER_IN` (quantité positive)
- `Reward Income` → `REWARD`
- `Deposit` → `TRANSFER_IN` (fiat)
- `Pro Withdrawal` → `TRANSFER_OUT`
- `Pro Deposit` → `TRANSFER_IN`

**Mapping des données :**
- `Asset` → `symbol`
- `Quantity Transacted` → `quantity` (valeur absolue)
- `Price at Transaction` → `averagePrice`
- `Total` → `amountInvested` (inclut les frais)
- `Timestamp` → `transactionDate`
- `Notes` → `notes`

**Exemple :**
```csv
678bc07ce631ff618bee7b4a,2025-01-18 14:53:48 UTC,Advanced Trade Buy,BTC,0.00424956,USD,$103882.31,$441.45411,$446.75156,$5.2974493114032,Bought 0.00424956 BTC for 446.7515585950032 USDC on BTC-USDC at 103882.31 USDC/BTC
```
→ Transaction BUY de 0.00424956 BTC à $103882.31, montant total $446.75

---

### 2. **Crypto.com** (`cryptoptcom_tx_list.csv`)

**Structure :**
```
Timestamp (UTC),Transaction Description,Currency,Amount,To Currency,To Amount,Native Currency,Native Amount,Native Amount (in USD),Transaction Kind,Transaction Hash
```

**Types de transactions identifiés :**
- `crypto_purchase` → `BUY`
- `recurring_buy_order` → `BUY`
- `crypto_withdrawal` → `TRANSFER_OUT` (quantité négative)

**Mapping des données :**
- `Currency` → `symbol`
- `Amount` → `quantity` (valeur absolue)
- `Native Amount (in USD)` → `amountInvested`
- `Native Amount (in USD) / Amount` → `averagePrice` (calculé)
- `Timestamp (UTC)` → `transactionDate`
- `Transaction Description` → `notes`

**Exemple :**
```csv
2023-12-16 23:04:22,Bought ETH,EUR,80.00,ETH,0.038540104177433035,EUR,80.0,95.3795948,recurring_buy_order,
```
→ Transaction BUY de 0.03854 ETH pour $95.38, prix moyen = $95.38 / 0.03854 = $2473.50

---

### 3. **Binance** (Format attendu)

**Structure typique :**
```
Date(UTC),Pair,Type,Order Price,Order Amount,AvgTrading Price,Filled,Total,status
```

**Types de transactions :**
- `BUY` → `BUY`
- `SELL` → `SELL`

**Mapping des données :**
- `Pair` (ex: BTC/USDT) → `symbol` (BTC)
- `Filled` → `quantity`
- `AvgTrading Price` → `averagePrice`
- `Total` → `amountInvested`
- `Date(UTC)` → `transactionDate`

---

## ✅ Faisabilité

### **OUI, c'est 100% faisable !** 🎉

**Avantages :**
1. ✅ Les formats CSV sont structurés et prévisibles
2. ✅ Les prix sont souvent directement disponibles dans les CSV
3. ✅ L'API de recherche de tokens existe déjà (`/tokens/search`)
4. ✅ Le système de transactions est déjà en place
5. ✅ Le calcul du prix moyen peut être fait automatiquement

**Challenges :**
1. ⚠️ **Mapping des symboles** : Certains tokens peuvent avoir des symboles différents (ex: USDC vs USDC.e)
2. ⚠️ **Gestion des erreurs** : Que faire si un token n'est pas trouvé ?
3. ⚠️ **Déduplication** : Éviter d'importer deux fois la même transaction
4. ⚠️ **Validation** : Vérifier la cohérence des données (quantité, prix, montant)

---

## 🏗️ Architecture Proposée

### **Backend** (`exstrat_backend/`)

#### 1. **Service de Parsing CSV** (`src/csv-import/csv-parser.service.ts`)

```typescript
@Injectable()
export class CsvParserService {
  parseCoinbase(file: Express.Multer.File): Promise<ParsedTransaction[]>
  parseCryptoCom(file: Express.Multer.File): Promise<ParsedTransaction[]>
  parseBinance(file: Express.Multer.File): Promise<ParsedTransaction[]>
}
```

**Fonctionnalités :**
- Détection automatique du format (Coinbase, Crypto.com, Binance)
- Parsing des lignes CSV
- Mapping vers le format interne `ParsedTransaction`
- Validation des données (quantités, prix, dates)

#### 2. **Service d'Import** (`src/csv-import/csv-import.service.ts`)

```typescript
@Injectable()
export class CsvImportService {
  async importTransactions(
    userId: string,
    file: Express.Multer.File,
    exchange: 'coinbase' | 'cryptocom' | 'binance',
    portfolioId?: string
  ): Promise<ImportResult>
}
```

**Fonctionnalités :**
- Parsing du CSV
- Recherche des tokens via l'API CoinMarketCap
- Création des transactions en batch
- Gestion des erreurs (tokens non trouvés, doublons, etc.)
- Retour d'un rapport détaillé (succès, erreurs, avertissements)

#### 3. **Controller** (`src/csv-import/csv-import.controller.ts`)

```typescript
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
async uploadCsv(
  @CurrentUser('id') userId: string,
  @UploadedFile() file: Express.Multer.File,
  @Body() body: { exchange: string, portfolioId?: string }
): Promise<ImportResult>
```

**Endpoint :** `POST /csv-import/upload`

---

### **Frontend** (`exstrat_frontend/`)

#### 1. **Modal d'Import CSV** (`src/components/csv-import/csv-import-modal.tsx`)

**Fonctionnalités :**
- Sélection du fichier CSV
- Choix de l'exchange (Coinbase, Crypto.com, Binance)
- Sélection du portfolio cible
- Upload du fichier
- Affichage du rapport d'import (prévisualisation avant validation)
- Validation finale et création des transactions

#### 2. **Intégration dans la page Investissements**

Ajouter un bouton "Import CSV" à côté de "Add Transaction" dans `/investissements`

---

## 📊 Format de Données Interne

### `ParsedTransaction` (interne, avant création)

```typescript
interface ParsedTransaction {
  symbol: string;           // BTC, ETH, etc.
  name?: string;            // Bitcoin, Ethereum (optionnel, sera recherché)
  quantity: number;         // Quantité (toujours positive)
  amountInvested: number;  // Montant total en USD
  averagePrice: number;    // Prix moyen (amountInvested / quantity)
  type: TransactionType;   // BUY, SELL, etc.
  transactionDate: Date;    // Date de la transaction
  notes?: string;          // Notes originales du CSV
  exchangeId: string;      // 'coinbase', 'cryptocom', 'binance'
  originalRow?: number;     // Numéro de ligne dans le CSV (pour les erreurs)
}
```

### `ImportResult` (retourné par l'API)

```typescript
interface ImportResult {
  success: boolean;
  totalRows: number;
  imported: number;
  errors: ImportError[];
  warnings: ImportWarning[];
  transactions: TransactionResponse[]; // Transactions créées avec succès
}

interface ImportError {
  row: number;
  symbol: string;
  reason: string; // 'TOKEN_NOT_FOUND', 'INVALID_DATA', 'DUPLICATE', etc.
}

interface ImportWarning {
  row: number;
  symbol: string;
  message: string; // 'Multiple tokens found, using first match', etc.
}
```

---

## 🔄 Flux d'Import

```
1. Utilisateur sélectionne un fichier CSV
2. Frontend envoie le fichier + exchange + portfolioId au backend
3. Backend parse le CSV selon le format détecté
4. Pour chaque ligne :
   a. Recherche du token via /tokens/search
   b. Validation des données (quantité > 0, prix > 0, date valide)
   c. Vérification des doublons (même symbol, date, quantité)
   d. Création de la transaction via TransactionsService
5. Retour d'un rapport détaillé (succès, erreurs, avertissements)
6. Frontend affiche le rapport et permet de corriger/ignorer les erreurs
```

---

## 🎯 Calcul du Prix Moyen

### **Cas 1 : Prix directement disponible**
- **Coinbase** : `Price at Transaction` → `averagePrice`
- **Binance** : `AvgTrading Price` → `averagePrice`

### **Cas 2 : Calcul à partir du montant**
- **Crypto.com** : `averagePrice = Native Amount (in USD) / Amount`
- Si `amountInvested` et `quantity` sont disponibles : `averagePrice = amountInvested / quantity`

### **Cas 3 : Fallback**
- Si aucun prix n'est disponible, utiliser le prix actuel du marché via CoinMarketCap (moins précis mais acceptable)

---

## 🛡️ Gestion des Erreurs

### **1. Token non trouvé**
- **Action** : Ajouter à la liste des erreurs
- **Message** : "Token 'XXX' not found. Please verify the symbol."

### **2. Données invalides**
- Quantité négative ou nulle
- Prix négatif ou nul
- Date invalide
- **Action** : Ajouter à la liste des erreurs avec le numéro de ligne

### **3. Doublons**
- Détection : même `symbol`, `transactionDate` (±1 minute), `quantity` (±0.1%)
- **Action** : Avertissement, option de forcer l'import

### **4. Multiple tokens avec même symbole**
- Exemple : Plusieurs tokens "BTC" trouvés
- **Action** : Utiliser le premier résultat (le plus populaire par market cap)
- **Avertissement** : "Multiple tokens found for 'BTC', using Bitcoin (ID: 1)"

---

## 📝 Exemple d'Implémentation

### **Backend - Parser Coinbase**

```typescript
async parseCoinbase(file: Express.Multer.File): Promise<ParsedTransaction[]> {
  const csvContent = file.buffer.toString('utf-8');
  const lines = csvContent.split('\n');
  
  // Ignorer les lignes d'en-tête (lignes 1-4)
  const dataLines = lines.slice(4);
  
  const transactions: ParsedTransaction[] = [];
  
  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i].trim();
    if (!line) continue;
    
    const [id, timestamp, type, asset, quantity, priceCurrency, price, subtotal, total, fees, notes] = 
      line.split(',').map(cell => cell.replace(/^"|"$/g, ''));
    
    // Mapper le type de transaction
    const transactionType = this.mapCoinbaseType(type);
    
    // Extraire la quantité (valeur absolue)
    const qty = Math.abs(parseFloat(quantity));
    
    // Extraire le prix (enlever le $)
    const avgPrice = parseFloat(price.replace('$', '').replace(/,/g, ''));
    
    // Extraire le montant total (enlever le $)
    const amount = parseFloat(total.replace('$', '').replace(/,/g, ''));
    
    // Parser la date
    const date = new Date(timestamp);
    
    transactions.push({
      symbol: asset,
      quantity: qty,
      amountInvested: amount,
      averagePrice: avgPrice,
      type: transactionType,
      transactionDate: date,
      notes: notes || undefined,
      exchangeId: 'coinbase',
      originalRow: i + 5, // +5 pour compenser les lignes d'en-tête
    });
  }
  
  return transactions;
}

private mapCoinbaseType(type: string): TransactionType {
  const typeMap: Record<string, TransactionType> = {
    'Advanced Trade Buy': TransactionType.BUY,
    'Advanced Trade Sell': TransactionType.SELL,
    'Buy': TransactionType.BUY,
    'Send': TransactionType.TRANSFER_OUT,
    'Receive': TransactionType.TRANSFER_IN,
    'Reward Income': TransactionType.REWARD,
    'Deposit': TransactionType.TRANSFER_IN,
    'Pro Withdrawal': TransactionType.TRANSFER_OUT,
    'Pro Deposit': TransactionType.TRANSFER_IN,
  };
  
  return typeMap[type] || TransactionType.BUY;
}
```

---

## 🚀 Prochaines Étapes

1. ✅ **Phase 1 : Backend**
   - Créer le module `csv-import`
   - Implémenter les parsers pour Coinbase, Crypto.com, Binance
   - Créer l'endpoint d'upload
   - Tests unitaires

2. ✅ **Phase 2 : Frontend**
   - Créer le modal d'import CSV
   - Intégrer dans la page Investissements
   - Affichage du rapport d'import
   - Gestion des erreurs côté UI

3. ✅ **Phase 3 : Améliorations**
   - Prévisualisation avant import
   - Correction manuelle des erreurs
   - Import en arrière-plan (pour gros fichiers)
   - Historique des imports

---

## 💡 Recommandations

1. **Limite de taille** : Max 10MB par fichier CSV
2. **Batch processing** : Traiter les transactions par lots de 50 pour éviter les timeouts
3. **Validation stricte** : Rejeter les transactions avec des données invalides plutôt que de les corriger automatiquement
4. **Logging** : Logger toutes les erreurs pour debugging
5. **Performance** : Utiliser des transactions DB pour garantir la cohérence

---

## ✅ Conclusion

**L'intégration CSV est totalement faisable et apportera une valeur énorme aux utilisateurs !**

Les formats sont clairs, les données nécessaires sont disponibles, et l'infrastructure backend existe déjà. Il suffit d'ajouter la couche de parsing et d'import.

**Estimation :** 2-3 jours de développement pour une implémentation complète et robuste.

