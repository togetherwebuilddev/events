# SOKOJ Events

Docker setup za celu aplikaciju:

- `events-be` Spring Boot backend
- `events-fe` React frontend
- `mysql` baza

## Pokretanje u Docker Desktop-u

Iz root foldera projekta:

```bash
docker compose up --build
```

Posle starta:

- frontend: `http://localhost:3000`
- backend: `http://localhost:8081`
- mysql: `localhost:3306`

## Docker promenljive

`docker-compose.yml` ima bezbedne lokalne podrazumevane vrednosti za bazu.

Za slanje mailova po potrebi postavi pre pokretanja:

```powershell
$env:MAIL_HOST="smtp.gmail.com"
$env:MAIL_PORT="587"
$env:MAIL_USERNAME="your-email@example.com"
$env:MAIL_PASSWORD="your-app-password"
$env:MAIL_FROM="your-email@example.com"
docker compose up --build
```

Ako ne postaviš mail promenljive, aplikacija će se pokrenuti, ali slanje emailova neće raditi.

## Zaustavljanje

```bash
docker compose down
```

Za gašenje i baze sa podacima:

```bash
docker compose down -v
```
