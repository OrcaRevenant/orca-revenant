import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { OpenAI } from "openai";
import aiAdvisorConfig from "./ai-advisor.config";
import { PopulatedTransaction } from "@/transaction/transaction.types";
import { PopulatedPortfolioAsset } from "@/portfolio/portfolio-asset/portfolio-asset.types";

@Injectable()
export class AiAdvisorService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(AiAdvisorService.name);

  constructor(
    @Inject(aiAdvisorConfig.KEY)
    private readonly config: ConfigType<typeof aiAdvisorConfig>
  ) {
    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
    });
  }

  async generateAdvice(
    messages: any[],
    portfolioData?: PopulatedPortfolioAsset[],
    transactionData?: PopulatedTransaction[],
    userLocation?: string,
    meta?: Array<{ description: string; data: any }>
  ) {
    if (!this.openai.apiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    const systemMessage = {
      role: "system",
      content: `You are a sophisticated AI financial advisor. Your name is Orca Finance AI.
      
Your capabilities:
- Analyze portfolio composition and performance
- Identify investment patterns and risk profiles
- Provide personalized financial advice based on transaction history
- Explain financial concepts and market trends
- Make investment recommendations aligned with the user's risk tolerance

You have access to the following data:
${
  portfolioData
    ? `- Portfolio data showing asset allocation and performance:
      ${JSON.stringify(portfolioData, null, 2)}`
    : ""
}
${
  transactionData
    ? `- Transaction history showing buying/selling patterns:
      ${JSON.stringify(transactionData, null, 2)}`
    : ""
}
${userLocation ? `- User is located in: ${userLocation}` : ""}

${
  meta && meta.length > 0
    ? meta
        .map(
          (item) =>
            `- ${item.description}:
          ${JSON.stringify(item.data, null, 2)}`
        )
        .join("\n\n")
    : ""
}

When the user asks about their portfolio performance:
- Analyze the asset allocation and provide insights
- Calculate the total portfolio value
- Comment on any price changes in the past 24 hours
- Identify top performing and underperforming assets
- Suggest potential adjustments if appropriate

When providing advice:
- Be clear, concise, and professional but conversational
- Explain your reasoning when making recommendations
- Consider the user's risk profile based on their portfolio data
- Reference relevant economic data when appropriate
- Always present a balanced view of potential risks and rewards
- Avoid making absolute predictions about market performance
- Customize your advice to the user's specific financial situation

Current date: ${new Date().toLocaleDateString()}`,
    };

    const apiMessages = [systemMessage, ...messages];

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      return {
        role: response.choices[0].message.role,
        content: response.choices[0].message.content,
        id: response.id,
      };
    } catch (error) {
      this.logger.error(`Chat API error: ${error.message}`, error.stack);
      throw error;
    }
  }
}
