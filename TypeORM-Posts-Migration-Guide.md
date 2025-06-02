# TypeORM Posts Migration Guide

## Обзор

Данная миграция создает полноценную TypeORM инфраструктуру для работы с постами и их лайками, работающую параллельно с существующей raw SQL реализацией. Включает связи с блогами и полную поддержку системы лайков.

## Архитектура

### Domain Layer
- `PostTypeOrm` - TypeORM entity для таблицы posts
- `PostLikeTypeOrm` - TypeORM entity для таблицы post_likes
- `PostTypeOrmFactory` - Factory методы для создания инстансов постов и лайков
- `post-typeorm.types.ts` - TypeScript интерфейсы и DTO

### Infrastructure Layer
- `PostsTypeOrmRepository` - Command repository для CRUD операций с постами и лайками
- `PostsTypeOrmQueryRepository` - Query repository для чтения данных с поддержкой лайков

### Application Layer
- `PostsTypeOrmService` - Бизнес-логика для постов

### API Layer
- `PostsSaTypeOrmController` - Super Admin REST API контроллер
- `PostsPublicTypeOrmController` - Публичный REST API контроллер

## Структура базы данных

### Таблица posts
```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    title VARCHAR NOT NULL,
    short_description VARCHAR NOT NULL,
    content VARCHAR NOT NULL,
    blog_id UUID NOT NULL REFERENCES blogs(id) ON DELETE CASCADE
);
```

### Таблица post_likes
```sql
CREATE TABLE post_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    login VARCHAR NOT NULL,
    status VARCHAR NOT NULL CHECK (status IN ('Like', 'Dislike', 'None')),
    added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Связи между сущностями

### Blog ↔ Post (One-to-Many)
```typescript
// BlogTypeOrm
@OneToMany(() => PostTypeOrm, post => post.blog, { cascade: true })
posts: PostTypeOrm[];

// PostTypeOrm
@ManyToOne(() => BlogTypeOrm, blog => blog.posts, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'blog_id' })
blog: BlogTypeOrm;
```

### Post ↔ PostLike (One-to-Many)
```typescript
// PostTypeOrm
@OneToMany(() => PostLikeTypeOrm, like => like.post, { cascade: true })
likes: PostLikeTypeOrm[];

// PostLikeTypeOrm
@ManyToOne(() => PostTypeOrm, post => post.likes, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'post_id' })
post: PostTypeOrm;
```

## Новые эндпоинты

### Super Admin эндпоинты (требуют Basic Auth)
Префикс: `/sa/posts-typeorm`

- `GET /sa/posts-typeorm` - Получить все посты с пагинацией и сортировкой
- `POST /sa/posts-typeorm` - Создать новый пост
- `PUT /sa/posts-typeorm/:id` - Обновить пост
- `DELETE /sa/posts-typeorm/:id` - Удалить пост

### Публичные эндпоинты
Префикс: `/posts-typeorm`

- `GET /posts-typeorm` - Получить все посты (публично, с лайками)
- `GET /posts-typeorm/:id` - Получить пост по ID (публично, с лайками)
- `GET /posts-typeorm/:id/comments` - Получить комментарии поста *(TODO: требует миграции комментариев)*
- `POST /posts-typeorm` - Создать пост (Basic Auth)
- `PUT /posts-typeorm/:id` - Обновить пост (Basic Auth)
- `DELETE /posts-typeorm/:id` - Удалить пост (Basic Auth)
- `PUT /posts-typeorm/:id/like-status` - Обновить статус лайка (JWT Auth)
- `POST /posts-typeorm/:id/comments` - Создать комментарий *(TODO: требует миграции комментариев)*

### Обновленные эндпоинты блогов
Префикс: `/blogs-typeorm` и `/sa/blogs-typeorm`

- `GET /blogs-typeorm/:id/posts` - Получить посты блога (публично, с лайками)
- `POST /blogs-typeorm/:id/posts` - Создать пост для блога (Basic Auth)
- `GET /sa/blogs-typeorm/:blogId/posts` - Получить посты блога (SA)
- `POST /sa/blogs-typeorm/:blogId/posts` - Создать пост для блога (SA)
- `PUT /sa/blogs-typeorm/:blogId/posts/:postId` - Обновить пост блога (SA)
- `DELETE /sa/blogs-typeorm/:blogId/posts/:postId` - Удалить пост блога (SA)

## Ключевые особенности

### 1. TypeORM Entities с связями
```typescript
@Entity('posts')
export class PostTypeOrm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @Column({ type: 'varchar', nullable: false })
  title: string;

  @Column({ name: 'short_description', type: 'varchar', nullable: false })
  shortDescription: string;

  @Column({ type: 'varchar', nullable: false })
  content: string;

  @Column({ name: 'blog_id', type: 'uuid', nullable: false })
  blogId: string;

  // Relations
  @ManyToOne(() => BlogTypeOrm, blog => blog.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blog_id' })
  blog: BlogTypeOrm;

  @OneToMany(() => PostLikeTypeOrm, like => like.post, { cascade: true })
  likes: PostLikeTypeOrm[];
}
```

### 2. Система лайков
- Поддержка статусов: `Like`, `Dislike`, `None`
- Подсчет лайков и дизлайков
- Отображение статуса текущего пользователя
- Показ 3 последних лайков с информацией о пользователях

### 3. Связи Blog-Post
- Каскадное удаление постов при удалении блога
- Автоматическая проверка существования блога при создании поста
- Получение постов по ID блога с пагинацией

### 4. Валидация и безопасность
- Проверка существования блога при операциях с постами
- Проверка существования поста при операциях с лайками
- Правильная авторизация для разных типов операций

## Тестирование

### SA эндпоинты (с Basic Auth)

#### Создание поста
```bash
POST /sa/posts-typeorm
Authorization: Basic <base64-encoded-credentials>
Content-Type: application/json

{
  "title": "Test Post",
  "shortDescription": "Test Description",
  "content": "Test Content",
  "blogId": "blog-uuid-here"
}
```

#### Получение всех постов
```bash
GET /sa/posts-typeorm?sortBy=createdAt&sortDirection=desc&pageNumber=1&pageSize=10
Authorization: Basic <base64-encoded-credentials>
```

### Публичные эндпоинты

#### Получение всех постов (с лайками)
```bash
GET /posts-typeorm?sortBy=createdAt&sortDirection=desc&pageNumber=1&pageSize=10
Authorization: Bearer <jwt-token> # опционально для получения myStatus
```

#### Обновление статуса лайка
```bash
PUT /posts-typeorm/{postId}/like-status
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "likeStatus": "Like"
}
```

### Эндпоинты блогов с постами

#### Получение постов блога
```bash
GET /blogs-typeorm/{blogId}/posts?sortBy=createdAt&sortDirection=desc&pageNumber=1&pageSize=10
Authorization: Bearer <jwt-token> # опционально для получения myStatus
```

#### Создание поста для блога
```bash
POST /blogs-typeorm/{blogId}/posts
Authorization: Basic <base64-encoded-credentials>
Content-Type: application/json

{
  "title": "Blog Post",
  "shortDescription": "Blog Post Description",
  "content": "Blog Post Content"
}
```

## Статус миграции

### ✅ Готово
- [x] PostTypeOrm entity с связями
- [x] PostLikeTypeOrm entity
- [x] PostsTypeOrmRepository (CRUD + лайки)
- [x] PostsTypeOrmQueryRepository (чтение с лайками)
- [x] PostsTypeOrmService (бизнес-логика)
- [x] PostsSaTypeOrmController (SA эндпоинты)
- [x] PostsPublicTypeOrmController (публичные эндпоинты)
- [x] PostsTypeOrmModule (модуль)
- [x] Интеграция с BlogsTypeOrm (связи Blog-Post)
- [x] Обновленные контроллеры блогов для работы с постами
- [x] Система лайков с подсчетом и статусами
- [x] Поддержка newest likes (3 последних лайка)

### ⏳ TODO (требует миграции комментариев)
- [ ] Операции с комментариями в постах
- [ ] Связи Post-Comment
- [ ] Use cases с CQRS pattern

## Преимущества TypeORM версии

1. **Типобезопасность** - Полная типизация на всех уровнях
2. **Связи между сущностями** - Автоматическое управление связями Blog-Post
3. **Каскадные операции** - Автоматическое удаление постов при удалении блога
4. **Оптимизированные запросы** - Эффективные запросы с JOIN для получения данных блога
5. **Система лайков** - Полная поддержка лайков с подсчетом и статусами
6. **Валидация** - Автоматическая проверка ограничений на уровне базы данных

## Следующие шаги

1. **Тестирование постов**
   - Тестирование всех SA эндпоинтов
   - Тестирование всех публичных эндпоинтов
   - Тестирование системы лайков
   - Тестирование связей Blog-Post
   
2. **Миграция комментариев на TypeORM**
   - Создание CommentTypeOrm entity
   - Реализация связей Post-Comment
   - Миграция комментариев контроллеров
   
3. **Создание связей между всеми сущностями**
   - OneToMany: Post -> Comments
   - ManyToOne: Comment -> Post
   - Система лайков для комментариев
   
4. **Поэтапный переход**
   - Постепенный переход с raw SQL на TypeORM
   - Удаление legacy кода после полного перехода 