export class CreatePostDto {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
}

export class UpdatePostDto {
  title?: string;
  shortDescription?: string;
  content?: string;
  blogId?: string;
}

export class CreatePostForSpecificBlogDto {
  title: string;
  shortDescription: string;
  content: string;
}
