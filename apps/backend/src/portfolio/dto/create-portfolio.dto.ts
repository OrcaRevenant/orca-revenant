import { IsHexColor, IsNotEmpty, IsString } from "class-validator";

export class CreatePortfolioDto {
    @IsString()
    @IsNotEmpty()
    apiKey: string;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    connection: string;

    @IsHexColor()
    color: string;
}
