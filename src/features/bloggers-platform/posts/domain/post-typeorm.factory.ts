import { PostTypeOrm } from './post-typeorm.entity';
import { PostLikeTypeOrm } from './post-like-typeorm.entity';
import { CreatePostTypeOrmDto, CreatePostForSpecificBlogTypeOrmDto, UpdatePostTypeOrmDto } from './types/post-typeorm.types';
import { LikeStatus } from '../../../../core/dto/likes';

export class PostTypeOrmFactory {
  static createPost(dto: CreatePostTypeOrmDto): PostTypeOrm {
    const post = new PostTypeOrm();
    post.title = dto.title;
    post.shortDescription = dto.shortDescription;
    post.content = dto.content;
    post.blogId = dto.blogId;
    
    return post;
  }

  static createPostForSpecificBlog(dto: CreatePostForSpecificBlogTypeOrmDto, blogId: string): PostTypeOrm {
    const post = new PostTypeOrm();
    post.title = dto.title;
    post.shortDescription = dto.shortDescription;
    post.content = dto.content;
    post.blogId = blogId;
    
    return post;
  }

  static updatePost(post: PostTypeOrm, dto: UpdatePostTypeOrmDto): PostTypeOrm {
    if (dto.title !== undefined) post.title = dto.title;
    if (dto.shortDescription !== undefined) post.shortDescription = dto.shortDescription;
    if (dto.content !== undefined) post.content = dto.content;
    if (dto.blogId !== undefined) post.blogId = dto.blogId;
    
    return post;
  }

  static createPostLike(postId: string, userId: string, login: string, status: LikeStatus): PostLikeTypeOrm {
    const like = new PostLikeTypeOrm();
    like.postId = postId;
    like.userId = userId;
    like.login = login;
    like.status = status;
    
    return like;
  }
} 