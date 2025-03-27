import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import {
  ExtendedLikesInfo,
  ExtendedLikesInfoSchema,
} from './extended-likes.schema';
import { CreatePostDomainDto } from './dto/create-post.domain.dto';
import { UpdatePostDto } from '../dto/posts.dto';
import { PostLike, PostLikeSchema } from './post-like.schema';

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

  @Prop({ type: ExtendedLikesInfoSchema, required: true, default: {} })
  extendedLikesInfo: ExtendedLikesInfo;

  @Prop({ type: [PostLikeSchema], required: true, default: [] })
  likes: PostLike[];

  @Prop({
    type: {
      likesCount: { type: Number, required: true },
      dislikesCount: { type: Number, required: true },
      myStatus: { type: String, enum: ['None', 'Like', 'Dislike'], required: true },
    },
    required: true,
    default: {
      likesCount: 0,
      dislikesCount: 0,
      myStatus: 'None',
    },
    _id: false,
  })
  likesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: string;
  };

  @Prop({
    type: [{
      addedAt: { type: Date, required: true },
      userId: { type: String, required: true },
      login: { type: String, required: true },
    }],
    required: true,
    default: [],
    _id: false,
  })
  newestLikes: {
    addedAt: Date;
    userId: string;
    login: string;
  }[];

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
    post.likes = [];
    post.likesInfo = {
      likesCount: 0,
      dislikesCount: 0,
      myStatus: 'None',
    };
    post.newestLikes = [];
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
