import { Injectable, BadRequestException } from '@nestjs/common';
import { parse } from 'csv-parse';
import { ParseCsvDto, ParsedTransaction, ParseCsvResponseDto, ExchangeType } from './dto/csv-import.dto';
import { TransactionType } from './dto/transaction.dto';
import { TokensService } from '../tokens/tokens.service';

@Injectable()
export class CsvParserService {
  constructor(private tokensService: TokensService) {}

  async parseCsv(parseDto: ParseCsvDto): Promise<ParseCsvResponseDto> {
    const { exchange, csvContent, portfolioId } = parseDto;

    // Préparer le contenu CSV selon l'exchange
    let processedContent = csvContent;
    
    if (exchange === ExchangeType.COINBASE) {
      // Pour Coinbase, trouver la ligne d'en-tête et supprimer tout ce qui précède
      const lines = csvContent.split('\n');
      let headerIndex = -1;
      
      // Chercher la ligne qui contient les colonnes attendues
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        // Vérifier si cette ligne contient les colonnes clés de Coinbase
        if (line.includes('id') && 
            line.includes('timestamp') && 
            line.includes('transaction type') && 
            line.includes('asset') &&
            line.includes('quantity transacted')) {
          headerIndex = i;
          break;
        }
      }
      
      if (headerIndex >= 0) {
        // Prendre la ligne d'en-tête et toutes les lignes suivantes
        processedContent = lines.slice(headerIndex).join('\n');
      } else {
        throw new BadRequestException('Impossible de trouver la ligne d\'en-tête dans le fichier CSV Coinbase. Assurez-vous que le fichier contient les colonnes: ID, Timestamp, Transaction Type, Asset, etc.');
      }
    }

    // Parser le CSV
    let records: any[];
    try {
      records = await new Promise((resolve, reject) => {
        parse(processedContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          relax_column_count: true,
        }, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
    } catch (error) {
      throw new BadRequestException(`Erreur lors du parsing du CSV: ${error.message}`);
    }

    if (records.length === 0) {
      throw new BadRequestException('Le fichier CSV est vide ou ne contient pas de données valides');
    }

    // Étape 1: Extraire tous les symboles uniques pour optimiser les appels API
    const uniqueSymbols = new Set<string>();
    for (const row of records) {
      let symbol: string | undefined;
      if (exchange === ExchangeType.COINBASE) {
        symbol = row['Asset']?.trim();
      } else if (exchange === ExchangeType.CRYPTO_COM) {
        symbol = row['Currency']?.trim();
      }
      if (symbol) {
        uniqueSymbols.add(symbol.toUpperCase());
      }
    }

    // Étape 2: Rechercher tous les tokens uniques en une seule fois (avec cache)
    const tokenCache = new Map<string, { name: string; cmcId: number } | null>();
    const symbolsArray = Array.from(uniqueSymbols);
    
    // Rechercher les tokens par batch pour éviter les limites d'API
    for (const symbol of symbolsArray) {
      try {
        const tokens = await this.tokensService.searchTokens(symbol);
        if (tokens.length > 0) {
          tokenCache.set(symbol, {
            name: tokens[0].name,
            cmcId: tokens[0].id,
          });
        } else {
          tokenCache.set(symbol, null);
        }
        // Petit délai pour éviter de dépasser les limites de rate
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Erreur lors de la recherche du token ${symbol}:`, error);
        tokenCache.set(symbol, null);
      }
    }

    const validTransactions: ParsedTransaction[] = [];
    const invalidTransactions: Array<{ row: number; data: any; errors: string[] }> = [];

    // Étape 3: Parser toutes les lignes en utilisant le cache
    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNumber = i + 2; // +2 car on compte l'en-tête et on commence à 1

      try {
        let parsedTransaction: ParsedTransaction | null = null;

        if (exchange === ExchangeType.COINBASE) {
          parsedTransaction = await this.parseCoinbaseRow(row, portfolioId, tokenCache);
        } else if (exchange === ExchangeType.CRYPTO_COM) {
          parsedTransaction = await this.parseCryptoComRow(row, portfolioId, tokenCache);
        }

        if (parsedTransaction && parsedTransaction.errors && parsedTransaction.errors.length > 0) {
          invalidTransactions.push({
            row: rowNumber,
            data: row,
            errors: parsedTransaction.errors,
          });
        } else if (parsedTransaction) {
          validTransactions.push(parsedTransaction);
        } else {
          invalidTransactions.push({
            row: rowNumber,
            data: row,
            errors: ['Impossible de parser cette ligne'],
          });
        }
      } catch (error) {
        invalidTransactions.push({
          row: rowNumber,
          data: row,
          errors: [error.message || 'Erreur inconnue lors du parsing'],
        });
      }
    }

    return {
      validTransactions,
      invalidTransactions,
      totalRows: records.length,
      validCount: validTransactions.length,
      invalidCount: invalidTransactions.length,
    };
  }

  private async parseCoinbaseRow(row: any, portfolioId: string | undefined, tokenCache: Map<string, { name: string; cmcId: number } | null>): Promise<ParsedTransaction | null> {
    const errors: string[] = [];

    // Vérifier les colonnes requises
    const requiredColumns = ['Asset', 'Transaction Type', 'Quantity Transacted', 'Total (inclusive of fees and/or spread)', 'Price at Transaction', 'Timestamp'];
    for (const col of requiredColumns) {
      if (!row[col] && row[col] !== '0') {
        errors.push(`Colonne manquante: ${col}`);
      }
    }

    if (errors.length > 0) {
      return { errors } as ParsedTransaction;
    }

    const symbol = row['Asset']?.trim();
    const transactionType = row['Transaction Type']?.trim();
    const quantityStr = row['Quantity Transacted']?.trim();
    const totalStr = row['Total (inclusive of fees and/or spread)']?.trim();
    const priceStr = row['Price at Transaction']?.trim();
    const timestamp = row['Timestamp']?.trim();
    const notes = row['Notes']?.trim();

    // Valider et convertir les valeurs numériques
    const quantity = this.parseNumber(quantityStr, 'Quantity Transacted', errors);
    const amountInvested = this.parseNumber(totalStr, 'Total', errors);
    const averagePrice = this.parseNumber(priceStr, 'Price at Transaction', errors);

    // Parser la date
    let transactionDate: string | undefined;
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        errors.push(`Date invalide: ${timestamp}`);
      } else {
        transactionDate = date.toISOString();
      }
    } catch (error) {
      errors.push(`Erreur lors du parsing de la date: ${timestamp}`);
    }

    // Mapper le type de transaction
    const type = this.mapCoinbaseTransactionType(transactionType, errors);

    // Si erreurs critiques, retourner avec erreurs
    if (errors.length > 0 || !transactionDate) {
      return { errors } as ParsedTransaction;
    }

    // Rechercher le token dans le cache
    const symbolUpper = symbol.toUpperCase();
    const cachedToken = tokenCache.get(symbolUpper);
    
    let name: string | undefined;
    let cmcId: number | undefined;

    if (cachedToken) {
      name = cachedToken.name;
      cmcId = cachedToken.cmcId;
    } else if (cachedToken === null) {
      // Le token a été recherché mais n'a pas été trouvé
      errors.push(`Token non trouvé: ${symbol}`);
    } else {
      // Le token n'a pas encore été recherché (ne devrait pas arriver)
      errors.push(`Token non trouvé dans le cache: ${symbol}`);
    }

    if (errors.length > 0) {
      return { errors } as ParsedTransaction;
    }

    return {
      symbol,
      name,
      cmcId,
      quantity: Math.abs(quantity), // Toujours positif
      amountInvested: Math.abs(amountInvested), // Toujours positif
      averagePrice: averagePrice || (amountInvested / quantity), // Calculer si manquant
      type,
      transactionDate: transactionDate as string, // On sait qu'il est défini car on a vérifié avant
      notes: notes || undefined,
      exchangeId: 'coinbase',
      rawData: row,
    };
  }

  private async parseCryptoComRow(row: any, portfolioId: string | undefined, tokenCache: Map<string, { name: string; cmcId: number } | null>): Promise<ParsedTransaction | null> {
    const errors: string[] = [];

    // Vérifier les colonnes requises
    const requiredColumns = ['Currency', 'Transaction Description', 'Amount', 'Native Amount (in USD)', 'Timestamp (UTC)'];
    for (const col of requiredColumns) {
      if (!row[col] && row[col] !== '0') {
        errors.push(`Colonne manquante: ${col}`);
      }
    }

    if (errors.length > 0) {
      return { errors } as ParsedTransaction;
    }

    const currency = row['Currency']?.trim();
    const transactionDescription = row['Transaction Description']?.trim();
    const amountStr = row['Amount']?.trim();
    const toAmountStr = row['To Amount']?.trim();
    const nativeAmountStr = row['Native Amount (in USD)']?.trim();
    const timestamp = row['Timestamp (UTC)']?.trim();
    const transactionKind = row['Transaction Kind']?.trim();

    // Déterminer la quantité (utiliser To Amount si disponible pour les achats)
    let quantityStr = amountStr;
    if (toAmountStr && (transactionDescription?.toLowerCase().includes('bought') || transactionKind === 'crypto_purchase')) {
      quantityStr = toAmountStr;
    }

    // Valider et convertir les valeurs numériques
    const quantity = this.parseNumber(quantityStr, 'Amount/To Amount', errors);
    const amountInvested = this.parseNumber(nativeAmountStr, 'Native Amount (in USD)', errors);

    // Calculer le prix moyen
    const averagePrice = quantity !== 0 ? amountInvested / Math.abs(quantity) : 0;

    // Parser la date
    let transactionDate: string | undefined;
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        errors.push(`Date invalide: ${timestamp}`);
      } else {
        transactionDate = date.toISOString();
      }
    } catch (error) {
      errors.push(`Erreur lors du parsing de la date: ${timestamp}`);
    }

    // Mapper le type de transaction
    const type = this.mapCryptoComTransactionType(transactionDescription, transactionKind, errors);

    // Si erreurs critiques, retourner avec erreurs
    if (errors.length > 0 || !transactionDate) {
      return { errors } as ParsedTransaction;
    }

    // Rechercher le token dans le cache
    const currencyUpper = currency.toUpperCase();
    const cachedToken = tokenCache.get(currencyUpper);
    
    let name: string | undefined;
    let cmcId: number | undefined;

    if (cachedToken) {
      name = cachedToken.name;
      cmcId = cachedToken.cmcId;
    } else if (cachedToken === null) {
      // Le token a été recherché mais n'a pas été trouvé
      errors.push(`Token non trouvé: ${currency}`);
    } else {
      // Le token n'a pas encore été recherché (ne devrait pas arriver)
      errors.push(`Token non trouvé dans le cache: ${currency}`);
    }

    if (errors.length > 0) {
      return { errors } as ParsedTransaction;
    }

    return {
      symbol: currency,
      name,
      cmcId,
      quantity: Math.abs(quantity), // Toujours positif
      amountInvested: Math.abs(amountInvested), // Toujours positif
      averagePrice,
      type,
      transactionDate: transactionDate as string,
      notes: transactionDescription || undefined,
      exchangeId: 'crypto.com',
      rawData: row,
    };
  }

  private parseNumber(value: string, fieldName: string, errors: string[]): number {
    if (!value || value.trim() === '') {
      errors.push(`${fieldName} est vide`);
      return 0;
    }

    // Nettoyer la valeur (enlever les $, espaces, etc.)
    const cleaned = value.replace(/[$,\s]/g, '');

    const num = parseFloat(cleaned);
    if (isNaN(num)) {
      errors.push(`${fieldName} n'est pas un nombre valide: ${value}`);
      return 0;
    }

    return num;
  }

  private mapCoinbaseTransactionType(transactionType: string, errors: string[]): TransactionType {
    const type = transactionType?.toLowerCase().trim() || '';

    // Vérifications spécifiques d'abord (plus précises)
    if (type === 'pro withdrawal' || type.startsWith('pro withdrawal')) {
      return TransactionType.TRANSFER_OUT;
    }
    if (type === 'pro deposit' || type.startsWith('pro deposit')) {
      return TransactionType.TRANSFER_IN;
    }
    if (type.includes('advanced trade buy') || type === 'buy') {
      return TransactionType.BUY;
    }
    if (type.includes('advanced trade sell') || type === 'sell') {
      return TransactionType.SELL;
    }
    if (type.includes('send') || type.includes('withdrawal')) {
      return TransactionType.TRANSFER_OUT;
    }
    if (type.includes('receive') || type.includes('deposit')) {
      return TransactionType.TRANSFER_IN;
    }
    if (type.includes('reward') || type.includes('reward income')) {
      return TransactionType.REWARD;
    }
    if (type.includes('staking')) {
      return TransactionType.STAKING;
    }
    // Vérifications génériques en dernier
    if (type.includes('buy')) {
      return TransactionType.BUY;
    }
    if (type.includes('sell')) {
      return TransactionType.SELL;
    }
    
    // Par défaut, on considère comme BUY si la quantité est positive
    errors.push(`Type de transaction non reconnu: ${transactionType}. Utilisation de BUY par défaut.`);
    return TransactionType.BUY;
  }

  private mapCryptoComTransactionType(description: string, kind: string, errors: string[]): TransactionType {
    const desc = description?.toLowerCase() || '';
    const k = kind?.toLowerCase() || '';

    if (desc.includes('bought') || k === 'crypto_purchase' || k === 'recurring_buy_order') {
      return TransactionType.BUY;
    } else if (desc.includes('sold') || desc.includes('sell')) {
      return TransactionType.SELL;
    } else if (desc.includes('withdraw') || k === 'crypto_withdrawal') {
      return TransactionType.TRANSFER_OUT;
    } else if (desc.includes('deposit') || desc.includes('receive')) {
      return TransactionType.TRANSFER_IN;
    } else if (k.includes('reward') || k.includes('staking')) {
      return TransactionType.REWARD;
    } else {
      // Par défaut, on considère comme BUY
      errors.push(`Type de transaction non reconnu: ${description || kind}. Utilisation de BUY par défaut.`);
      return TransactionType.BUY;
    }
  }
}

