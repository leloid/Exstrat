import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface TokenSearchResult {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  cmc_rank: number;
  quote: {
    USD: {
      price: number;
      market_cap: number;
      volume_24h: number;
      percent_change_24h: number;
      percent_change_7d: number;
    };
  };
}

export interface TokenSearchResponse {
  data: TokenSearchResult[];
  status: {
    timestamp: string;
    error_code: number;
    error_message: string;
    elapsed: number;
    credit_count: number;
  };
}

@Injectable()
export class TokensService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://pro-api.coinmarketcap.com/v1';

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('COINMARKETCAP_API_KEY');
    if (!apiKey) {
      throw new Error('COINMARKETCAP_API_KEY is required in environment variables');
    }
    this.apiKey = apiKey;
  }

  async searchTokens(query: string): Promise<TokenSearchResult[]> {
    console.log('🔍 [TokensService] searchTokens called with query:', query);
    console.log('🔑 [TokensService] API Key:', this.apiKey ? 'Present' : 'Missing');
    
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchQuery = query.trim().toUpperCase();
    const searchQueryLower = query.trim().toLowerCase();
    
    try {
      // Étape 1: Rechercher tous les tokens correspondants via l'endpoint /map
      // Cet endpoint permet de rechercher par symbole ET nom, et retourne TOUS les résultats
      console.log('📡 [TokensService] Step 1: Searching tokens via /map endpoint...');
      const mapResponse = await axios.get(
        `${this.baseUrl}/cryptocurrency/map`,
        {
          headers: {
            'X-CMC_PRO_API_KEY': this.apiKey,
            'Accept': 'application/json',
          },
          params: {
            listing_status: 'active',
            limit: 5000, // Limite maximale pour obtenir le plus de résultats possibles
          },
        }
      );

      if (mapResponse.data.status.error_code !== 0) {
        throw new HttpException(
          `CoinMarketCap API Error: ${mapResponse.data.status.error_message}`,
          HttpStatus.BAD_REQUEST
        );
      }

      // Filtrer les tokens qui correspondent à la requête (symbole OU nom)
      const matchingTokens = mapResponse.data.data.filter((token: any) => {
        const symbolMatch = token.symbol.toUpperCase() === searchQuery;
        const nameMatch = token.name.toLowerCase().includes(searchQueryLower);
        return symbolMatch || nameMatch;
      });

      console.log(`🎯 [TokensService] Found ${matchingTokens.length} matching tokens`);

      if (matchingTokens.length === 0) {
        return [];
      }

      // Trier intelligemment : d'abord par correspondance exacte du symbole, puis par market cap
      matchingTokens.sort((a: any, b: any) => {
        const aExactSymbol = a.symbol.toUpperCase() === searchQuery;
        const bExactSymbol = b.symbol.toUpperCase() === searchQuery;
        
        if (aExactSymbol && !bExactSymbol) return -1;
        if (!aExactSymbol && bExactSymbol) return 1;
        
        // Si les deux ont le même symbole exact ou non, trier par rank (plus bas = plus populaire)
        return (a.rank || 999999) - (b.rank || 999999);
      });

      // Limiter à 50 résultats pour éviter de surcharger l'API
      const limitedTokens = matchingTokens.slice(0, 50);

      // Étape 2: Récupérer les prix et données de marché pour tous les tokens trouvés
      console.log(`📡 [TokensService] Step 2: Fetching prices for ${limitedTokens.length} tokens...`);
      const tokenIds = limitedTokens.map((token: any) => token.id).join(',');
      
      const quotesResponse = await axios.get<TokenSearchResponse>(
        `${this.baseUrl}/cryptocurrency/quotes/latest`,
        {
          headers: {
            'X-CMC_PRO_API_KEY': this.apiKey,
            'Accept': 'application/json',
          },
          params: {
            id: tokenIds,
            convert: 'USD',
          },
        }
      );

      if (quotesResponse.data.status.error_code !== 0) {
        // Si l'erreur est due à trop de tokens, essayer par batch
        if (quotesResponse.data.status.error_code === 400 && limitedTokens.length > 10) {
          console.log('⚠️ [TokensService] Too many tokens, fetching in batches...');
          return this.searchTokensInBatches(limitedTokens);
        }
        throw new HttpException(
          `CoinMarketCap API Error: ${quotesResponse.data.status.error_message}`,
          HttpStatus.BAD_REQUEST
        );
      }

      const tokensWithPrices = Object.values(quotesResponse.data.data);
      
      // Trier les résultats finaux : correspondance exacte du symbole en premier, puis par market cap
      tokensWithPrices.sort((a: TokenSearchResult, b: TokenSearchResult) => {
        const aExactSymbol = a.symbol.toUpperCase() === searchQuery;
        const bExactSymbol = b.symbol.toUpperCase() === searchQuery;
        
        if (aExactSymbol && !bExactSymbol) return -1;
        if (!aExactSymbol && bExactSymbol) return 1;
        
        // Trier par market cap décroissant (les plus gros en premier)
        const aMarketCap = a.quote?.USD?.market_cap || 0;
        const bMarketCap = b.quote?.USD?.market_cap || 0;
        return bMarketCap - aMarketCap;
      });

      console.log(`✅ [TokensService] Returning ${tokensWithPrices.length} tokens with prices`);
      return tokensWithPrices;
    } catch (error) {
      console.log('💥 [TokensService] Error occurred:', error.message);
      if (axios.isAxiosError(error)) {
        console.log('🌐 [TokensService] Axios error status:', error.response?.status);
        console.log('🌐 [TokensService] Axios error data:', error.response?.data);
        
        if (error.response?.status === 401) {
          console.log('🔐 [TokensService] Unauthorized - API Key issue');
          throw new HttpException(
            'API Key CoinMarketCap invalide',
            HttpStatus.UNAUTHORIZED
          );
        }
        if (error.response?.status === 429) {
          console.log('⏰ [TokensService] Rate limit exceeded');
          throw new HttpException(
            'Limite de requêtes CoinMarketCap atteinte',
            HttpStatus.TOO_MANY_REQUESTS
          );
        }
        throw new HttpException(
          `Erreur API CoinMarketCap: ${error.message}`,
          HttpStatus.BAD_GATEWAY
        );
      }
      throw new HttpException(
        'Erreur interne lors de la recherche de tokens',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Recherche les tokens par batch pour éviter les limites de l'API
   */
  private async searchTokensInBatches(tokens: any[]): Promise<TokenSearchResult[]> {
    const BATCH_SIZE = 10;
    const results: TokenSearchResult[] = [];

    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      const batch = tokens.slice(i, i + BATCH_SIZE);
      const tokenIds = batch.map((token: any) => token.id).join(',');

      try {
        const quotesResponse = await axios.get<TokenSearchResponse>(
          `${this.baseUrl}/cryptocurrency/quotes/latest`,
          {
            headers: {
              'X-CMC_PRO_API_KEY': this.apiKey,
              'Accept': 'application/json',
            },
            params: {
              id: tokenIds,
              convert: 'USD',
            },
          }
        );

        if (quotesResponse.data.status.error_code === 0) {
          const batchResults = Object.values(quotesResponse.data.data);
          results.push(...batchResults);
        }

        // Petite pause entre les batches pour respecter les rate limits
        if (i + BATCH_SIZE < tokens.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (error) {
        console.error(`Error fetching batch ${i / BATCH_SIZE + 1}:`, error);
        // Continuer avec les autres batches même si un échoue
      }
    }

    return results;
  }

  async getTokenById(id: number): Promise<TokenSearchResult> {
    try {
      const response = await axios.get<TokenSearchResponse>(
        `${this.baseUrl}/cryptocurrency/quotes/latest`,
        {
          headers: {
            'X-CMC_PRO_API_KEY': this.apiKey,
            'Accept': 'application/json',
          },
          params: {
            id: id.toString(),
            convert: 'USD',
          },
        }
      );

      if (response.data.status.error_code !== 0) {
        throw new HttpException(
          `CoinMarketCap API Error: ${response.data.status.error_message}`,
          HttpStatus.BAD_REQUEST
        );
      }

      const token = Object.values(response.data.data)[0];
      if (!token) {
        throw new HttpException(
          'Token non trouvé',
          HttpStatus.NOT_FOUND
        );
      }

      return token;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new HttpException(
            'API Key CoinMarketCap invalide',
            HttpStatus.UNAUTHORIZED
          );
        }
        if (error.response?.status === 429) {
          throw new HttpException(
            'Limite de requêtes CoinMarketCap atteinte',
            HttpStatus.TOO_MANY_REQUESTS
          );
        }
        throw new HttpException(
          `Erreur API CoinMarketCap: ${error.message}`,
          HttpStatus.BAD_GATEWAY
        );
      }
      throw new HttpException(
        'Erreur interne lors de la récupération du token',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async searchTokensByName(query: string): Promise<TokenSearchResult[]> {
    try {
      // Pour la recherche par nom, on utilise l'endpoint de mapping
      const response = await axios.get(
        `${this.baseUrl}/cryptocurrency/map`,
        {
          headers: {
            'X-CMC_PRO_API_KEY': this.apiKey,
            'Accept': 'application/json',
          },
          params: {
            listing_status: 'active',
            limit: 100,
          },
        }
      );

      if (response.data.status.error_code !== 0) {
        throw new HttpException(
          `CoinMarketCap API Error: ${response.data.status.error_message}`,
          HttpStatus.BAD_REQUEST
        );
      }

      // Filtrer les résultats par nom ou symbole
      const filteredTokens = response.data.data.filter((token: any) =>
        token.name.toLowerCase().includes(query.toLowerCase()) ||
        token.symbol.toLowerCase().includes(query.toLowerCase())
      );

      // Limiter à 10 résultats
      const limitedTokens = filteredTokens.slice(0, 10);

      // Récupérer les prix pour ces tokens
      if (limitedTokens.length > 0) {
        const ids = limitedTokens.map((token: any) => token.id).join(',');
        const priceResponse = await axios.get<TokenSearchResponse>(
          `${this.baseUrl}/cryptocurrency/quotes/latest`,
          {
            headers: {
              'X-CMC_PRO_API_KEY': this.apiKey,
              'Accept': 'application/json',
            },
            params: {
              id: ids,
              convert: 'USD',
            },
          }
        );

        if (priceResponse.data.status.error_code === 0) {
          return Object.values(priceResponse.data.data);
        }
      }

      return [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new HttpException(
            'API Key CoinMarketCap invalide',
            HttpStatus.UNAUTHORIZED
          );
        }
        if (error.response?.status === 429) {
          throw new HttpException(
            'Limite de requêtes CoinMarketCap atteinte',
            HttpStatus.TOO_MANY_REQUESTS
          );
        }
        throw new HttpException(
          `Erreur API CoinMarketCap: ${error.message}`,
          HttpStatus.BAD_GATEWAY
        );
      }
      throw new HttpException(
        'Erreur interne lors de la recherche de tokens',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
