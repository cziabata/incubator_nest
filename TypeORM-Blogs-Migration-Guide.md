# TypeORM Blogs Migration Guide

## Обзор

Данная миграция создает полноценную TypeORM инфраструктуру для работы с блогами, работающую параллельно с существующей raw SQL реализацией.

## Архитектура

### Domain Layer
- `BlogTypeOrm` - TypeORM entity для таблицы blogs
- `BlogTypeOrmFactory` - Factory методы для создания инстансов блогов
- `blog-typeorm.types.ts` - TypeScript интерфейсы и DTO

### Infrastructure Layer
- `BlogsTypeOrmRepository` - Command repository для CRUD операций
- `BlogsTypeOrmQueryRepository` - Query repository для чтения данных

### Application Layer
- `BlogsTypeOrmService` - Бизнес-логика для блогов

### API Layer
- `BlogsSaTypeOrmController` - Super Admin REST API контроллер
- `BlogsPublicTypeOrmController` - Публичный REST API контроллер

## Структура базы данных

```sql
CREATE TABLE blogs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    name VARCHAR NOT NULL,
    description VARCHAR NOT NULL,
    website_url VARCHAR NOT NULL,
    is_membership BOOLEAN NOT NULL DEFAULT false
);
```

## Новые эндпоинты

### Super Admin эндпоинты (требуют Basic Auth)
Префикс: `/sa/blogs-typeorm`

- `GET /sa/blogs-typeorm` - Получить все блоги с пагинацией и фильтрацией
- `POST /sa/blogs-typeorm` - Создать новый блог
- `PUT /sa/blogs-typeorm/:id` - Обновить блог
- `DELETE /sa/blogs-typeorm/:id` - Удалить блог
- `POST /sa/blogs-typeorm/:blogId/posts` - Создать пост для блога *(TODO: требует миграции постов)*
- `GET /sa/blogs-typeorm/:blogId/posts` - Получить посты блога *(TODO: требует миграции постов)*
- `PUT /sa/blogs-typeorm/:blogId/posts/:postId` - Обновить пост блога *(TODO: требует миграции постов)*
- `DELETE /sa/blogs-typeorm/:blogId/posts/:postId` - Удалить пост блога *(TODO: требует миграции постов)*

### Публичные эндпоинты
Префикс: `/blogs-typeorm`

- `GET /blogs-typeorm` - Получить все блоги (публично)
- `GET /blogs-typeorm/:id` - Получить блог по ID (публично)
- `GET /blogs-typeorm/:id/posts` - Получить посты блога *(TODO: требует миграции постов)*
- `POST /blogs-typeorm` - Создать блог (Basic Auth)
- `POST /blogs-typeorm/:id/posts` - Создать пост для блога *(TODO: требует миграции постов)*
- `POST /blogs-typeorm/:blogId/posts` - Создать пост для блога (дубликат) *(TODO: требует миграции постов)*
- `PUT /blogs-typeorm/:id` - Обновить блог (Basic Auth)
- `DELETE /blogs-typeorm/:id` - Удалить блог (Basic Auth)

## Ключевые особенности

### 1. TypeORM Entity
```typescript
@Entity('blogs')
export class BlogTypeOrm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'varchar', nullable: false })
  description: string;

  @Column({ name: 'website_url', type: 'varchar', nullable: false })
  websiteUrl: string;

  @Column({ name: 'is_membership', type: 'boolean', default: false, nullable: false })
  isMembership: boolean;
}
```

### 2. Двойная реализация контроллеров
- **SA Controller** - `/sa/blogs-typeorm` (аналог оригинального `BlogsSaController`)
- **Public Controller** - `/blogs-typeorm` (аналог оригинального `BlogsController`)

### 3. Repository Pattern
- Использует TypeORM Repository для типобезопасных операций
- Автоматическое управление транзакциями
- QueryBuilder для сложных запросов

### 4. Фильтрация и сортировка
- Поиск по названию блога (ILIKE)
- Сортировка по createdAt и name
- Пагинация

### 5. Валидация
- Автоматическая проверка существования блога
- Типобезопасные DTO

## Тестирование

### SA эндпоинты (с Basic Auth)

#### Создание блога
```bash
POST /sa/blogs-typeorm
Authorization: Basic <base64-encoded-credentials>
Content-Type: application/json

{
  "name": "Test Blog",
  "description": "Test Description",
  "websiteUrl": "https://example.com"
}
```

#### Получение всех блогов
```bash
GET /sa/blogs-typeorm?searchNameTerm=test&sortBy=name&sortDirection=asc&pageNumber=1&pageSize=10
Authorization: Basic <base64-encoded-credentials>
```

### Публичные эндпоинты

#### Получение всех блогов (публично)
```bash
GET /blogs-typeorm?searchNameTerm=test&sortBy=name&sortDirection=asc&pageNumber=1&pageSize=10
```

#### Получение блога по ID (публично)
```bash
GET /blogs-typeorm/{blogId}
```

#### Создание блога (с Basic Auth)
```bash
POST /blogs-typeorm
Authorization: Basic <base64-encoded-credentials>
Content-Type: application/json

{
  "name": "Public Test Blog",
  "description": "Public Test Description",
  "websiteUrl": "https://public-example.com"
}
```

## Статус миграции

### ✅ Готово
- [x] BlogTypeOrm entity
- [x] BlogsTypeOrmRepository (CRUD)
- [x] BlogsTypeOrmQueryRepository (чтение с фильтрацией)
- [x] BlogsTypeOrmService (бизнес-логика)
- [x] BlogsSaTypeOrmController (SA эндпоинты)
- [x] BlogsPublicTypeOrmController (публичные эндпоинты)
- [x] BlogsTypeOrmModule (модуль)

### ⏳ TODO (требует миграции постов)
- [ ] Операции с постами в блогах
- [ ] Связи между блогами и постами
- [ ] Use cases с CQRS pattern

## Преимущества TypeORM версии

1. **Типобезопасность** - Полная типизация на уровне TypeScript
2. **Автоматические миграции** - TypeORM может генерировать миграции
3. **Связи** - Легкое управление связями между сущностями
4. **Кэширование** - Встроенные возможности кэширования
5. **Валидация** - Автоматическая валидация на уровне entity
6. **Транзакции** - Простое управление транзакциями

## Следующие шаги

1. **Тестирование блогов**
   - Тестирование всех SA эндпоинтов
   - Тестирование всех публичных эндпоинтов
   
2. **Миграция постов на TypeORM**
   - Создание PostTypeOrm entity
   - Реализация связей Blog-Post
   - Миграция постов контроллеров
   
3. **Создание связей между сущностями**
   - OneToMany: Blog -> Posts
   - ManyToOne: Post -> Blog
   
4. **Поэтапный переход**
   - Постепенный переход с raw SQL на TypeORM
   - Удаление legacy кода после полного перехода 