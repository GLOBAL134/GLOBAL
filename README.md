# GLOBAL — исходный проект сайта

## Запуск

```bash
npm install
npm run dev
```

Сайт откроется на `http://localhost:3000`.

## Проверка и сборка

```bash
npm run lint
npm run build
```

Статический экспорт создаётся в каталоге `out/`.

## Публикация на GitHub Pages

```bash
GITHUB_PAGES=true npm run build
```

Для репозитория `GLOBAL134/GLOBAL` конфигурация использует путь `/GLOBAL`.

## Интеграция формы

Frontend-валидация и маска телефона работают. Сейчас форма намеренно не показывает ложный успех и не передаёт данные. Подключите реальный POST endpoint, CRM, email или Telegram webhook в функции `submit` файла `src/app/page.tsx`, затем замените состояние `sendError` обработкой реального ответа.

## Перед публикацией

Заполните реквизиты в:
- `src/app/privacy/page.tsx`
- `src/app/consent/page.tsx`

Проверьте актуальность Telegram и всех контактных данных.
