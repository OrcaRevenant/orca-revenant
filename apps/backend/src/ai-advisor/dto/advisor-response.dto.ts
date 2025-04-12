import { ApiProperty } from '@nestjs/swagger';
import { MessageRole } from './message.dto';

export class AdvisorResponseDto {
  @ApiProperty({
    description: 'Role of the message sender',
    enum: MessageRole,
    example: MessageRole.ASSISTANT,
  })
  role: string;

  @ApiProperty({
    description: 'Content of the AI response',
    example: 'Based on your portfolio, I recommend...',
  })
  content: string;

  @ApiProperty({
    description: 'Unique identifier for the chat completion',
  })
  id: string;
} 