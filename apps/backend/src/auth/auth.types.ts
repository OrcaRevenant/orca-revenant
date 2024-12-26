import { User as IUser } from "@supabase/supabase-js";

export type User = IUser;

export type JwtPayload =
    & Pick<
        IUser,
        | `aud`
        | `role`
        | `phone`
        | `email`
        | `app_metadata`
        | `user_metadata`
        | `is_anonymous`
    >
    & {
        iss: string;
        sub: string;
        aud: string;
        exp: number;
        iat: number;
    };
