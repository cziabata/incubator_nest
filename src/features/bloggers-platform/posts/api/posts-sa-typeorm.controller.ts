import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Body, 
  Query, 
  HttpCode,
  HttpStatus,
  UseGuards 
} from '@nestjs/common';
import { PostsTypeOrmService } from '../application/posts-typeorm.service';
import { PostsTypeOrmQueryRepository } from '../infrastructure/query/posts-typeorm.query-repository';
import { CreatePostInputDto } from './input-dto/create-post.input-dto';
import { UpdatePostInputDto } from './input-dto/update-post.input-dto';
import { GetPostsQueryParams } from './input-dto/get-posts-query-params.input-dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { PostViewDto } from './view-dto/posts.view-dto';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { ParseUUIDPipe } from 'src/core/pipes/parse-uuid.pipe';

@Controller('sa/posts')
export class PostsSaTypeOrmController {
  constructor(
    private readonly postsService: PostsTypeOrmService,
    private readonly postsQueryRepository: PostsTypeOrmQueryRepository,
  ) {}

  @Get()
  @UseGuards(BasicAuthGuard)
  async getAllPosts(@Query() query: GetPostsQueryParams): Promise<PaginatedViewDto<PostViewDto[]>> {
    return await this.postsQueryRepository.getAll(query);
  }

  @Post()
  @UseGuards(BasicAuthGuard)
  async createPost(@Body() dto: CreatePostInputDto): Promise<PostViewDto> {
    const post = await this.postsService.createPost(dto);
    return await this.postsQueryRepository.getById(post.id);
  }

  @Put(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePostInputDto): Promise<void> {
    await this.postsService.updatePost(id, dto);
  }

  @Delete(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.postsService.deletePost(id);
  }
} 