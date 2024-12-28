import { Injectable } from "@nestjs/common";
import { CreateFeedbackDto } from "./dto/create-feedback.dto";
import { FeedbackRepository } from "./feedback.repository";

@Injectable()
export class FeedbackService {
  constructor(private readonly feedbackRepository: FeedbackRepository) {}

  async create(createFeedbackDto: CreateFeedbackDto, userId: string) {
    return this.feedbackRepository.create({
      content: createFeedbackDto.content,
      title: createFeedbackDto.title,
      user_id: userId,
    });
  }
}
