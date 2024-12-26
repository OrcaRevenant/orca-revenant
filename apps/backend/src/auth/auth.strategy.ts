import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { AuthUser } from "@supabase/supabase-js";
import supabaseConfig from "@/common/supabase/supabase.config";

@Injectable()
export class AuthStrategy extends PassportStrategy(Strategy) {
    constructor(
        @Inject(supabaseConfig.KEY) private readonly config: ConfigType<
            typeof supabaseConfig
        >,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.secret,
            ignoreExpiration: false,
        });
    }

    async validate(user: AuthUser) {
        return user;
    }
}
