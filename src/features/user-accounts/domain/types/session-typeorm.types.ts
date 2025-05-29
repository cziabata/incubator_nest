import { SessionTypeOrmEntity } from '../session-typeorm.entity';

// DTO для создания сессии
export interface CreateSessionTypeOrmDto {
  userId: string;
  deviceId: string;
  deviceName: string;
  ip: string;
  iat: Date;
  exp: Date;
}

// DTO для обновления сессии
export interface UpdateSessionTypeOrmDto {
  iat?: Date;
  exp?: Date;
  deviceName?: string;
  ip?: string;
}

// Тип для возвращаемой сессии (для API)
export interface SessionViewData {
  id: number;
  userId: string;
  deviceId: string;
  deviceName: string;
  ip: string;
  iat: Date;
  exp: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Тип для активной сессии устройства (соответствует существующему API)
export interface ActiveDeviceSessionData {
  deviceId: string;
  deviceName: string; // было title в старой версии
  ip: string;
  lastActiveDate: Date;
}

// Тип для SessionViewDto (соответствует существующему API)
export interface SessionViewDto {
  deviceId: string;
  ip: string;
  lastActiveDate: Date;
  title: string; // deviceName
}

// Фильтры для поиска сессий
export interface SessionSearchFilters {
  userId?: string;
  deviceId?: string;
  isActive?: boolean;
  expiredBefore?: Date;
  expiredAfter?: Date;
}

// Опции сортировки сессий
export interface SessionSortOptions {
  sortBy: keyof SessionTypeOrmEntity;
  sortDirection: 'ASC' | 'DESC';
}

// Опции пагинации сессий
export interface SessionPaginationOptions {
  page: number;
  pageSize: number;
}

// Результат с пагинацией
export interface PaginatedSessionsResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  pagesCount: number;
}

// DTO для аутентификации
export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
}

// DTO для валидации токена
export interface ValidateTokenDto {
  userId: string;
  deviceId: string;
  iat: Date;
  exp: Date;
}

// DTO для создания токенов
export interface CreateTokensDto {
  userId: string;
  deviceId: string;
  deviceName: string;
  ip: string;
}

// DTO для обновления токенов
export interface RefreshTokensDto {
  userId: string;
  deviceId: string;
  oldRefreshToken: string;
} 