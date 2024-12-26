import { SupabaseService } from "@/common/supabase/supabase.service";
import { Injectable, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class AuthService {
    constructor(private readonly supabaseService: SupabaseService) {}

    async signUp(email: string, password: string) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) {
            throw new UnauthorizedException(error.message);
        }

        return data;
    }

    async signIn(email: string, password: string) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            throw new UnauthorizedException(error.message);
        }

        return data;
    }
}
