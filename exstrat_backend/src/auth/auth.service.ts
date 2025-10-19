import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { SignUpDto, SignInDto, AuthResponseDto, LogoutResponseDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<AuthResponseDto> {
    const { email, password } = signUpDto;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    // Hasher le mot de passe avec un salt de 12 rounds
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    try {
      // Créer l'utilisateur
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
        },
        select: {
          id: true,
          email: true,
          createdAt: true,
        }
      });

      // Générer le token JWT
      const payload = { 
        sub: user.id, 
        email: user.email,
        iat: Math.floor(Date.now() / 1000)
      };
      
      const accessToken = this.jwtService.sign(payload, {
        expiresIn: '24h',
        issuer: 'exstrat-api',
        audience: 'exstrat-client'
      });

      return {
        message: 'Inscription réussie',
        user,
        accessToken
      };
    } catch (error) {
      throw new BadRequestException('Erreur lors de la création de l\'utilisateur');
    }
  }

  async signIn(signInDto: SignInDto): Promise<AuthResponseDto> {
    const { email, password } = signInDto;

    // Trouver l'utilisateur avec le mot de passe
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        createdAt: true,
      }
    });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Générer le token JWT
    const payload = { 
      sub: user.id, 
      email: user.email,
      iat: Math.floor(Date.now() / 1000)
    };
    
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '24h',
      issuer: 'exstrat-api',
      audience: 'exstrat-client'
    });

    return {
      message: 'Connexion réussie',
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
      accessToken
    };
  }

  async logout(): Promise<LogoutResponseDto> {
    // En production, vous pourriez ajouter le token à une blacklist
    // ou utiliser des refresh tokens pour une meilleure sécurité
    return {
      message: 'Déconnexion réussie'
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
      }
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    return user;
  }

  async refreshToken(userId: string): Promise<{ accessToken: string }> {
    const user = await this.validateUser(userId);
    
    const payload = { 
      sub: user.id, 
      email: user.email,
      iat: Math.floor(Date.now() / 1000)
    };
    
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '24h',
      issuer: 'exstrat-api',
      audience: 'exstrat-client'
    });

    return { accessToken };
  }
}
