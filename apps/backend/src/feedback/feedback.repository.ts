import { SupabaseService } from "@/common/supabase/supabase.service";
import { Injectable } from "@nestjs/common";
import { CreateFeedback, Feedback } from "./feedback.types";

@Injectable()
export class FeedbackRepository {
  private readonly table = "feedback";

  constructor(private readonly supabaseService: SupabaseService) {}

  async create(payload: CreateFeedback): Promise<Feedback> {
    const client = this.supabaseService.getClient();
    const { data, error } = await client.from(this.table).insert(
      payload,
    )
      .select(`*`).single();

    if (error) {
      throw new Error(`Error creating record: ${error.message}`);
    }
    return data;
  }
}
