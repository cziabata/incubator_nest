import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class LikesInfo {
  @Prop({ type: Number, required: true })
  likesCount: number;

  @Prop({ type: Number, required: true })
  dislikesCount: number;

  @Prop({ type: String, enum: ['None', 'Like', 'Dislike'], default: 'None' })
  myStatus: string;
}

export const LikesInfoSchema = SchemaFactory.createForClass(LikesInfo);
