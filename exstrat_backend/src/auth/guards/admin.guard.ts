import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class AdminGuard extends JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // D'abord vérifier l'authentification JWT
    const isAuthenticated = await super.canActivate(context);
    if (!isAuthenticated) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Vérifier si l'utilisateur a les droits d'administration
    // Pour l'instant, on peut ajouter un champ 'role' dans le modèle User
    // ou utiliser l'email pour identifier les admins
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    
    if (!adminEmails.includes(user.email)) {
      throw new ForbiddenException('Accès refusé : droits d\'administration requis');
    }

    return true;
  }
}
