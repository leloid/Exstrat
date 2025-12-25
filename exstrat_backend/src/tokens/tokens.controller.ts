import { Controller, Get, Query, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TokensService, TokenSearchResult } from './tokens.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Tokens')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('tokens')
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  @Get('search')
  @ApiOperation({ summary: 'Rechercher des tokens par symbole ou nom (retourne tous les résultats correspondants)' })
  @ApiQuery({ name: 'symbol', description: 'Symbole ou nom du token (ex: BTC, Bitcoin, ETH, Ethereum). Retourne TOUS les tokens correspondants.', required: true })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste de tous les tokens trouvés (triés par pertinence : correspondance exacte du symbole en premier, puis par market cap)',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          symbol: { type: 'string' },
          slug: { type: 'string' },
          cmc_rank: { type: 'number' },
          quote: {
            type: 'object',
            properties: {
              USD: {
                type: 'object',
                properties: {
                  price: { type: 'number' },
                  market_cap: { type: 'number' },
                  volume_24h: { type: 'number' },
                  percent_change_24h: { type: 'number' },
                  percent_change_7d: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Paramètres invalides' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 429, description: 'Limite de requêtes atteinte' })
  async searchBySymbol(@Query('symbol') symbol: string): Promise<TokenSearchResult[]> {
    console.log('🎯 [TokensController] searchBySymbol called with query:', symbol);
    
    if (!symbol || symbol.trim().length === 0) {
      console.log('❌ [TokensController] Query is empty or missing');
      throw new Error('Le symbole ou nom est requis');
    }
    
    console.log('✅ [TokensController] Calling tokensService.searchTokens (intelligent search by symbol OR name)...');
    // La méthode searchTokens recherche maintenant par symbole ET nom de manière intelligente
    return this.tokensService.searchTokens(symbol.trim());
  }

  @Get('search/name')
  @ApiOperation({ summary: 'Rechercher des tokens par nom' })
  @ApiQuery({ name: 'query', description: 'Nom ou symbole du token', required: true })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste des tokens trouvés',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          symbol: { type: 'string' },
          slug: { type: 'string' },
          cmc_rank: { type: 'number' },
          quote: {
            type: 'object',
            properties: {
              USD: {
                type: 'object',
                properties: {
                  price: { type: 'number' },
                  market_cap: { type: 'number' },
                  volume_24h: { type: 'number' },
                  percent_change_24h: { type: 'number' },
                  percent_change_7d: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Paramètres invalides' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 429, description: 'Limite de requêtes atteinte' })
  async searchByName(@Query('query') query: string): Promise<TokenSearchResult[]> {
    if (!query || query.trim().length === 0) {
      throw new Error('La requête est requise');
    }
    return this.tokensService.searchTokensByName(query.trim());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un token par son ID CoinMarketCap' })
  @ApiResponse({ 
    status: 200, 
    description: 'Informations du token',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        name: { type: 'string' },
        symbol: { type: 'string' },
        slug: { type: 'string' },
        cmc_rank: { type: 'number' },
        quote: {
          type: 'object',
          properties: {
            USD: {
              type: 'object',
              properties: {
                price: { type: 'number' },
                market_cap: { type: 'number' },
                volume_24h: { type: 'number' },
                percent_change_24h: { type: 'number' },
                percent_change_7d: { type: 'number' }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Token non trouvé' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async getTokenById(@Param('id', ParseIntPipe) id: number): Promise<TokenSearchResult> {
    return this.tokensService.getTokenById(id);
  }
}
