import { Injectable } from '@nestjs/common';
import { PostsRepository } from '../infrastructure/posts.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostModelType } from '../domain/post.entity';
import {
  CreatePostDto,
  CreatePostForSpecificBlogDto,
  UpdatePostDto,
} from '../dto/posts.dto';
import { BlogsQueryRepository } from '../../blogs/infrastructure/query/blogs.query-repository';
import { CreatePostDomainDto } from '../domain/dto/create-post.domain.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name)
    private PostModel: PostModelType,
    private postsRepository: PostsRepository,
    private blogsQueryRepository: BlogsQueryRepository,
  ) {}

  async createPost(dto: CreatePostDto): Promise<string> {
    const relatedBlog = await this.blogsQueryRepository.getById(dto.blogId);

    const prepareNewPostDto: CreatePostDomainDto = {
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: dto.blogId,
      blogName: relatedBlog.name,
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None',
        newestLikes: [],
      },
    };
    const post = this.PostModel.createInstance(prepareNewPostDto);

    await this.postsRepository.save(post);

    return post.id;
  }

  async createPostForSpecificBlog(
    blogId: string,
    dto: CreatePostForSpecificBlogDto,
  ): Promise<string> {
    const relatedBlog = await this.blogsQueryRepository.getById(blogId);

    const prepareNewPostDto: CreatePostDomainDto = {
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId,
      blogName: relatedBlog.name,
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None',
        newestLikes: [],
      },
    };
    const post = this.PostModel.createInstance(prepareNewPostDto);

    await this.postsRepository.save(post);

    return post.id;
  }

  async updatePost(id: string, dto: UpdatePostDto): Promise<string> {
    const post = await this.postsRepository.findOrNotFoundFail(id);

    post.updatePost(dto);

    await this.postsRepository.save(post);

    return post._id.toString();
  }

  async deletePost(id: string): Promise<void> {
    await this.postsRepository.deleteById(id);
  }
}
