import { IsHexColor, IsNotEmpty, IsString } from "class-validator";

export class PortfolioBaseDto {
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

export class CreatePortfolioDto extends PortfolioBaseDto {
}

export class UpdatePortfolioDto extends PortfolioBaseDto {
}
