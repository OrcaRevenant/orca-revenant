import { IsNotEmpty, IsString } from "class-validator";

export class CreateFeedbackDto {
    @IsString()
    @IsNotEmpty()
    content: string;

    @IsString()
    @IsNotEmpty()
    title: string;
}
