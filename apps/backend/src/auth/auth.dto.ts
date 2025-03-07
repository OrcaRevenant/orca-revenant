import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class SignUpDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6, { message: "Password must be at least 6 characters long" })
  password: string;
}

export class SignInDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}

export class RenewDto {
  @IsNotEmpty()
  refreshToken: string;
}
