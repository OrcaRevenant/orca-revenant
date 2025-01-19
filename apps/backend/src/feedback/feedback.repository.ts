import { Injectable } from "@nestjs/common";
import { Feedback } from "./feedback.types";
import { DatabaseService } from "@/database/database.service";

@Injectable()
export class FeedbackRepository {
  constructor(private readonly db: DatabaseService) {}

  private serialize(feedback: any): Feedback {
    return {
      content: feedback.content,
      created_at: feedback.created_at,
      id: feedback.id,
      title: feedback.title,
      user_id: feedback.user_id,
    };
  }

  async create(payload: Partial<Feedback>): Promise<Feedback> {
    const [feedback] = await this.db.query
      .insertInto("feedback")
      .values(payload)
      .returningAll()
      .execute();

    if (!feedback) {
      throw new Error(`Error creating feedback record.`);
    }

    return this.serialize(feedback);
  }
}
