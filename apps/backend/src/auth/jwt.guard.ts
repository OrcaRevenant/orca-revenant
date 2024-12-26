import {
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { User } from "@supabase/supabase-js";

@Injectable()
export class JwtGuard extends AuthGuard("jwt") {
    canActivate(context: ExecutionContext) {
        // Add custom logic here if needed
        return super.canActivate(context);
    }

    handleRequest<TUser = any>(err: any, user: TUser): TUser {
        if (err || !user) {
            throw new UnauthorizedException("Invalid or missing token");
        }

        const typedUser = user as User;
        return typedUser as TUser;
    }
}
