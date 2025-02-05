import { IsHexColor, IsNotEmpty, IsObject, IsString } from "class-validator";

export class CreatePortfolioDto {
    @IsObject()
    @IsNotEmpty()
    meta: Record<string, unknown>;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    connection: string;

    @IsHexColor()
    color: string;
}
