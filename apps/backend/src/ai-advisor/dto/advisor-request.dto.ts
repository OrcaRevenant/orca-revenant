import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsOptional, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { MessageDto } from "./message.dto";

export class AdvisorRequestDto {
  @ApiProperty({
    description: "Array of messages for the conversation",
    type: [MessageDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  messages: MessageDto[];

  @ApiPropertyOptional({
    description: "User's location for context-aware advice",
    example: "United States",
    type: String,
  })
  @IsOptional()
  userLocation?: string;
}
