import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcryptjs';
import { SignUpDto, SignInDto, AuthResponseDto, LogoutResponseDto, ForgotPasswordResponseDto, ResetPasswordResponseDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName } = signUpDto;

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

    // Générer un token de vérification d'email
    const verificationToken = this.jwtService.sign(
      { 
        email,
        type: 'email-verification',
        iat: Math.floor(Date.now() / 1000)
      },
      {
        expiresIn: '7d', // Le token est valide 7 jours
        issuer: 'exstrat-api',
        audience: 'exstrat-client'
      }
    );

    try {
      // Créer l'utilisateur avec le token de vérification
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName: firstName || null,
          lastName: lastName || null,
          emailVerified: false,
          emailVerificationToken: verificationToken,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
        }
      });

      // Construire l'URL de vérification
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
      const verificationUrl = `${frontendUrl}/auth/verify-email?token=${verificationToken}`;

      // Envoyer l'email de vérification
      try {
        await this.emailService.sendVerificationEmail({
          to: user.email,
          verificationUrl,
        });

        this.logger.log(`Verification email sent successfully to ${user.email}`);
      } catch (error: any) {
        this.logger.error(`Error sending verification email to ${user.email}:`, error);
        this.logger.error(`Error details:`, {
          message: error?.message,
          name: error?.name,
          response: error?.response?.data,
          status: error?.response?.status,
        });
        // On continue même si l'email échoue, l'utilisateur peut demander un renvoi
      }

      // Générer le token JWT pour la connexion (mais l'utilisateur devra vérifier son email)
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
        message: 'Inscription réussie. Veuillez vérifier votre email pour activer votre compte.',
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
        firstName: true,
        lastName: true,
        emailVerified: true,
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

    // Vérifier si l'email est vérifié
    if (!user.emailVerified) {
      // Renvoyer automatiquement l'email de vérification
      try {
        // Générer un nouveau token de vérification
        const verificationToken = this.jwtService.sign(
          { 
            email: user.email,
            type: 'email-verification',
            iat: Math.floor(Date.now() / 1000)
          },
          {
            expiresIn: '7d',
            issuer: 'exstrat-api',
            audience: 'exstrat-client'
          }
        );

        // Mettre à jour le token dans la base de données
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerificationToken: verificationToken,
          }
        });

        // Construire l'URL de vérification
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
        const verificationUrl = `${frontendUrl}/auth/verify-email?token=${verificationToken}`;

        // Envoyer l'email de vérification
        await this.emailService.sendVerificationEmail({
          to: user.email,
          verificationUrl,
        });

        this.logger.log(`Verification email resent to ${user.email} during sign-in attempt`);
      } catch (error) {
        this.logger.error(`Error resending verification email to ${user.email} during sign-in:`, error);
        // On continue même si l'email échoue
      }

      throw new UnauthorizedException('Veuillez vérifier votre email avant de vous connecter. Un email de vérification a été envoyé lors de votre inscription.');
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
        firstName: user.firstName,
        lastName: user.lastName,
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
        firstName: true,
        lastName: true,
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

  async forgotPassword(email: string): Promise<ForgotPasswordResponseDto> {
    // Chercher l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
      }
    });

    // Pour des raisons de sécurité, on ne révèle pas si l'utilisateur existe ou non
    // On retourne toujours le même message
    if (!user) {
      this.logger.warn(`Password reset requested for non-existent email: ${email}`);
      return {
        message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé'
      };
    }

    // Générer un token JWT pour la réinitialisation (expiration 1h)
    const resetToken = this.jwtService.sign(
      { 
        sub: user.id, 
        email: user.email,
        type: 'password-reset',
        iat: Math.floor(Date.now() / 1000)
      },
      {
        expiresIn: '1h',
        issuer: 'exstrat-api',
        audience: 'exstrat-client'
      }
    );

    // Construire l'URL de réinitialisation
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

    // Envoyer l'email
    try {
      await this.emailService.sendPasswordResetEmail({
        to: user.email,
        resetUrl,
      });

      this.logger.log(`Password reset email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(`Error sending password reset email to ${user.email}:`, error);
      // On ne révèle pas l'erreur à l'utilisateur pour des raisons de sécurité
    }

    return {
      message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé'
    };
  }

  async resetPassword(token: string, newPassword: string): Promise<ResetPasswordResponseDto> {
    try {
      // Vérifier et décoder le token
      const payload = this.jwtService.verify(token, {
        issuer: 'exstrat-api',
        audience: 'exstrat-client'
      });

      // Vérifier que c'est bien un token de réinitialisation
      if (payload.type !== 'password-reset') {
        throw new BadRequestException('Token invalide');
      }

      // Vérifier que l'utilisateur existe
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
        }
      });

      if (!user) {
        throw new BadRequestException('Utilisateur non trouvé');
      }

      // Hasher le nouveau mot de passe
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Mettre à jour le mot de passe
      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });

      this.logger.log(`Password reset successful for user ${user.email}`);

      return {
        message: 'Mot de passe réinitialisé avec succès'
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Si c'est une erreur de vérification JWT (token expiré, invalide, etc.)
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new BadRequestException('Token invalide ou expiré');
      }

      this.logger.error('Error resetting password:', error);
      throw new BadRequestException('Erreur lors de la réinitialisation du mot de passe');
    }
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    try {
      // Vérifier et décoder le token
      const payload = this.jwtService.verify(token, {
        issuer: 'exstrat-api',
        audience: 'exstrat-client'
      });

      // Vérifier que c'est bien un token de vérification d'email
      if (payload.type !== 'email-verification') {
        throw new BadRequestException('Token invalide');
      }

      // Trouver l'utilisateur par email
      const user = await this.prisma.user.findUnique({
        where: { email: payload.email },
        select: {
          id: true,
          email: true,
          emailVerified: true,
          emailVerificationToken: true,
        }
      });

      if (!user) {
        throw new BadRequestException('Utilisateur non trouvé');
      }

      // Vérifier que le token correspond
      if (user.emailVerificationToken !== token) {
        throw new BadRequestException('Token invalide ou expiré');
      }

      // Vérifier si l'email est déjà vérifié
      if (user.emailVerified) {
        return {
          message: 'Votre email est déjà vérifié'
        };
      }

      // Marquer l'email comme vérifié et supprimer le token
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
        }
      });

      this.logger.log(`Email verified for user ${user.email}`);

      return {
        message: 'Email vérifié avec succès'
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Si c'est une erreur de vérification JWT (token expiré, invalide, etc.)
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new BadRequestException('Token invalide ou expiré');
      }

      this.logger.error('Error verifying email:', error);
      throw new BadRequestException('Erreur lors de la vérification de l\'email');
    }
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    // Trouver l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        emailVerified: true,
      }
    });

    // Pour des raisons de sécurité, on ne révèle pas si l'utilisateur existe ou non
    if (!user) {
      this.logger.warn(`Verification email resend requested for non-existent email: ${email}`);
      return {
        message: 'Si un compte existe avec cet email, un email de vérification a été envoyé'
      };
    }

    // Si l'email est déjà vérifié
    if (user.emailVerified) {
      return {
        message: 'Votre email est déjà vérifié'
      };
    }

    // Générer un nouveau token de vérification
    const verificationToken = this.jwtService.sign(
      { 
        email: user.email,
        type: 'email-verification',
        iat: Math.floor(Date.now() / 1000)
      },
      {
        expiresIn: '7d',
        issuer: 'exstrat-api',
        audience: 'exstrat-client'
      }
    );

    // Mettre à jour le token dans la base de données
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
      }
    });

    // Construire l'URL de vérification
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    const verificationUrl = `${frontendUrl}/auth/verify-email?token=${verificationToken}`;

    // Envoyer l'email de vérification
    try {
      await this.emailService.sendVerificationEmail({
        to: user.email,
        verificationUrl,
      });

      this.logger.log(`Verification email resent successfully to ${user.email}`);
    } catch (error: any) {
      this.logger.error(`Error resending verification email to ${user.email}:`, error);
      this.logger.error(`Error details:`, {
        message: error?.message,
        name: error?.name,
        response: error?.response?.data,
        status: error?.response?.status,
        stack: error?.stack,
      });
      // On ne révèle pas l'erreur à l'utilisateur pour des raisons de sécurité
    }

    return {
      message: 'Si un compte existe avec cet email, un email de vérification a été envoyé'
    };
  }
}
