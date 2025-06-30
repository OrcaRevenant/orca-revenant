import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from "@nestjs/common";
import { AgentService, ChatResponse } from "./agent.service";
import { ChatQuestionDto } from "./dto/chat-question.dto";

@Controller()
export class AgentController {
  private readonly logger = new Logger(AgentController.name);

  constructor(private readonly agentService: AgentService) {}

  @Post("ask")
  @HttpCode(HttpStatus.OK)
  async askQuestion(@Body() body: ChatQuestionDto): Promise<ChatResponse> {
    this.logger.log(
      `Received question from frontend: ${body.question} for token: ${body.token} and portfolio: ${body.portfolio_id}`
    );
    return this.agentService.ask(
      body.question,
      body.token,
      body.portfolio_id
    );
  }
}
