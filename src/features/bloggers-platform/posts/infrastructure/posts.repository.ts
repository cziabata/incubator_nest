import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument, PostModelType } from '../domain/post.entity';

@Injectable()
export class PostsRepository {
  constructor(@InjectModel(Post.name) private PostModel: PostModelType) {}

  async findById(id: string): Promise<PostDocument | null> {
    return this.PostModel.findOne({
      _id: id,
    });
  }

  async findOrNotFoundFail(id: string): Promise<PostDocument> {
    const post = await this.findById(id);

    if (!post) {
      //TODO: replace with domain exception
      throw new NotFoundException('post not found');
    }

    return post;
  }

  async save(post: PostDocument) {
    await post.save();
  }

  async deleteById(id: string): Promise<void> {
    const result = await this.PostModel.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Blog not found');
    }
  }
}
