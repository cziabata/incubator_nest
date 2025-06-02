# TypeORM Comments Migration Guide

## Обзор

Данная миграция создает полноценную TypeORM инфраструктуру для работы с комментариями и их лайками, работающую параллельно с существующей Mongoose реализацией. Включает связи с постами и полную поддержку системы лайков.

## Архитектура

### Domain Layer
- `CommentTypeOrm` - TypeORM entity для таблицы comments
- `CommentLikeTypeOrm` - TypeORM entity для таблицы comment_likes
- `CommentTypeOrmFactory` - Factory методы для создания инстансов комментариев и лайков
- `comment-typeorm.types.ts` - TypeScript интерфейсы и DTO

### Infrastructure Layer
- `CommentsTypeOrmRepository` - Command repository для CRUD операций с комментариями и лайками
- `CommentsTypeOrmQueryRepository` - Query repository для чтения данных с поддержкой лайков

### Application Layer
- `CommentsTypeOrmService` - Бизнес-логика для комментариев

### API Layer
- `CommentsTypeOrmController` - REST API контроллер (без префиксов, как в оригинале)

## Структура базы данных

### Таблица comments
```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    content TEXT NOT NULL,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_login VARCHAR(255) NOT NULL
);
```

### Таблица comment_likes
```sql
CREATE TABLE comment_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('Like', 'Dislike', 'None')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Связи между сущностями

### Post ↔ Comment (One-to-Many)
```typescript
// PostTypeOrm
@OneToMany(() => CommentTypeOrm, comment => comment.post, { cascade: true })
comments: CommentTypeOrm[];

// CommentTypeOrm
@ManyToOne(() => PostTypeOrm, post => post.comments, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'post_id' })
post: PostTypeOrm;
```

### Comment ↔ CommentLike (One-to-Many)
```typescript
// CommentTypeOrm
@OneToMany(() => CommentLikeTypeOrm, like => like.comment, { cascade: true })
likes: CommentLikeTypeOrm[];

// CommentLikeTypeOrm
@ManyToOne(() => CommentTypeOrm, comment => comment.likes, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'comment_id' })
comment: CommentTypeOrm;
```

## Эндпоинты комментариев

### Публичные эндпоинты
Префикс: `/comments`

- `GET /comments/:id` - Получить комментарий по ID (публично, с лайками, JWT optional)
- `PUT /comments/:commentId` - Обновить комментарий (JWT Auth, только свой)
- `DELETE /comments/:commentId` - Удалить комментарий (JWT Auth, только свой)
- `PUT /comments/:commentId/like-status` - Обновить статус лайка (JWT Auth)

### Интеграция с постами
Префикс: `/posts`

- `GET /posts/:id/comments` - Получить комментарии поста (публично, с лайками)
- `POST /posts/:id/comments` - Создать комментарий для поста (JWT Auth)

## Ключевые особенности

### 1. TypeORM Entities с связями
```typescript
@Entity('comments')
export class CommentTypeOrm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @Column({ type: 'text', nullable: false })
  content: string;

  @Column({ name: 'post_id', type: 'uuid', nullable: false })
  postId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId: string;

  @Column({ name: 'user_login', type: 'varchar', length: 255, nullable: false })
  userLogin: string;

  // Relations
  @ManyToOne(() => PostTypeOrm, post => post.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: PostTypeOrm;

  @OneToMany(() => CommentLikeTypeOrm, like => like.comment, { cascade: true })
  likes: CommentLikeTypeOrm[];
}
```

### 2. Система лайков комментариев
- Поддержка статусов: `Like`, `Dislike`, `None`
- Подсчет лайков и дизлайков
- Отображение статуса текущего пользователя (myStatus)
- Эндпоинт PUT /comments/:commentId/like-status

### 3. Связи Post-Comment
- Каскадное удаление комментариев при удалении поста
- Автоматическая проверка существования поста при создании комментария
- Получение комментариев по ID поста с пагинацией

### 4. Валидация и безопасность
- Проверка существования поста при операциях с комментариями
- Проверка прав доступа (только автор может редактировать/удалять комментарий)
- Правильная авторизация для разных типов операций

## Тестирование

### Публичные эндпоинты

#### Получение комментария по ID
```bash
GET /comments/{commentId}
Authorization: Bearer <jwt-token> # опционально для получения myStatus
```

#### Получение комментариев поста
```bash
GET /posts/{postId}/comments?sortBy=createdAt&sortDirection=desc&pageNumber=1&pageSize=10
Authorization: Bearer <jwt-token> # опционально для получения myStatus
```

#### Создание комментария для поста
```bash
POST /posts/{postId}/comments
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "content": "This is a test comment"
}
```

#### Обновление комментария
```bash
PUT /comments/{commentId}
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "content": "Updated comment content"
}
```

#### Удаление комментария
```bash
DELETE /comments/{commentId}
Authorization: Bearer <jwt-token>
```

#### Обновление статуса лайка комментария
```bash
PUT /comments/{commentId}/like-status
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "likeStatus": "Like"
}
```

## Статус миграции

### ✅ Готово
- [x] CommentTypeOrm entity с связями
- [x] CommentLikeTypeOrm entity
- [x] CommentsTypeOrmRepository (CRUD + лайки)
- [x] CommentsTypeOrmQueryRepository (чтение с лайками)
- [x] CommentsTypeOrmService (бизнес-логика)
- [x] CommentsTypeOrmController (публичные эндпоинты)
- [x] CommentsTypeOrmModule (модуль)
- [x] Интеграция с PostsTypeOrm (связи Post-Comment)
- [x] Обновленный PostsTypeOrmController для работы с комментариями
- [x] Система лайков с подсчетом и статусами
- [x] Проверка прав доступа для редактирования/удаления

### ✅ Интеграция завершена
- [x] Связь PostTypeOrm -> CommentTypeOrm (OneToMany)
- [x] Каскадное удаление комментариев при удалении поста
- [x] Обновленные методы в PostsTypeOrmController для комментариев
- [x] Отключены старые контроллеры комментариев для избежания конфликта роутов

## Преимущества TypeORM версии

1. **Типобезопасность** - Полная типизация на всех уровнях
2. **Связи между сущностями** - Автоматическое управление связями Post-Comment
3. **Каскадные операции** - Автоматическое удаление комментариев при удалении поста
4. **Оптимизированные запросы** - Эффективные запросы с JOIN для получения данных поста
5. **Система лайков** - Полная поддержка лайков с подсчетом и статусами
6. **Валидация** - Автоматическая проверка ограничений на уровне базы данных
7. **Безопасность** - Проверка прав доступа на уровне контроллера

## Следующие шаги

1. **Тестирование комментариев**
   - Тестирование всех эндпоинтов комментариев
   - Тестирование системы лайков комментариев
   - Тестирование связей Post-Comment
   - Тестирование прав доступа
   
2. **Полная интеграция**
   - Тестирование комментариев через посты
   - Проверка каскадных операций
   - Тестирование пагинации и сортировки
   
3. **Поэтапный переход**
   - Постепенный переход с Mongoose на TypeORM
   - Удаление legacy кода после полного перехода
   
4. **Оптимизация**
   - Настройка индексов для быстрого поиска
   - Оптимизация запросов с JOIN
   - Кэширование часто используемых данных

## Результат

Теперь у вас есть полностью функциональная TypeORM версия системы комментариев, которая:
- Работает параллельно с существующей Mongoose версией
- Поддерживает все функции оригинала (комментарии + лайки)
- Имеет те же роуты без префиксов TypeORM
- Интегрирована с системой постов
- Готова к постепенному переходу от старой версии 