import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigType } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { SupabaseService } from "@/common/supabase/supabase.service";
import supabaseConfig from "@/common/supabase/supabase.config";
import { AuthStrategy } from "./auth.strategy";

const InjectedConfig = ConfigModule.forFeature(supabaseConfig);

@Module({
  imports: [
    InjectedConfig,
    PassportModule,
    JwtModule.registerAsync({
      imports: [InjectedConfig],
      inject: [supabaseConfig.KEY],
      useFactory: (config: ConfigType<typeof supabaseConfig>) => ({
        secret: config.secret,
        signOptions: { expiresIn: "1h" },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SupabaseService, AuthStrategy],
  exports: [AuthService],
})
export class AuthModule {}
