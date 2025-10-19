import { Controller, Post, Body, UseGuards, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignUpDto, SignInDto, AuthResponseDto, LogoutResponseDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshGuard } from './guards/refresh.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Inscription d\'un nouvel utilisateur',
    description: 'Crée un nouveau compte utilisateur avec email et mot de passe sécurisé'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Utilisateur créé avec succès',
    type: AuthResponseDto
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Un utilisateur avec cet email existe déjà',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'Un utilisateur avec cet email existe déjà' },
        error: { type: 'string', example: 'Conflict' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données de validation invalides',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['L\'email doit être valide', 'Le mot de passe doit contenir au moins 8 caractères']
        },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  async signUp(@Body() signUpDto: SignUpDto): Promise<AuthResponseDto> {
    return this.authService.signUp(signUpDto);
  }

  @Public()
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Connexion utilisateur',
    description: 'Authentifie un utilisateur avec email et mot de passe'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Connexion réussie',
    type: AuthResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Email ou mot de passe incorrect',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Email ou mot de passe incorrect' },
        error: { type: 'string', example: 'Unauthorized' }
      }
    }
  })
  async signIn(@Body() signInDto: SignInDto): Promise<AuthResponseDto> {
    return this.authService.signIn(signInDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Déconnexion utilisateur',
    description: 'Déconnecte l\'utilisateur actuellement authentifié'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Déconnexion réussie',
    type: LogoutResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non authentifié',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' }
      }
    }
  })
  async logout(): Promise<LogoutResponseDto> {
    return this.authService.logout();
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Profil utilisateur',
    description: 'Récupère les informations du profil de l\'utilisateur authentifié'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Profil utilisateur récupéré avec succès',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'clx1234567890' },
        email: { type: 'string', example: 'user@example.com' },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non authentifié'
  })
  async getProfile(@CurrentUser() user: any) {
    return user;
  }

  @UseGuards(RefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Rafraîchir le token',
    description: 'Génère un nouveau token d\'accès pour l\'utilisateur authentifié'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token rafraîchi avec succès',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token de rafraîchissement invalide ou expiré'
  })
  async refreshToken(@CurrentUser() user: any) {
    return this.authService.refreshToken(user.sub);
  }
}
