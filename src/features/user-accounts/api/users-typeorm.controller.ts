import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersTypeOrmQueryRepository } from '../infrastructure/query/users-typeorm.query-repository';
import { UserViewDto } from './view-dto/users.view-dto';
import { UsersTypeOrmService } from '../application/users-typeorm.service';
import { CreateUserInputDto } from './input-dto/users.input-dto';
import { PaginatedViewDto } from '../../../core/dto/base.paginated.view-dto';
import { UpdateUserInputDto } from './input-dto/update-user.input-dto';
import { GetUsersQueryParams } from './input-dto/get-users-query-params.input-dto';
import { BasicAuthGuard } from '../guards/basic/basic-auth.guard';

@Controller('sa/users')
export class UsersTypeOrmController {
  constructor(
    private usersTypeOrmQueryRepository: UsersTypeOrmQueryRepository,
    private usersTypeOrmService: UsersTypeOrmService,
  ) {}

  @Get(':id')
  async getById(@Param('id') id: string): Promise<UserViewDto> {
    return this.usersTypeOrmQueryRepository.getByIdOrNotFoundFail(id);
  }

  @UseGuards(BasicAuthGuard)
  @Get()
  async getAll(
    @Query() query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    return this.usersTypeOrmQueryRepository.getAll(query);
  }

  @UseGuards(BasicAuthGuard)
  @Post()
  async createUser(@Body() body: CreateUserInputDto): Promise<UserViewDto> {
    const userId = await this.usersTypeOrmService.createUser(body);
    return this.usersTypeOrmQueryRepository.getByIdOrNotFoundFail(userId);
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() body: UpdateUserInputDto,
  ): Promise<UserViewDto> {
    const userId = await this.usersTypeOrmService.updateUser(id, body);
    return this.usersTypeOrmQueryRepository.getByIdOrNotFoundFail(userId);
  }

  @UseGuards(BasicAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string): Promise<void> {
    return this.usersTypeOrmService.deleteUser(id);
  }
} 