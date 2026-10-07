# Цифровая визитка разработчика

GraphQL API на NestJS с данными о разработчике, навыках, опыте и проектах.
Данные хранятся в PostgreSQL, работа с базой реализована через Prisma.

## Запуск через Docker

Нужны Docker и Docker Compose v2. Выполняйте команды из корня проекта.

1. Создайте файл с переменными окружения. Если `.env` уже существует, используйте его.

   ```bash
   cp .env.example .env
   ```

2. Соберите и запустите приложение вместе с PostgreSQL:

   ```bash
   docker compose up --build -d --wait
   ```

   При запуске приложение автоматически применяет миграции и загружает данные
   из `prisma/profile-data.ts`. Команда ждёт готовности обоих сервисов.

3. Откройте [GraphQL Sandbox](http://localhost:3000/graphql).

По умолчанию API доступен на порту `3000`, PostgreSQL — на `localhost:5433`.
Порты можно изменить через `PORT` и `POSTGRES_PORT` в `.env`.
Внутри Docker приложение подключается к базе по адресу `postgres:5432`:
Compose формирует `DATABASE_URL` из `POSTGRES_USER`, `POSTGRES_PASSWORD` и `POSTGRES_DB`.
Реквизиты базы задаются при первом создании volume; изменение `.env` не меняет
пользователя или пароль в уже созданной базе.

Посмотреть состояние сервисов и логи приложения:

```bash
docker compose ps
docker compose logs -f app
```

Остановить сервисы:

```bash
docker compose down
```

Данные сохраняются в Docker volume `postgres_data`. Для полного сброса базы
используйте `docker compose down -v`: эта команда удаляет данные проекта.

## Локальный запуск для разработки

Нужны Node.js 22 версии не ниже `22.22.3` и npm. Версия Node.js указана в `.nvmrc`.
PostgreSQL можно запустить отдельно через Docker.

1. Создайте `.env` из `.env.example`, если файла ещё нет.
   Локальный `DATABASE_URL` должен указывать на доступную PostgreSQL.
   Если меняете реквизиты или порт базы в `.env`, обновите и `DATABASE_URL`.

2. Если всё приложение уже работает в Docker, остановите контейнер API,
   чтобы освободить порт `3000`:

   ```bash
   docker compose stop app
   ```

3. Запустите базу, установите зависимости, примените миграции и загрузите данные:

   ```bash
   docker compose up -d --wait postgres
   npm ci
   npm run db:generate
   npm run db:deploy
   npm run db:seed
   ```

4. Запустите приложение с автоматическим перезапуском при изменении кода:

   ```bash
   npm run start:dev
   ```

   GraphQL Sandbox доступен по адресу `http://localhost:3000/graphql`
   или на порту, указанном в `PORT`.

Для запуска собранного приложения вместо режима разработки:

```bash
npm run build
npm run start:prod
```

## Пример запроса

Выполните в GraphQL Sandbox:

```graphql
query {
  profile {
    name
    description
    githubUrl
    linkedinUrl
    skills {
      name
      category
    }
    experience {
      company
      position
      startDate
      endDate
      achievements
    }
    projects {
      name
      description
      repositoryUrl
      liveUrl
      technologies
    }
  }
}
```

## Изменение данных

Отредактируйте `prisma/profile-data.ts`. При локальном запуске выполните:

```bash
npm run db:seed
```

При запуске через Docker пересоберите приложение:

```bash
docker compose up --build -d --wait app
```

Seed обновляет визитку и заменяет её навыки, опыт и проекты данными из файла.
Он выполняется при каждом старте контейнера приложения.

## Проверки

После установки зависимостей:

```bash
npm run lint
npm run format:check
npm test
```

Для тестов нужны работающая PostgreSQL и корректный `DATABASE_URL` в `.env`.
Тесты используют отдельную временную схему и удаляют её после выполнения.
