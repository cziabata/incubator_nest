import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LikeStatus } from 'src/core/dto/likes';

@Schema({ _id: false, timestamps: true })
export class CommentLike {
  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, enum: ['None', 'Like', 'Dislike'], required: true })
  status: LikeStatus;

  @Prop({ type: Date, required: true })
  createdAt: Date;
}

export const CommentLikeSchema = SchemaFactory.createForClass(CommentLike); 