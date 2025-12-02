# CodeSage AI Reviewer — Frontend

Минимальный React-фронтенд, который предоставляет базовую структуру панели управления и умеет обращаться к вашему Django-API через один источник правды: переменную `VITE_API_BASE_URL`.

## Стек
- React (Vite)
- Чистый CSS, компоненты для статусов и сеток
- Docker (multi-stage сборка + nginx)
- `import.meta.env` для конфигурации API

## Быстрый старт

1. Создайте файл `.env` / `.env.local` на основе `.env.example` и пропишите URL вашего Django API.
2. Установите зависимости: `npm install`.
3. Проверьте локально: `npm run dev`.
4. При необходимости поменяйте `VITE_API_BASE_URL` в `docker-compose.yml` (по умолчанию `http://backend:8000/api`) и запустите:
   ```bash
   docker compose up --build
   ```

## Структура
- `src/App.jsx` — главная страница с блочным макетом, карточками статусов и секцией ознакомления.
- `src/components/StatusCard.jsx` — переиспользуемый компонент для отображения состояния backend-сервисов.
- `src/services/apiClient.js` — точка входа для запросов, в первую очередь `GET /health/`.
- `src/index.css` и `src/App.css` — базовые стили оформления.

## Docker

- `Dockerfile` — multi-stage билд: install → build → nginx. Аргумент `VITE_API_BASE_URL` позволяет инжектировать адрес на этапе сборки.
- `docker-compose.yml` — собирает образ и мапит 4173→80. Рекомендуется обновить `VITE_API_BASE_URL` и, при необходимости, добавить связь с вашим настоящим Django-сервисом.
- `.dockerignore` — исключает лишние артефакты из контекста.

## Подключение к Django

1. В Django сделайте `/health/` endpoint, возвращающий JSON вида:
   ```json
   { "status": "ok", "checked_at": "2024-05-17T18:00:00Z", "message": "OK" }
   ```
2. Убедитесь, что CORS и CSRF настроены на прием запросов от фронтенда (в Docker-нейминге домен `frontend` или `localhost:4173`).
3. Обновите `VITE_API_BASE_URL`, запустите билд и фронтенд сам покажет статус.
