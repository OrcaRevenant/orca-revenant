import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class ChatQuestionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(1000)
  question: string;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  portfolio_id: string;
}
