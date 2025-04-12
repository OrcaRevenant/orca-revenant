import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum MessageRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
}

export class MessageDto {
  @ApiProperty({
    description: 'Role of the message sender',
    enum: MessageRole,
    example: MessageRole.USER,
  })
  @IsEnum(MessageRole)
  @IsNotEmpty()
  role: MessageRole;

  @ApiProperty({
    description: 'Content of the message',
    example: 'What does my investment portfolio look like?',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
} 