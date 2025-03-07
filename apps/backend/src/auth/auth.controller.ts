import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RenewDto, SignInDto, SignUpDto } from "./auth.dto";
import { JwtGuard } from "./jwt.guard";
import { AuthUserRequest } from "@/shared/types/request.types";
import { ExtractJwt } from "passport-jwt";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto.email, signUpDto.password);
  }

  @Post("signin")
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }

  @Get("profile")
  @UseGuards(JwtGuard)
  async getProfile(@Req() req: AuthUserRequest) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    return this.authService.getProfile(token);
  }

  @Post("renew")
  async renewToken(@Body() body: RenewDto) {
    return this.authService.renewToken(body.refreshToken);
  }
}
