import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFormHeader(request);

    if (!token) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }

    const decodedCredentials = Buffer.from(token, 'base64').toString('ascii');
    const [username, password] = decodedCredentials.split(':');

    // Check hardcoded credentials (replace with actual validation logic if needed)
    if (username === 'root' && password === 'root') {
      return true; // Allow access if credentials are valid
    } else {
      throw new UnauthorizedException('Invalid username or password');
    }

    try {
      const paylod = this.jwtService.verify(token);
      request.userID = paylod.userID;
    } catch (e) {
      Logger.error(e.message);
      throw new UnauthorizedException('Invalid token');
    }
    return true;
  }
  private extractTokenFormHeader(request: Request): string | undefined {
    return request.headers.authorization?.split(' ')[1];
  }
}
