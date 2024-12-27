import { IsNotEmpty, IsString } from "class-validator";

export class BaseConnectionDto {
    @IsString()
    @IsNotEmpty()
    apiKey: string;
}

export class GetAssetsDto extends BaseConnectionDto {
}

export class GetTransactionsDto extends BaseConnectionDto {
}

export class GetPricesDto extends BaseConnectionDto {
}
