import { IsArray } from "class-validator";
import { PageMetaDto } from "./page-meta.dto";

export class PageDto<T> {
  @IsArray()
  readonly list: T[];

  readonly meta: PageMetaDto;

  constructor(list: T[], meta: PageMetaDto) {
    this.list = list;
    this.meta = meta;
  }
}
