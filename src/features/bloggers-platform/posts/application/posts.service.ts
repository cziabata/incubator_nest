import { Injectable } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { LikeStatus } from "src/core/dto/likes";
import { UpdatePostLikeStatusCommand } from "./usecases/update-post-like-status.usecase";

@Injectable()
export class PostsService {
    constructor(
        private commandBus: CommandBus
    ) {}

    async updatePostLikeStatus(
        postId: string,
        userId: string,
        userLogin: string,
        likeStatus: LikeStatus
    ): Promise<void> {
        return this.commandBus.execute(
            new UpdatePostLikeStatusCommand(postId, userId, userLogin, likeStatus)
        );
    }
} 