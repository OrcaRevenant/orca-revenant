import { PartialType } from "@nestjs/mapped-types";
import {
  IsHexColor,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from "class-validator";
import { PopulatedPortfolio, PortfolioStatus } from "./portfolio.types";
import { Connection } from "@/connection/connection.types";
import { PortfolioGroupUniqueIdentifier } from "./portfolio-group/portfolio-group.types";
import { Expose } from "class-transformer";

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

  @IsOptional()
  @IsHexColor()
  color: string;
}

export class UpdatePortfolioDto extends PartialType(CreatePortfolioDto) {}

export class PopulatedPortfolioResponseDto implements PopulatedPortfolio {
  @Expose()
  id: string;

  @Expose()
  user_id: string;

  @Expose()
  title: string;

  @Expose()
  color: string;

  @Expose()
  group_id: PortfolioGroupUniqueIdentifier;

  @Expose()
  status: PortfolioStatus;

  @Expose()
  value: number;

  @Expose()
  connection: Pick<Connection, "title" | "type" | "logo" | "name">;

  @Expose()
  assets: string[];

  @Expose()
  asset_count: number;

  @Expose()
  disabled: boolean;

  @Expose()
  created_at: string;

  @Expose()
  last_sync_at: string;

  @Expose()
  type: "portfolio";
}
