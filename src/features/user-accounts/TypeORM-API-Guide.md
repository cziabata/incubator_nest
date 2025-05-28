# TypeORM Users API Guide

## Обзор

TypeORM версия Users API доступна по префиксу `/sa/users-typeorm` для тестирования и сравнения с оригинальной версией `/sa/users`.

## Эндпоинты

### Основные CRUD операции (совместимы с оригинальным API)

#### GET /sa/users-typeorm
Получить список пользователей с пагинацией и поиском.

**Query параметры:**
- `pageNumber` (number, default: 1) - номер страницы
- `pageSize` (number, default: 10) - размер страницы
- `sortBy` (string, default: 'id') - поле для сортировки
- `sortDirection` (string, default: 'desc') - направление сортировки (asc/desc)
- `searchLoginTerm` (string, optional) - поиск по логину
- `searchEmailTerm` (string, optional) - поиск по email

**Пример:**
```
GET /api/sa/users-typeorm?pageNumber=1&pageSize=5&searchLoginTerm=test
```

#### GET /sa/users-typeorm/:id
Получить пользователя по ID.

**Пример:**
```
GET /api/sa/users-typeorm/123e4567-e89b-12d3-a456-426614174000
```

#### POST /sa/users-typeorm
Создать нового пользователя.

**Body:**
```json
{
  "login": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

#### PUT /sa/users-typeorm/:id
Обновить пользователя.

**Body:**
```json
{
  "email": "newemail@example.com"
}
```

#### DELETE /sa/users-typeorm/:id
Мягкое удаление пользователя.

### Дополнительные эндпоинты (специфичные для TypeORM)

#### POST /sa/users-typeorm/:id/confirm-email
Подтвердить email пользователя.

**Пример:**
```
POST /api/sa/users-typeorm/123e4567-e89b-12d3-a456-426614174000/confirm-email
```

#### POST /sa/users-typeorm/:id/update-confirmation-code
Обновить код подтверждения.

**Body:**
```json
{
  "confirmationCode": "new-confirmation-code-123",
  "expirationDate": "2024-12-31T23:59:59.000Z"
}
```

#### POST /sa/users-typeorm/:id/reset-confirmation
Сбросить подтверждение и обновить код.

**Body:**
```json
{
  "confirmationCode": "new-confirmation-code-456",
  "expirationDate": "2024-12-31T23:59:59.000Z"
}
```

#### POST /sa/users-typeorm/:id/update-password
Обновить пароль и подтвердить email.

**Body:**
```json
{
  "newPassword": "newpassword123"
}
```

### Поиск пользователей

#### GET /sa/users-typeorm/by-login/:login
Найти пользователя по логину.

**Пример:**
```
GET /api/sa/users-typeorm/by-login/testuser
```

#### GET /sa/users-typeorm/by-email/:email
Найти пользователя по email.

**Пример:**
```
GET /api/sa/users-typeorm/by-email/test@example.com
```

#### GET /sa/users-typeorm/by-confirmation-code/:code
Найти пользователя по коду подтверждения.

**Пример:**
```
GET /api/sa/users-typeorm/by-confirmation-code/confirmation-code-123
```

### Проверка существования

#### GET /sa/users-typeorm/check/login-exists/:login
Проверить существование логина.

**Ответ:**
```json
{
  "exists": true
}
```

#### GET /sa/users-typeorm/check/email-exists/:email
Проверить существование email.

**Ответ:**
```json
{
  "exists": false
}
```

## Отличия от оригинального API

### Преимущества TypeORM версии:
1. **Строгая типизация** - все операции типизированы
2. **Query Builder** - более эффективные запросы
3. **Доменные методы** - бизнес-логика в entity
4. **Транзакции** - автоматическая поддержка транзакций
5. **Дополнительные эндпоинты** - расширенная функциональность

### Совместимость:
- ✅ Полная совместимость с существующими клиентами
- ✅ Тот же формат ответов
- ✅ Те же коды статусов
- ✅ Та же валидация входных данных

## Тестирование

### Базовые операции
```bash
# Создание пользователя
curl -X POST http://localhost:3000/api/sa/users-typeorm \
  -H "Content-Type: application/json" \
  -d '{"login":"testuser","email":"test@example.com","password":"password123"}'

# Получение пользователей
curl http://localhost:3000/api/sa/users-typeorm

# Получение пользователя по ID
curl http://localhost:3000/api/sa/users-typeorm/{user-id}

# Обновление пользователя
curl -X PUT http://localhost:3000/api/sa/users-typeorm/{user-id} \
  -H "Content-Type: application/json" \
  -d '{"email":"updated@example.com"}'

# Удаление пользователя
curl -X DELETE http://localhost:3000/api/sa/users-typeorm/{user-id}
```

### Расширенные операции
```bash
# Подтверждение email
curl -X POST http://localhost:3000/api/sa/users-typeorm/{user-id}/confirm-email

# Проверка существования логина
curl http://localhost:3000/api/sa/users-typeorm/check/login-exists/testuser

# Поиск по логину
curl http://localhost:3000/api/sa/users-typeorm/by-login/testuser
```

## Производительность

TypeORM версия должна показывать:
- ⚡ Быстрее выполнение сложных запросов
- 💾 Меньше потребление памяти
- 🔄 Лучшая обработка транзакций
- 📊 Более эффективная пагинация

## Следующие шаги

1. Протестировать все эндпоинты
2. Сравнить производительность с оригинальной версией
3. Проверить совместимость с существующими клиентами
4. При успешном тестировании - начать миграцию сервисов 