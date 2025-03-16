import { Expose, Type } from "class-transformer";
import {
  PortfolioGroupUniqueIdentifier,
  PortfolioGroupStats,
  PopulatedPortfolioGroup,
  PortfolioGroupTree,
} from "./portfolio-group.types";
import { PopulatedPortfolioResponseDto } from "../portfolio.dto";

export class PortfolioGroupResponseDto implements PopulatedPortfolioGroup {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  color: string;

  @Expose()
  user_id: string;

  @Expose()
  parent_id: PortfolioGroupUniqueIdentifier | null;

  @Expose()
  created_at: Date;

  @Expose()
  total_value: number;

  @Expose()
  unique_assets: Set<string>;

  @Expose()
  total_portfolios: number;

  @Expose()
  type: "group";

  @Expose()
  @Type(() => Object, {
    discriminator: {
      property: "type",
      subTypes: [
        { value: PortfolioGroupResponseDto, name: "group" },
        { value: PopulatedPortfolioResponseDto, name: "portfolio" },
      ],
    },
  })
  children?: PortfolioGroupTree;
}

export class PortfolioGroupStatsResponseDto implements PortfolioGroupStats {
  @Expose()
  total_value: number;

  @Expose()
  unique_assets: Set<string>;

  @Expose()
  total_portfolios: number;
}

export class PortfolioGroupTreeResponseDto {
  @Expose()
  @Type(() => Object, {
    discriminator: {
      property: "type",
      subTypes: [
        { value: PortfolioGroupResponseDto, name: "group" },
        { value: PopulatedPortfolioResponseDto, name: "portfolio" },
      ],
    },
  })
  groups: PortfolioGroupTree;

  @Expose()
  @Type(() => PortfolioGroupStatsResponseDto)
  stats: PortfolioGroupStats;
}
