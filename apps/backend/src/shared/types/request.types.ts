import { JwtPayload } from "@/auth/auth.types";
import { Request } from "express";

export interface AuthUserRequest extends Request {
    user: JwtPayload;
}
