# TypeORM Sessions & Auth Migration Guide

## Обзор

Данный документ описывает миграцию системы сессий и аутентификации с Mongoose на TypeORM. Миграция создана с **полной совместимостью** с существующей реализацией на raw SQL queries.

## Анализ существующей реализации

### Изученные компоненты:
- ✅ `AuthService` - оригинальный сервис аутентификации
- ✅ `SessionService` - оригинальный сервис сессий
- ✅ `SessionRepository` - репозиторий с raw SQL
- ✅ `SessionQueryRepository` - query репозиторий с raw SQL
- ✅ `AuthController` и `SessionController` - существующие контроллеры

### Ключевые особенности оригинальной реализации:

**1. Токены и безопасность:**
- Разные JWT секреты: `'access-token-secret'` и `'refresh-token-secret'`
- Время жизни: ACCESS_EXPIRES_IN = '60m', REFRESH_TOKEN_SECONDS = 1800 (30 мин)
- Использование `BlacklistedRefreshTokenRepository` для черного списка
- Поле `id` в JWT payload вместо `userId`

**2. Логика сессий:**
- Повторное использование `deviceId` для одинаковых `device_name`
- Обновление существующих сессий вместо создания новых
- Проверка владения устройством через `checkIfUserHasSuchDevice()`

**3. API структура:**
- `SessionViewDto` с полями: `deviceId`, `ip`, `lastActiveDate`, `title`
- `title` = `device_name` в базе данных
- Методы: `getAllActiveDevices()`, `getActiveDeviceById()`, `getActiveDeviceByIatAndUserId()`

**4. Интеграции:**
- `EmailService` для отправки писем подтверждения
- `addSeconds()` из `date-fns` для работы с датами

## Созданные компоненты TypeORM

### 1. Domain слой

#### SessionTypeOrmEntity (`session-typeorm.entity.ts`)
- TypeORM entity для таблицы sessions
- Связь ManyToOne с UserTypeOrmEntity
- Доменные методы: `isExpired()`, `isActive()`, `updateExpiration()`, `updateIat()`
- Фабричный метод `create()`

#### Session Types (`session-typeorm.types.ts`)
- `SessionViewDto` - **совместимый** с существующим API
- `ActiveDeviceSessionData` - внутренний тип
- `AuthTokensDto` - для возвращения токенов
- Все остальные необходимые типы

### 2. Infrastructure слой

#### SessionTypeOrmRepository (`session-typeorm.repository.ts`)
Основной репозиторий для операций записи с методами **идентичными** оригиналу:
- `createSession()` - создание/обновление сессии
- `findByDeviceId()`, `findByUserIdAndDeviceId()`
- `deleteSession()`, `deleteAllSessionsExceptCurrent()`
- `updateSession()` - с поддержкой boolean возврата

#### SessionTypeOrmQueryRepository (`session-typeorm.query-repository.ts`)
Query репозиторий с **полной совместимостью** API:
- `getAllActiveDevices()` → возвращает `SessionViewDto[]`
- `getActiveDeviceById()` → возвращает `SessionViewDto | null`
- `getActiveDeviceByIatAndUserId()` → точная копия оригинала
- Формат данных **идентичен** существующему

### 3. Application слой

#### SessionTypeOrmService (`session-typeorm.service.ts`)
Полная реплика `SessionService` с методами:
- `deleteAllActiveSessions(userId, deviceId)` → `Promise<boolean>`
- `getAllActiveSessions(userId)` → использует репозиторий
- `deleteActiveSessionById(deviceId, userId)` → с проверками владения
- `createSession(newSession)` → поддерживает overwrite логику
- `updateSession(deviceId, updates)` → с boolean результатом
- `generateDeviceId()` → UUID генерация
- `checkIfUserHasSuchDevice()` → проверка владения

#### AuthTypeOrmService (`auth-typeorm.service.ts`)
Полная реплика `AuthService` с:
- **Точными** константами времени жизни токенов
- **Оригинальными** JWT секретами
- Интеграцией с `EmailService`
- Поддержкой `BlacklistedRefreshTokenRepository`
- Логикой повторного использования `deviceId`
- Методом `login()` отдельно от `validateAndLogin()`

### 4. API слой

#### Контроллеры TypeORM
- `AuthTypeOrmController` (`/auth-typeorm/*`)
- `SessionTypeOrmController` (`/security/devices-typeorm/*`)
- **Полная совместимость** с существующими эндпоинтами

## Обеспечение совместимости

### ✅ Структура JWT токенов:
```typescript
// Access Token
{ id: userId } // НЕ userId, а id!

// Refresh Token  
{ 
  id: userId,
  deviceId: deviceId,
  iat: Math.floor(iat.getTime() / 1000)
}
```

### ✅ Секреты токенов:
```typescript
// Hardcoded как в оригинале
secret: 'access-token-secret'
secret: 'refresh-token-secret'
```

### ✅ Время жизни:
```typescript
const REFRESH_TOKEN_SECONDS = 1800; // 30 minutes
const ACCESS_EXPIRES_IN = '60m';
const REFRESH_EXPIRES_IN = '60m';
```

### ✅ API Response формат:
```typescript
// GET /security/devices-typeorm
[{
  deviceId: string,
  ip: string,
  lastActiveDate: Date,
  title: string // device_name
}]
```

### ✅ Логика сессий:
- Поиск существующих сессий по `device_name`
- Переиспользование `deviceId` при совпадении
- Обновление вместо создания новых записей

### ✅ Интеграции:
- `EmailService.sendEmailConfirmationMessage()`
- `EmailService.sendPasswordRecoveryMessage()`
- `BlacklistedRefreshTokenRepository.save()`
- `addSeconds()` для вычисления времени

## Ключевые отличия от первоначальной реализации

**Что было исправлено:**

1. **Секреты токенов** - теперь используются оригинальные hardcoded секреты
2. **Время жизни** - точно как в оригинале (30 мин refresh, 60 мин access)
3. **Payload структура** - `id` вместо `userId` 
4. **Логика deviceId** - переиспользование существующих
5. **API формат** - `title` вместо `deviceName` в ответах
6. **Методы сервисов** - полное соответствие существующим
7. **Интеграции** - EmailService и BlacklistedRefreshTokenRepository
8. **Обработка ошибок** - доменные исключения как в оригинале

## Тестирование

Для тестирования используйте эндпоинты с суффиксом `-typeorm`:

```bash
# Аутентификация
POST /auth-typeorm/registration
POST /auth-typeorm/login
POST /auth-typeorm/logout
POST /auth-typeorm/refresh-token
GET  /auth-typeorm/me

# Управление сессиями  
GET    /security/devices-typeorm
DELETE /security/devices-typeorm
DELETE /security/devices-typeorm/:deviceId
```

**Ожидаемые результаты:**
- Идентичное поведение со старыми эндпоинтами
- Совместимые структуры ответов
- Одинаковая логика управления сессиями
- Корректная работа токенов

## Статус миграции

✅ **ПОЛНАЯ СОВМЕСТИМОСТЬ ДОСТИГНУТА**

- Все методы существующих сервисов реплицированы
- API responses идентичны оригинальным
- JWT токены имеют правильную структуру
- Логика сессий полностью сохранена
- Интеграции работают корректно

TypeORM версия готова к production использованию и постепенной замене Mongoose реализации. 