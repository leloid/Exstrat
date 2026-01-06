import { Injectable, Inject, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { TokensService } from '../tokens/tokens.service';

export interface CachedPrice {
  price: number;
  timestamp: number;
}

@Injectable()
export class PriceService {
  private readonly logger = new Logger(PriceService.name);
  private readonly CACHE_TTL = 60; // 60 secondes
  private readonly CACHE_MIN_AGE = 30; // Utiliser le cache si < 30s

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly tokensService: TokensService,
  ) {}

  /**
   * Récupère le prix d'un token avec cache Redis
   * @param cmcId CoinMarketCap ID du token
   * @returns Prix actuel du token
   */
  async getPrice(cmcId: number): Promise<number> {
    const cacheKey = `price:${cmcId}`;

    try {
      // 1. Vérifier le cache
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        const cachedData: CachedPrice = JSON.parse(cached);
        const age = Date.now() - cachedData.timestamp;
        
        // Utiliser le cache si < 30 secondes
        if (age < this.CACHE_MIN_AGE * 1000) {
          this.logger.debug(`Cache hit for token ${cmcId} (age: ${age}ms)`);
          return cachedData.price;
        }
      }

      // 2. Fetch depuis l'API CoinMarketCap
      this.logger.debug(`Fetching price for token ${cmcId} from API`);
      const price = await this.fetchPriceFromAPI(cmcId);

      // 3. Mettre en cache pour 60 secondes
      const cacheData: CachedPrice = {
        price,
        timestamp: Date.now(),
      };
      await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(cacheData));

      return price;
    } catch (error) {
      this.logger.error(`Error getting price for token ${cmcId}:`, error);
      throw error;
    }
  }

  /**
   * Récupère les prix de plusieurs tokens en batch
   * @param cmcIds Liste des CoinMarketCap IDs
   * @returns Map des prix par cmcId
   */
  async getBatchPrices(cmcIds: number[]): Promise<Map<number, number>> {
    const prices = new Map<number, number>();
    const uncachedIds: number[] = [];

    // 1. Vérifier le cache pour tous les tokens
    for (const cmcId of cmcIds) {
      const cacheKey = `price:${cmcId}`;
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        const cachedData: CachedPrice = JSON.parse(cached);
        const age = Date.now() - cachedData.timestamp;
        
        if (age < this.CACHE_MIN_AGE * 1000) {
          prices.set(cmcId, cachedData.price);
        } else {
          uncachedIds.push(cmcId);
        }
      } else {
        uncachedIds.push(cmcId);
      }
    }

    // 2. Fetch les tokens non cachés depuis l'API (batch de 100 max)
    if (uncachedIds.length > 0) {
      const batches = this.chunkArray(uncachedIds, 100);
      
      for (const batch of batches) {
        try {
          const batchPrices = await this.fetchBatchPricesFromAPI(batch);
          
          // Mettre en cache chaque prix
          for (const [cmcId, price] of batchPrices.entries()) {
            prices.set(cmcId, price);
            const cacheKey = `price:${cmcId}`;
            const cacheData: CachedPrice = {
              price,
              timestamp: Date.now(),
            };
            await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(cacheData));
          }
        } catch (error) {
          this.logger.error(`Error fetching batch prices:`, error);
          // Continuer avec les autres batches même en cas d'erreur
        }
      }
    }

    return prices;
  }

  /**
   * Fetch le prix d'un token depuis l'API CoinMarketCap
   */
  private async fetchPriceFromAPI(cmcId: number): Promise<number> {
    // Utiliser le service TokensService existant
    // Note: Il faudra peut-être ajouter une méthode getPriceById dans TokensService
    const tokens = await this.tokensService.searchTokensByIds([cmcId]);
    
    if (tokens.length === 0 || !tokens[0].quote?.USD?.price) {
      throw new Error(`Price not found for token ${cmcId}`);
    }

    return tokens[0].quote.USD.price;
  }

  /**
   * Fetch les prix de plusieurs tokens en batch depuis l'API
   */
  private async fetchBatchPricesFromAPI(cmcIds: number[]): Promise<Map<number, number>> {
    const prices = new Map<number, number>();
    
    // Utiliser le service TokensService existant
    const tokens = await this.tokensService.searchTokensByIds(cmcIds);
    
    for (const token of tokens) {
      if (token.quote?.USD?.price) {
        prices.set(token.id, token.quote.USD.price);
      }
    }

    return prices;
  }

  /**
   * Divise un tableau en chunks de taille donnée
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}


