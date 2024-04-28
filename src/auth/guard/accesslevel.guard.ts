import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { AdminAccessLevels } from 'src/Enums/all-enums';
import { ADMIN_ACCESS_LEVEL_KEY } from '../decorator/accesslevel.decorator';

// GUARD FOR THE ADMINTYPE
@Injectable()
export class AdminAcessLevelGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    
    console.log('AdminAccessLevel Guard executed');

    const requiredAccesslevel = this.reflector.getAllAndOverride<
      AdminAccessLevels[]
    >(ADMIN_ACCESS_LEVEL_KEY, [context.getHandler(), context.getClass()]);
    if (!requiredAccesslevel) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();

    return requiredAccesslevel.some(
      (accesslevel) => user.adminAccessLevels === accesslevel,
    );
  }
}
