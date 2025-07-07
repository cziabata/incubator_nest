import { IsBoolean, IsNotEmpty } from "class-validator";

export class TogglePublishStatusInputDto {
    @IsBoolean()
    @IsNotEmpty()
    published: boolean;
  }