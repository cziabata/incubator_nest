# TypeORM Migration Guide for User Accounts

## Обзор

Данная документация описывает процесс миграции пользователей с Mongoose на TypeORM. Миграция выполняется поэтапно для минимизации рисков.

## Созданные файлы

### 1. Entity и типы
- `domain/user-typeorm.entity.ts` - TypeORM entity для пользователей
- `domain/types/user-typeorm.types.ts` - Типы и интерфейсы для TypeORM
- `domain/user-typeorm.factory.ts` - Фабрика для создания пользователей

### 2. Репозитории
- `infrastructure/users-typeorm.repository.ts` - Основной репозиторий для операций записи
- `infrastructure/query/users-typeorm.query-repository.ts` - Query репозиторий для операций чтения

### 3. Модуль
- `user-accounts-typeorm.module.ts` - Отдельный модуль для TypeORM entities

## Структура TypeORM Entity

```typescript
@Entity('users')
export class UserTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  login: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar' })
  passwordHash: string;

  // Note: keeping the typo 'emai' to match existing database schema
  @Column({ name: 'is_emai_confirmed', type: 'boolean', default: false })
  isEmailConfirmed: boolean;

  @Column({ name: 'confirmation_code', type: 'varchar', nullable: true })
  confirmationCode: string | null;

  @Column({ name: 'expiration_date', type: 'timestamp with time zone', nullable: true })
  expirationDate: Date | null;

  @Column({ name: 'first_name', type: 'varchar', nullable: true })
  firstName: string | null;

  @Column({ name: 'last_name', type: 'varchar', nullable: true })
  lastName: string | null;

  @Column({ name: 'deleted_at', type: 'timestamp with time zone', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
```

## Основные отличия от Mongoose версии

1. **Структура полей**: Поля `firstName` и `lastName` теперь на верхнем уровне entity, а не вложены в объект `name`
2. **Методы домена**: Добавлены методы для работы с entity (`makeDeleted()`, `updateEmail()`, etc.)
3. **Типизация**: Строгая типизация с TypeScript интерфейсами
4. **Репозитории**: Разделение на command и query репозитории

## План миграции

### Этап 1: Подготовка (Выполнен)
- ✅ Создание TypeORM entity
- ✅ Создание типов и интерфейсов
- ✅ Создание репозиториев
- ✅ Создание отдельного модуля

### Этап 2: Тестирование (Следующий шаг)
- [ ] Добавление TypeORM модуля в основной модуль приложения
- [ ] Создание тестов для TypeORM репозиториев
- [ ] Проверка совместимости с существующей БД

### Этап 3: Постепенная замена
- [ ] Создание adapter для плавного перехода
- [ ] Замена в сервисах по одному
- [ ] Тестирование каждого замененного компонента

### Этап 4: Финализация
- [ ] Удаление Mongoose dependencies
- [ ] Очистка старого кода
- [ ] Обновление документации

## Использование TypeORM репозиториев

### Основной репозиторий (Command operations)

```typescript
// Внедрение зависимости
constructor(
  private readonly usersTypeOrmRepository: UsersTypeOrmRepository,
) {}

// Создание пользователя
const userId = await this.usersTypeOrmRepository.createUser({
  login: 'testuser',
  email: 'test@example.com',
  passwordHash: 'hashedPassword',
  firstName: 'Test',
  lastName: 'User',
});

// Поиск пользователя
const user = await this.usersTypeOrmRepository.findById(userId);

// Обновление пользователя
await this.usersTypeOrmRepository.updateUser(userId, {
  email: 'newemail@example.com',
});

// Мягкое удаление
await this.usersTypeOrmRepository.softDeleteUser(userId);
```

### Query репозиторий (Read operations)

```typescript
// Внедрение зависимости
constructor(
  private readonly usersTypeOrmQueryRepository: UsersTypeOrmQueryRepository,
) {}

// Получение пользователя для отображения
const userView = await this.usersTypeOrmQueryRepository.getByIdOrNotFoundFail(userId);

// Получение списка пользователей с пагинацией
const paginatedUsers = await this.usersTypeOrmQueryRepository.getAll(queryParams);

// Поиск с кастомными фильтрами
const users = await this.usersTypeOrmQueryRepository.getAllWithFilters(
  { searchLoginTerm: 'test' },
  { sortBy: 'createdAt', sortDirection: 'DESC' },
  { page: 1, pageSize: 10 },
);
```

## Фабрика пользователей

```typescript
// Создание пользователя для регистрации
const user = UserTypeOrmFactory.createUserForRegistration(
  'testuser',
  'test@example.com',
  'hashedPassword',
  'confirmationCode123',
  new Date(Date.now() + 24 * 60 * 60 * 1000), // expires in 24 hours
  'Test',
  'User'
);

// Создание подтвержденного пользователя
const confirmedUser = UserTypeOrmFactory.createConfirmedUser(
  'confirmeduser',
  'confirmed@example.com',
  'hashedPassword',
  'Confirmed',
  'User'
);

// Миграция из Mongoose
const typeOrmUser = UserTypeOrmFactory.createFromMongooseUser(mongooseUser);
```

## Подключение к основному приложению

Для подключения TypeORM модуля добавьте в основной модуль:

```typescript
import { UserAccountsTypeOrmModule } from './features/user-accounts/user-accounts-typeorm.module';

@Module({
  imports: [
    // ... другие импорты
    UserAccountsTypeOrmModule,
  ],
  // ...
})
export class AppModule {}
```

## Важные замечания

1. **Совместимость БД**: Entity создана с учетом существующей структуры PostgreSQL таблицы
2. **Опечатка в поле**: Поле `is_emai_confirmed` сохранено как есть для совместимости
3. **Soft Delete**: Используется поле `deletedAt` для мягкого удаления
4. **Транзакции**: TypeORM репозитории поддерживают транзакции из коробки
5. **Валидация**: Рекомендуется добавить class-validator декораторы при необходимости

## Следующие шаги

1. Добавить TypeORM модуль в основное приложение
2. Создать тесты для новых репозиториев
3. Начать замену в сервисах по одному
4. Мониторить производительность и совместимость 