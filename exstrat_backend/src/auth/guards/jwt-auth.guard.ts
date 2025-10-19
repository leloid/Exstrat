import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    console.log('🔐 [JwtAuthGuard] Checking authentication for:', request.url);
    console.log('🔐 [JwtAuthGuard] Authorization header:', request.headers.authorization ? 'Present' : 'Missing');
    console.log('🔐 [JwtAuthGuard] Full authorization header:', request.headers.authorization);
    console.log('🔐 [JwtAuthGuard] All headers:', Object.keys(request.headers));
    
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      console.log('🌐 [JwtAuthGuard] Route is public, allowing access');
      return true;
    }

    console.log('🔒 [JwtAuthGuard] Route requires authentication, checking JWT...');
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    console.log('🎫 [JwtAuthGuard] JWT validation result:');
    console.log('  - Error:', err ? err.message : 'None');
    console.log('  - User:', user ? `ID: ${user.id}, Email: ${user.email}` : 'None');
    console.log('  - Info:', info ? info.message : 'None');
    
    if (err || !user) {
      console.log('❌ [JwtAuthGuard] Authentication failed');
      throw err || new Error('Unauthorized');
    }
    
    console.log('✅ [JwtAuthGuard] Authentication successful');
    return user;
  }
}
