import { HttpService } from "@nestjs/axios";
import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { firstValueFrom } from "rxjs";

export interface ChatResponse {
  question: string;
  answer: string;
  status: string;
}

interface WebhookResponse {
  response: string;
  success: boolean;
  timestamp: string;
}

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly webhookUrl = "http://localhost:5001/webhook";

  constructor(private readonly httpService: HttpService) {}

  async askQuestion(
    question: string,
    token: string,
    portfolioId: string
  ): Promise<ChatResponse> {
    try {
      this.logger.log(
        `Proxying question to webhook: ${question} for token: ${token} and portfolio: ${portfolioId}`
      );

      // Prepare the payload for the webhook including token and portfolio_id
      const payload = {
        question: question,
        token: token,
        portfolio_id: portfolioId,
      };

      // Forward the question to the external webhook and wait for response
      const webhookResponse = await this.callWebhook(payload);

      return {
        question: question,
        answer: webhookResponse.response || "No response from agent",
        status: webhookResponse.success ? "success" : "error",
      };
    } catch (error) {
      this.logger.error(`Error calling webhook: ${error.message}`);
      return {
        question: question,
        answer: "Failed to get response from agent. Please try again.",
        status: "error",
      };
    }
  }

  private async callWebhook(payload: {
    question: string;
    token: string;
    portfolio_id: string;
  }): Promise<WebhookResponse> {
    try {
      this.logger.log(`Calling webhook at ${this.webhookUrl}`);

      // Make the HTTP request to the webhook
      const response = await firstValueFrom(
        this.httpService.post(this.webhookUrl, payload, {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 30000, // 30 second timeout
        })
      );

      this.logger.log(
        `Webhook response received: ${JSON.stringify(response.data)}`
      );
      return response.data as WebhookResponse;
    } catch (error) {
      this.logger.error(`Webhook call failed: ${error.message}`);
      if (error.response) {
        this.logger.error(
          `Webhook error response: ${JSON.stringify(error.response.data)}`
        );
      }
      throw new HttpException(
        "External agent service is unavailable",
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  // Original webhook handler for receiving webhooks (if still needed)
  async handleWebhook(payload: any): Promise<void> {
    this.logger.log("Webhook received:", payload);
    // Handle incoming webhook logic here if needed
  }
}
