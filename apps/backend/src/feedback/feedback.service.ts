import { Injectable } from "@nestjs/common";
import { CreateFeedbackDto } from "./dto/create-feedback.dto";
import { FeedbackRepository } from "./feedback.repository";

@Injectable()
export class FeedbackService {
  constructor(private readonly feedbackRepository: FeedbackRepository) {}

  async create(createFeedbackDto: CreateFeedbackDto, userId: string) {
    return this.feedbackRepository.create({
      user_id: userId,
      content: createFeedbackDto.content,
      title: createFeedbackDto.title,
    });
  }
}
