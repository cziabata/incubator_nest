import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, IsNull } from 'typeorm';
import { UserTypeOrmEntity } from '../../domain/user-typeorm.entity';
import {
  UserPublicData,
  UserSearchFilters,
  UserSortOptions,
  UserPaginationOptions,
  PaginatedUsersResult,
} from '../../domain/types/user-typeorm.types';
import { UserViewDto } from '../../api/view-dto/users.view-dto';
import { GetUsersQueryParams } from '../../api/input-dto/get-users-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';

@Injectable()
export class UsersTypeOrmQueryRepository {
  constructor(
    @InjectRepository(UserTypeOrmEntity)
    private readonly usersRepository: Repository<UserTypeOrmEntity>,
  ) {}

  async getByIdOrNotFoundFail(id: string): Promise<UserViewDto> {
    const user = await this.usersRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!user) {
      throw new NotFoundException('user not found');
    }

    return this.mapToViewDto(user);
  }

  async getById(id: string): Promise<UserViewDto | null> {
    const user = await this.usersRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!user) {
      return null;
    }

    return this.mapToViewDto(user);
  }

  async getAll(query: GetUsersQueryParams): Promise<PaginatedViewDto<UserViewDto[]>> {
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .where('user.deletedAt IS NULL');

    // Add search filters - convert null to undefined for TypeORM compatibility
    const filters: UserSearchFilters = {
      searchLoginTerm: query.searchLoginTerm ?? undefined,
      searchEmailTerm: query.searchEmailTerm ?? undefined,
    };

    this.addSearchFilters(queryBuilder, filters);

    // Get total count before applying pagination
    const totalCount = await queryBuilder.getCount();

    // Add sorting and pagination
    queryBuilder
      .orderBy(`user.${query.sortBy}`, query.sortDirection.toUpperCase() as 'ASC' | 'DESC')
      .limit(query.pageSize)
      .offset(query.calculateSkip());

    const users = await queryBuilder.getMany();

    // Map to view DTOs
    const items = users.map(user => this.mapToViewDto(user));

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  async getAllWithFilters(
    filters: UserSearchFilters,
    sortOptions: UserSortOptions,
    paginationOptions: UserPaginationOptions,
  ): Promise<PaginatedUsersResult<UserPublicData>> {
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .where('user.deletedAt IS NULL');

    // Add search filters
    this.addSearchFilters(queryBuilder, filters);

    // Get total count before applying pagination
    const totalCount = await queryBuilder.getCount();

    // Add sorting and pagination
    queryBuilder
      .orderBy(`user.${sortOptions.sortBy}`, sortOptions.sortDirection)
      .limit(paginationOptions.pageSize)
      .offset((paginationOptions.page - 1) * paginationOptions.pageSize);

    const users = await queryBuilder.getMany();

    // Map to public data
    const items = users.map(user => this.mapToPublicData(user));

    return {
      items,
      totalCount,
      page: paginationOptions.page,
      pageSize: paginationOptions.pageSize,
      pagesCount: Math.ceil(totalCount / paginationOptions.pageSize),
    };
  }

  async findByLogin(login: string): Promise<UserPublicData | null> {
    const user = await this.usersRepository.findOne({
      where: { login, deletedAt: IsNull() },
    });

    if (!user) {
      return null;
    }

    return this.mapToPublicData(user);
  }

  async findByEmail(email: string): Promise<UserPublicData | null> {
    const user = await this.usersRepository.findOne({
      where: { email, deletedAt: IsNull() },
    });

    if (!user) {
      return null;
    }

    return this.mapToPublicData(user);
  }

  async findByLoginOrEmail(loginOrEmail: string): Promise<UserPublicData | null> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .where('(user.login = :loginOrEmail OR user.email = :loginOrEmail)', { loginOrEmail })
      .andWhere('user.deletedAt IS NULL')
      .getOne();

    if (!user) {
      return null;
    }

    return this.mapToPublicData(user);
  }

  private addSearchFilters(
    queryBuilder: SelectQueryBuilder<UserTypeOrmEntity>,
    filters: UserSearchFilters,
  ): void {
    if (filters.searchLoginTerm || filters.searchEmailTerm) {
      const searchConditions: string[] = [];

      if (filters.searchLoginTerm) {
        searchConditions.push('user.login ILIKE :loginTerm');
        queryBuilder.setParameter('loginTerm', `%${filters.searchLoginTerm}%`);
      }

      if (filters.searchEmailTerm) {
        searchConditions.push('user.email ILIKE :emailTerm');
        queryBuilder.setParameter('emailTerm', `%${filters.searchEmailTerm}%`);
      }

      queryBuilder.andWhere(`(${searchConditions.join(' OR ')})`);
    }

    if (filters.isDeleted !== undefined) {
      if (filters.isDeleted) {
        queryBuilder.andWhere('user.deletedAt IS NOT NULL');
      } else {
        queryBuilder.andWhere('user.deletedAt IS NULL');
      }
    }
  }

  private mapToViewDto(user: UserTypeOrmEntity): UserViewDto {
    const dto = new UserViewDto();
    dto.id = user.id;
    dto.login = user.login;
    dto.email = user.email;
    dto.createdAt = user.createdAt;

    // Add optional fields only if they're not null
    if (user.firstName) {
      dto.firstName = user.firstName;
    }

    if (user.lastName) {
      dto.lastName = user.lastName;
    }

    return dto;
  }

  private mapToPublicData(user: UserTypeOrmEntity): UserPublicData {
    return {
      id: user.id,
      login: user.login,
      email: user.email,
      isEmailConfirmed: user.isEmailConfirmed,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
} 