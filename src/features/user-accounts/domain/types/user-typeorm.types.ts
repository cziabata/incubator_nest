import { UserTypeOrmEntity } from '../user-typeorm.entity';

// DTO для создания пользователя
export interface CreateUserTypeOrmDto {
  login: string;
  email: string;
  passwordHash: string;
  confirmationCode?: string;
  expirationDate?: Date;
  isEmailConfirmed?: boolean;
  firstName?: string;
  lastName?: string;
}

// DTO для создания пользователя с подтверждением
export interface CreateUserWithConfirmationTypeOrmDto {
  login: string;
  email: string;
  passwordHash: string;
  confirmationCode: string;
  expirationDate: Date;
  isEmailConfirmed: boolean;
  firstName?: string;
  lastName?: string;
}

// DTO для обновления пользователя
export interface UpdateUserTypeOrmDto {
  email?: string;
  passwordHash?: string;
  isEmailConfirmed?: boolean;
  confirmationCode?: string;
  expirationDate?: Date;
  firstName?: string;
  lastName?: string;
}

// DTO для обновления кода подтверждения
export interface UpdateConfirmationCodeTypeOrmDto {
  confirmationCode: string;
  expirationDate: Date;
}

// Тип для возвращаемого пользователя (без чувствительных данных)
export interface UserPublicData {
  id: string;
  login: string;
  email: string;
  isEmailConfirmed: boolean;
  firstName?: string | null;
  lastName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Тип для полных данных пользователя (включая чувствительные)
export interface UserFullData extends UserPublicData {
  passwordHash: string;
  confirmationCode: string | null;
  expirationDate: Date | null;
  deletedAt: Date | null;
}

// Фильтры для поиска пользователей
export interface UserSearchFilters {
  searchLoginTerm?: string;
  searchEmailTerm?: string;
  isDeleted?: boolean;
}

// Опции сортировки
export interface UserSortOptions {
  sortBy: keyof UserTypeOrmEntity;
  sortDirection: 'ASC' | 'DESC';
}

// Опции пагинации
export interface UserPaginationOptions {
  page: number;
  pageSize: number;
}

// Тип для результата с пагинацией
export interface PaginatedUsersResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  pagesCount: number;
} 