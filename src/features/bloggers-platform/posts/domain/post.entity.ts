import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { ExtendedLikesInfo } from './extended-likes.schema';
import { CreatePostDomainDto } from './dto/create-post.domain.dto';
import { UpdatePostDto } from '../dto/posts.dto';

@Schema({ timestamps: true })
export class Post {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  shortDescription: string;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: String, required: true })
  blogId: string;

  @Prop({ type: String, required: true })
  blogName: string;

  @Prop({ type: ExtendedLikesInfo, required: true, default: {} })
  extendedLikesInfo: ExtendedLikesInfo;

  get id() {
    return this._id.toString();
  }

  static createInstance(dto: CreatePostDomainDto): PostDocument {
    const post = new this();
    post.title = dto.title;
    post.shortDescription = dto.shortDescription;
    post.content = dto.content;
    post.blogId = dto.blogId;
    post.blogName = dto.blogName;
    post.extendedLikesInfo = dto.extendedLikesInfo;
    return post as PostDocument;
  }

  updatePost(dto: UpdatePostDto) {
    this.title = dto.title ? dto.title : this.title;
    this.shortDescription = dto.shortDescription
      ? dto.shortDescription
      : this.shortDescription;
    this.content = dto.content ? dto.content : this.content;
    this.blogId = dto.blogId ? dto.blogId : this.blogId;
  }
}

export const PostSchema = SchemaFactory.createForClass(Post);

//регистрирует методы сущности в схеме
PostSchema.loadClass(Post);

//Типизация документа
export type PostDocument = HydratedDocument<Post>;
//Типизация модели + статические методы
export type PostModelType = Model<PostDocument> & typeof Post;
