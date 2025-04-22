// import { User, UserModelType } from '../../domain/user.entity';
// import { InjectModel } from '@nestjs/mongoose';
import { UserViewDto } from '../../api/view-dto/users.view-dto';
import { Injectable, NotFoundException } from '@nestjs/common';
// import { FilterQuery } from 'mongoose';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { GetUsersQueryParams } from '../../api/input-dto/get-users-query-params.input-dto';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class UsersQueryRepository {
  constructor(
    // @InjectModel(User.name)
    // private UserModel: UserModelType,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async getByIdOrNotFoundFail(id: string): Promise<UserViewDto> {
    const sqlQuery = `
      SELECT
        id,
        login,
        email,
        created_at as "createdAt",
        first_name as "firstName",
        last_name as "lastName"
      FROM users
      WHERE id = $1 AND deleted_at IS NULL
    `;
    
    const result = await this.dataSource.query(sqlQuery, [id]);
    
    if (!result || result.length === 0) {
      throw new NotFoundException('user not found');
    }
    
    const user = result[0];
    const dto = new UserViewDto();
    
    dto.id = user.id.toString();
    dto.login = user.login;
    dto.email = user.email;
    dto.createdAt = user.createdAt;
    
    // Добавляем поля только если они не null
    if (user.firstName) {
      dto.firstName = user.firstName;
    }
    
    if (user.lastName) {
      dto.lastName = user.lastName;
    }
    
    return dto;
  }

  async getAll(
    query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    // Формируем базовый SQL запрос
    let sqlQuery = `
      SELECT
        id,
        login,
        email,
        created_at as "createdAt",
        first_name as "firstName",
        last_name as "lastName"
      FROM users
      WHERE deleted_at IS NULL
    `;

    const params: any[] = [];
    let paramIndex = 1;

    // Добавляем условия поиска
    if (query.searchLoginTerm || query.searchEmailTerm) {
      const searchConditions: string[] = [];

      if (query.searchLoginTerm) {
        searchConditions.push(`login ILIKE $${paramIndex}`);
        params.push(`%${query.searchLoginTerm}%`);
        paramIndex++;
      }

      if (query.searchEmailTerm) {
        searchConditions.push(`email ILIKE $${paramIndex}`);
        params.push(`%${query.searchEmailTerm}%`);
        paramIndex++;
      }

      sqlQuery += ` AND (${searchConditions.join(' OR ')})`;
    }

    // Добавляем сортировку и пагинацию
    sqlQuery += ` ORDER BY ${query.sortBy} ${query.sortDirection}`;
    sqlQuery += ` LIMIT $${paramIndex}`;
    params.push(query.pageSize);
    paramIndex++;

    sqlQuery += ` OFFSET $${paramIndex}`;
    params.push(query.calculateSkip());

    // Запрос для подсчета общего количества записей
    let countQuery = `
      SELECT COUNT(*) as total
      FROM users
      WHERE deleted_at IS NULL
    `;

    let totalCount;

    if (query.searchLoginTerm || query.searchEmailTerm) {
      const searchConditions: string[] = [];
      let countParamIndex = 1;
      const countParams: any[] = [];

      if (query.searchLoginTerm) {
        searchConditions.push(`login ILIKE $${countParamIndex}`);
        countParams.push(`%${query.searchLoginTerm}%`);
        countParamIndex++;
      }

      if (query.searchEmailTerm) {
        searchConditions.push(`email ILIKE $${countParamIndex}`);
        countParams.push(`%${query.searchEmailTerm}%`);
        countParamIndex++;
      }

      countQuery += ` AND (${searchConditions.join(' OR ')})`;

      const totalCountResult = await this.dataSource.query(
        countQuery,
        countParams,
      );
      totalCount = parseInt(totalCountResult[0].total);
    } else {
      const totalCountResult = await this.dataSource.query(countQuery);
      totalCount = parseInt(totalCountResult[0].total);
    }

    // Выполняем основной запрос
    const users = await this.dataSource.query(sqlQuery, params);

    // Маппим результаты в DTO
    const items = users.map((user) => {
      const item: any = {
        id: user.id.toString(),
        login: user.login,
        email: user.email,
        createdAt: user.createdAt,
      };
      
      if (user.firstName) {
        item.firstName = user.firstName;
      }
      
      if (user.lastName) {
        item.lastName = user.lastName;
      }
      
      return item;
    });

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
