import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const tokenFromHeader = request.headers['x-admin-token'];
    const token = Array.isArray(tokenFromHeader)
      ? tokenFromHeader[0]
      : tokenFromHeader;
    const expected = process.env.ADMIN_TOKEN ?? 'schoolshop-admin';

    if (!token || token !== expected) {
      throw new UnauthorizedException('Admin token required');
    }

    return true;
  }
}
