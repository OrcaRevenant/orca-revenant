import {
  IsArray,
  IsEnum,
  IsNumber,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export enum ItemType {
  PORTFOLIO = "portfolio",
  PORTFOLIO_GROUP = "group",
}

export class OrderItemDto {
  @IsString()
  id: string;

  @IsEnum(ItemType)
  type: ItemType;

  @IsNumber()
  order: number;
}

export class ReorderItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
