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
    this.apiKey = this.configService.get<string>('COINMARKETCAP_API_KEY') || '7740821c-5d41-4fef-b1ed-05d320d2b025';
  }

  async searchTokens(query: string): Promise<TokenSearchResult[]> {
    console.log('🔍 [TokensService] searchTokens called with query:', query);
    console.log('🔑 [TokensService] API Key:', this.apiKey ? 'Present' : 'Missing');
    
    try {
      console.log('📡 [TokensService] Making request to CoinMarketCap API...');
      const response = await axios.get<TokenSearchResponse>(
        `${this.baseUrl}/cryptocurrency/quotes/latest`,
        {
          headers: {
            'X-CMC_PRO_API_KEY': this.apiKey,
            'Accept': 'application/json',
          },
          params: {
            symbol: query.toUpperCase(),
            convert: 'USD',
          },
        }
      );
      
      console.log('✅ [TokensService] API Response status:', response.status);
      console.log('📊 [TokensService] API Response data keys:', Object.keys(response.data));

      if (response.data.status.error_code !== 0) {
        console.log('❌ [TokensService] API Error:', response.data.status.error_message);
        throw new HttpException(
          `CoinMarketCap API Error: ${response.data.status.error_message}`,
          HttpStatus.BAD_REQUEST
        );
      }

      const tokens = Object.values(response.data.data);
      console.log('🎯 [TokensService] Found tokens:', tokens.length);
      console.log('📋 [TokensService] Token symbols:', tokens.map(t => t.symbol));
      
      return tokens;
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
