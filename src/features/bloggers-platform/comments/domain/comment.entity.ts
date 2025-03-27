import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { LikesInfo, LikesInfoSchema } from './likes-info.schema';
import {
  CommentatorInfo,
  CommentatorInfoSchema,
} from './commentator-info.schema';
import { CommentLike, CommentLikeSchema } from './like.schema';

@Schema({ timestamps: true })
export class Comment {
  _id: Types.ObjectId;
  createdAt: Date;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: String, required: true })
  postId: string;

  @Prop({ type: CommentatorInfoSchema, required: true, default: {} })
  commentatorInfo: CommentatorInfo;

  @Prop({ type: LikesInfoSchema, required: true, default: {} })
  likesInfo: LikesInfo;
  
  @Prop({ type: [CommentLikeSchema], required: true, default: [] })
  likes: CommentLike[];

  get id() {
    return this._id.toString();
  }
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

//регистрирует методы сущности в схеме
CommentSchema.loadClass(Comment);

//Типизация документа
export type CommentDocument = HydratedDocument<Comment>;
//Типизация модели + статические методы
export type CommentModelType = Model<CommentDocument> & typeof Comment;
