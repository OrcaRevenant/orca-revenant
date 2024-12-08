import { IsString } from "class-validator";

export class BaseConnectionDto {
    @IsString()
    apiKey: string;
}

export class GetAssetsDto extends BaseConnectionDto {
}

export class GetTransactionsDto extends BaseConnectionDto {
}

export class GetPricesDto extends BaseConnectionDto {
}
