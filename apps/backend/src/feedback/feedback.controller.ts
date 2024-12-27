import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { FeedbackService } from "./feedback.service";
import { CreateFeedbackDto } from "./dto/create-feedback.dto";
import { AuthUserRequest } from "@/shared/types/request.types";
import { JwtGuard } from "@/auth/jwt.guard";

@Controller("feedbacks")
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @UseGuards(JwtGuard)
  create(
    @Req() req: AuthUserRequest,
    @Body() createFeedbackDto: CreateFeedbackDto,
  ) {
    const userId = req.user.sub;
    return this.feedbackService.create(createFeedbackDto, userId);
  }
}
