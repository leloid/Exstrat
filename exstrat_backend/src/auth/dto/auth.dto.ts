import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
  @ApiProperty({
    description: 'Adresse email de l\'utilisateur',
    example: 'user@example.com',
    format: 'email'
  })
  @IsEmail({}, { message: 'L\'email doit être valide' })
  email: string;

  @ApiProperty({
    description: 'Mot de passe sécurisé',
    example: 'SecurePassword123!',
    minLength: 8,
    maxLength: 128
  })
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @MaxLength(128, { message: 'Le mot de passe ne peut pas dépasser 128 caractères' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial'
    }
  )
  password: string;
}

export class SignInDto {
  @ApiProperty({
    description: 'Adresse email de l\'utilisateur',
    example: 'user@example.com'
  })
  @IsEmail({}, { message: 'L\'email doit être valide' })
  email: string;

  @ApiProperty({
    description: 'Mot de passe de l\'utilisateur',
    example: 'SecurePassword123!'
  })
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  password: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'Message de succès',
    example: 'Connexion réussie'
  })
  message: string;

  @ApiProperty({
    description: 'Informations de l\'utilisateur',
    example: {
      id: 'clx1234567890',
      email: 'user@example.com',
      createdAt: '2024-01-01T00:00:00.000Z'
    }
  })
  user: {
    id: string;
    email: string;
    createdAt: Date;
  };

  @ApiProperty({
    description: 'Token d\'accès JWT',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  accessToken: string;
}

export class LogoutResponseDto {
  @ApiProperty({
    description: 'Message de confirmation',
    example: 'Déconnexion réussie'
  })
  message: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Adresse email de l\'utilisateur',
    example: 'user@example.com',
    format: 'email'
  })
  @IsEmail({}, { message: 'L\'email doit être valide' })
  email: string;
}

export class ForgotPasswordResponseDto {
  @ApiProperty({
    description: 'Message de confirmation',
    example: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé'
  })
  message: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token de réinitialisation reçu par email',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @IsString({ message: 'Le token doit être une chaîne de caractères' })
  token: string;

  @ApiProperty({
    description: 'Nouveau mot de passe sécurisé',
    example: 'NewSecurePassword123!',
    minLength: 8,
    maxLength: 128
  })
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @MaxLength(128, { message: 'Le mot de passe ne peut pas dépasser 128 caractères' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial'
    }
  )
  password: string;
}

export class ResetPasswordResponseDto {
  @ApiProperty({
    description: 'Message de confirmation',
    example: 'Mot de passe réinitialisé avec succès'
  })
  message: string;
}
