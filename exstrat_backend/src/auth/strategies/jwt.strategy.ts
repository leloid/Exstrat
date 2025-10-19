import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret',
      issuer: 'exstrat-api',
      audience: 'exstrat-client',
    });
  }

  async validate(payload: any) {
    console.log('🎫 [JwtStrategy] Validating payload:', payload);
    try {
      const user = await this.authService.validateUser(payload.sub);
      console.log('✅ [JwtStrategy] User validated:', user ? `ID: ${user.id}, Email: ${user.email}` : 'None');
      return user;
    } catch (error) {
      console.log('❌ [JwtStrategy] Validation failed:', error.message);
      throw new UnauthorizedException('Token invalide ou expiré');
    }
  }
}
