# SOKOJ Events Frontend

React administracija za upravljanje događajima, gostima, prijavama i check-in tokovima.

## Frontend okruženja

Frontend koristi CRA env fajlove:

- `.env.development`
- `.env.production`
- `.env.example`

Najvažnija promenljiva:

```env
REACT_APP_API_BASE_URL=http://localhost:8081
```

Za lokalni rad koristi se `.env.development`, a za produkciju `.env.production`.

## Backend profili

Backend koristi Spring profile:

- `dev`
- `prod`

Fajlovi su u `events-be/src/main/resources/`:

- `application.properties`
- `application-dev.properties`
- `application-prod.properties`

Aktivacija profila ide preko promenljive:

```env
SPRING_PROFILES_ACTIVE=dev
```

Primeri promenljivih za backend su u:

- `events-be/.env.dev.example`
- `events-be/.env.prod.example`

## Backend promenljive

Najvažnije promenljive:

```env
DB_URL=jdbc:mysql://localhost:3306/sokoj_events?useSSL=false&serverTimezone=UTC
DB_USERNAME=root
DB_PASSWORD=...
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=...
MAIL_PASSWORD=...
MAIL_FROM=...
SERVER_PORT=8081
```

## Pokretanje

Frontend:

```bash
npm start
```

Backend:

Pokreni aplikaciju uz postavljene env promenljive i odgovarajući `SPRING_PROFILES_ACTIVE`.
