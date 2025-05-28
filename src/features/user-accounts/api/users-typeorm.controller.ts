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

@Controller('sa/users-typeorm')
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

  // Additional endpoints for TypeORM-specific functionality
  @Post(':id/confirm-email')
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmEmail(@Param('id') id: string): Promise<void> {
    return this.usersTypeOrmService.confirmEmail(id);
  }

  @Post(':id/update-confirmation-code')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateConfirmationCode(
    @Param('id') id: string,
    @Body() body: { confirmationCode: string; expirationDate: Date },
  ): Promise<void> {
    return this.usersTypeOrmService.updateConfirmationCode(
      id,
      body.confirmationCode,
      body.expirationDate,
    );
  }

  @Post(':id/reset-confirmation')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetConfirmationAndUpdateCode(
    @Param('id') id: string,
    @Body() body: { confirmationCode: string; expirationDate: Date },
  ): Promise<void> {
    return this.usersTypeOrmService.updateConfirmationCodeAndResetConfirmation(
      id,
      body.confirmationCode,
      body.expirationDate,
    );
  }

  @Post(':id/update-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePasswordAndConfirmEmail(
    @Param('id') id: string,
    @Body() body: { newPassword: string },
  ): Promise<void> {
    return this.usersTypeOrmService.updatePasswordAndConfirmEmail(id, body.newPassword);
  }

  // Additional GET endpoints for finding users
  @Get('by-login/:login')
  async findByLogin(@Param('login') login: string) {
    const user = await this.usersTypeOrmService.findByLogin(login);
    if (!user) {
      return null;
    }
    return this.mapToPublicView(user);
  }

  @Get('by-email/:email')
  async findByEmail(@Param('email') email: string) {
    const user = await this.usersTypeOrmService.findByEmail(email);
    if (!user) {
      return null;
    }
    return this.mapToPublicView(user);
  }

  @Get('by-confirmation-code/:code')
  async findByConfirmationCode(@Param('code') code: string) {
    const user = await this.usersTypeOrmService.findByConfirmationCode(code);
    if (!user) {
      return null;
    }
    return this.mapToPublicView(user);
  }

  // Utility methods for existence checks
  @Get('check/login-exists/:login')
  async checkLoginExists(@Param('login') login: string): Promise<{ exists: boolean }> {
    const exists = await this.usersTypeOrmService.loginIsExist(login);
    return { exists };
  }

  @Get('check/email-exists/:email')
  async checkEmailExists(@Param('email') email: string): Promise<{ exists: boolean }> {
    const exists = await this.usersTypeOrmService.emailIsExist(email);
    return { exists };
  }

  private mapToPublicView(user: any): UserViewDto {
    const dto = new UserViewDto();
    dto.id = user.id;
    dto.login = user.login;
    dto.email = user.email;
    dto.createdAt = user.createdAt;

    if (user.firstName) {
      dto.firstName = user.firstName;
    }

    if (user.lastName) {
      dto.lastName = user.lastName;
    }

    return dto;
  }
} 