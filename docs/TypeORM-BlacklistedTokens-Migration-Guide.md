# TypeORM Blacklisted Refresh Tokens Migration Guide

## Обзор

Этот документ описывает полную миграцию функциональности черного списка рефреш токенов с Mongoose на TypeORM, обеспечивая абсолютную совместимость с существующим API.

## Структура базы данных

### Таблица `refresh_tokens_black_list`

```sql
CREATE TABLE refresh_tokens_black_list (
    id SERIAL PRIMARY KEY,
    token VARCHAR,
    created_at TIMESTAMPTZ DEFAULT CURRENT_DATE
);
```

## Компоненты миграции

### 1. Entity

#### `BlacklistedRefreshTokenTypeOrmEntity`
```typescript
@Entity('refresh_tokens_black_list')
export class BlacklistedRefreshTokenTypeOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  token: string;

  @CreateDateColumn({ 
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_DATE'
  })
  created_at: Date;
}
```

### 2. Types

#### `blacklisted-refresh-token-typeorm.types.ts`
- `CreateBlacklistedTokenTypeOrmDto` - для создания новой записи
- `BlacklistedTokenViewData` - для отображения данных

### 3. Repository (Запись)

#### `BlacklistedRefreshTokenTypeOrmRepository`
**Основные методы:**
- `save(token: string)` - добавление токена в черный список
- `doesExist(token: string)` - проверка наличия токена в черном списке
- `deleteToken(token: string)` - удаление токена из черного списка
- `findByToken(token: string)` - поиск токена
- `getAllTokens()` - получение всех токенов
- `deleteExpiredTokens(beforeDate: Date)` - очистка устаревших токенов

### 4. Query Repository (Чтение)

#### `BlacklistedRefreshTokenTypeOrmQueryRepository`
**Основные методы:**
- `isTokenBlacklisted(token: string)` - проверка токена
- `getTokenById(id: number)` - получение токена по ID
- `getAllBlacklistedTokens()` - получение всех токенов с форматированием
- `getTokensCount()` - подсчет количества токенов
- `findTokensByDateRange()` - поиск токенов по диапазону дат

### 5. Guards и Strategies

#### `RefreshTokenTypeOrmStrategy`
- Passport стратегия для валидации refresh токенов
- Проверяет токен в черном списке через TypeORM репозиторий
- Валидирует сессии через `SessionTypeOrmQueryRepository`

#### `RefreshTokenTypeOrmGuard`
- AuthGuard для защиты эндпоинтов
- Использует `RefreshTokenTypeOrmStrategy`

### 6. Интеграция с сервисами

#### `AuthTypeOrmService`
```typescript
// Обновленный импорт
import { BlacklistedRefreshTokenTypeOrmRepository } from '...';

// В конструкторе
private readonly refreshTokenRepository: BlacklistedRefreshTokenTypeOrmRepository

// Использование
await this.refreshTokenRepository.save(oldRefreshToken);
const isBlacklisted = await this.refreshTokenRepository.doesExist(token);
```

### 7. Контроллеры

#### Обновленные Guards
```typescript
// AuthTypeOrmController
@UseGuards(RefreshTokenTypeOrmGuard)
@Post('refresh-token')
async refreshToken() { ... }

@UseGuards(RefreshTokenTypeOrmGuard)
@Post('logout')
async logout() { ... }

// SessionTypeOrmController
@UseGuards(RefreshTokenTypeOrmGuard)
@Get()
async getAllActiveDevices() { ... }
```

## Сравнение с оригинальной реализацией

### Полная совместимость API
✅ **Методы репозитория**: `save()`, `doesExist()` - идентичные сигнатуры
✅ **Логика валидации**: полностью сохранена
✅ **Обработка ошибок**: те же исключения
✅ **Структура ответов**: неизменная

### Улучшения TypeORM
🚀 **Дополнительные методы**: `deleteToken()`, `findByToken()`, `deleteExpiredTokens()`
🚀 **Query методы**: расширенные возможности поиска и фильтрации
🚀 **Type safety**: полная типизация TypeScript
🚀 **Query Builder**: для сложных запросов

## Использование

### Базовые операции

```typescript
// Добавление токена в черный список
await blacklistedTokenRepository.save(refreshToken);

// Проверка токена
const isBlacklisted = await blacklistedTokenRepository.doesExist(token);

// Удаление токена
await blacklistedTokenRepository.deleteToken(token);
```

### Административные операции

```typescript
// Получение всех токенов для администрирования
const tokens = await blacklistedTokenQueryRepository.getAllBlacklistedTokens();

// Очистка устаревших токенов (например, старше 30 дней)
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
await blacklistedTokenRepository.deleteExpiredTokens(thirtyDaysAgo);

// Подсчет токенов в черном списке
const count = await blacklistedTokenQueryRepository.getTokensCount();
```

## Модуль конфигурация

### `UserAccountsTypeOrmModule`

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([
      BlacklistedRefreshTokenTypeOrmEntity
    ]),
    // ... other imports
  ],
  providers: [
    BlacklistedRefreshTokenTypeOrmRepository,
    BlacklistedRefreshTokenTypeOrmQueryRepository,
    RefreshTokenTypeOrmStrategy,
    // ... other providers
  ],
  exports: [
    BlacklistedRefreshTokenTypeOrmRepository,
    BlacklistedRefreshTokenTypeOrmQueryRepository,
    // ... other exports
  ],
})
```

## Тестирование

### Unit тесты

```typescript
describe('BlacklistedRefreshTokenTypeOrmRepository', () => {
  it('should save token to blacklist', async () => {
    await repository.save('test-token');
    const exists = await repository.doesExist('test-token');
    expect(exists).toBe(true);
  });

  it('should return false for non-existent token', async () => {
    const exists = await repository.doesExist('non-existent-token');
    expect(exists).toBe(false);
  });
});
```

### Integration тесты

```typescript
describe('AuthTypeOrmController refresh-token', () => {
  it('should reject blacklisted refresh token', async () => {
    // Добавляем токен в черный список
    await blacklistedTokenRepository.save(refreshToken);
    
    // Попытка использовать заблокированный токен
    const response = await request(app)
      .post('/auth-typeorm/refresh-token')
      .set('Cookie', `refreshToken=${refreshToken}`);
      
    expect(response.status).toBe(401);
  });
});
```

## Безопасность

### Лучшие практики
1. **Автоматическая очистка**: регулярное удаление устаревших токенов
2. **Логирование**: отслеживание попыток использования заблокированных токенов
3. **Мониторинг**: контроль размера черного списка

### Производительность
- **Индексы**: создание индекса по полю `token` для быстрого поиска
- **Архивирование**: периодическое архивирование старых записей
- **Кэширование**: возможность добавления Redis кэша для частых проверок

## Заключение

Миграция черного списка рефреш токенов на TypeORM обеспечивает:
- ✅ **100% совместимость** с существующим API
- 🚀 **Расширенные возможности** для администрирования
- 🔒 **Улучшенную безопасность** типизации
- ⚡ **Лучшую производительность** через TypeORM оптимизации

Новая реализация готова для production использования и может быть развернута параллельно с существующей системой для постепенной миграции. 