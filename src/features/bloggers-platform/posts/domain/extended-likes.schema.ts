import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

class NewestLike {
  @Prop({ type: Date, required: true })
  addedAt: Date;

  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, required: true })
  login: string;
}

@Schema({ _id: false })
export class ExtendedLikesInfo {
  @Prop({ type: Number, required: true })
  likesCount: number;

  @Prop({ type: Number, required: true })
  dislikesCount: number;

  @Prop({ type: String, enum: ['None', 'Like', 'Dislike'], default: 'None' })
  myStatus: string;

  @Prop({ type: [NewestLike], default: [] })
  newestLikes: NewestLike[];
}

export const NameSchema = SchemaFactory.createForClass(ExtendedLikesInfo);
