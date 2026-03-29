# Identity Service

Manages user accounts, JWT authentication, and token lifecycle for the TechSalary platform.

## Architecture role

```
User → LB → Ingress → BFF → identity-service (app namespace)
                               ↕
                          PostgreSQL (data namespace)
                          identity schema: users, refresh_tokens
```

The identity service is the **only** service that knows user emails/passwords.
All other services receive an opaque `userId` extracted from the JWT.

---

## Endpoints (all prefixed `/identity`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/identity/auth/register` | Public | Create account → returns tokens |
| POST | `/identity/auth/login` | Public | Login → returns tokens |
| POST | `/identity/auth/refresh` | Public | Rotate refresh token |
| POST | `/identity/auth/logout` | Public | Revoke refresh token |
| GET  | `/identity/auth/validate` | Public | Validate JWT (for BFF use) |
| GET  | `/identity/users/me` | JWT required | Get own profile |
| PUT  | `/identity/users/me/password` | JWT required | Change password |
| GET  | `/health` | Public | K8s health probe |
| GET  | `/swagger` | Public | Swagger UI |

---

## 1 — Build Docker image

```bash
# Run from the identity-service/ directory
docker build -t identity-service:latest .
```

For a single-node k8s cluster (e.g. minikube):
```bash
# Make the image available inside the cluster
minikube image load identity-service:latest
# OR (for Docker-Desktop k8s):
# The image is already in the local daemon — imagePullPolicy: Never will use it.
```

---

## 2 — Apply Kubernetes manifests

```bash
# Create app namespace if it doesn't exist
kubectl create namespace app --dry-run=client -o yaml | kubectl apply -f -

# Apply all identity-service manifests
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

Check the pod is running:
```bash
kubectl get pods -n app -l app=identity-service
kubectl logs -n app -l app=identity-service --follow
```

---

## 3 — PostgreSQL schema initialisation

The schema and tables are created automatically on startup via `Program.cs`.
No manual SQL migration is needed. On first start you will see log lines like:

```
Executed DbCommand ... CREATE SCHEMA IF NOT EXISTS identity
Executed DbCommand ... CREATE TABLE IF NOT EXISTS identity.users ...
Executed DbCommand ... CREATE TABLE IF NOT EXISTS identity.refresh_tokens ...
```

To verify the schema from the PostgreSQL pod:
```bash
kubectl exec -it -n data <postgres-pod-name> -- psql -U techsalary_user -d techsalary \
  -c "\dt identity.*"
```

---

## 4 — Test the full auth workflow

### 4a — Port-forward the service for local testing

```bash
kubectl port-forward -n app svc/identity-service 8080:80
```

Then open the Swagger UI at: **http://localhost:8080/swagger**

### 4b — Register a new user

```bash
curl -s -X POST http://localhost:8080/identity/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123"}' | jq .
```

Expected response:
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "abc123...",
  "expiresIn": 3600,
  "userId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

### 4c — Login

```bash
curl -s -X POST http://localhost:8080/identity/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123"}' | jq .
```

### 4d — Validate token (used by BFF)

```bash
ACCESS_TOKEN="<paste accessToken from above>"

curl -s "http://localhost:8080/identity/auth/validate?token=${ACCESS_TOKEN}" | jq .
```

Expected:
```json
{
  "isValid": true,
  "userId": "xxxxxxxx-...",
  "email": "test@example.com"
}
```

### 4e — Get profile (requires JWT)

```bash
curl -s http://localhost:8080/identity/users/me \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq .
```

### 4f — Refresh token rotation

```bash
REFRESH_TOKEN="<paste refreshToken>"

curl -s -X POST http://localhost:8080/identity/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"${REFRESH_TOKEN}\"}" | jq .
```

### 4g — Logout

```bash
curl -s -X POST http://localhost:8080/identity/auth/logout \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"${REFRESH_TOKEN}\"}" | jq .
```

---

## 5 — Configuration reference

| Key | Source | Description |
|-----|--------|-------------|
| `ConnectionStrings__Postgres` | ConfigMap + Secret | PostgreSQL connection string |
| `Jwt__Secret` | Secret | HMAC-SHA256 signing key (≥ 32 chars) |
| `Jwt__Issuer` | ConfigMap | JWT `iss` claim |
| `Jwt__Audience` | ConfigMap | JWT `aud` claim |
| `Jwt__AccessTokenMinutes` | ConfigMap | Access token TTL (default 60) |
| `Jwt__RefreshTokenDays` | ConfigMap | Refresh token TTL (default 30) |

> **Important:** Replace `CHANGE_ME_TO_A_STRONG_SECRET_AT_LEAST_32_CHARS` in
> `k8s/secret.yaml` with a real secret before deploying to any shared environment.
> Never commit real secrets to source control.

---

## Privacy & security notes

- Passwords are hashed with **bcrypt** (never stored in plain text).
- JWT tokens are signed with **HMAC-SHA256**.
- Refresh tokens are **rotated** on every use (old token immediately revoked).
- All refresh tokens for a user are **revoked on password change**.
- The `identity` schema is **logically isolated** from `salary` and `community` schemas.
- Internal services call `/identity/auth/validate` to verify tokens — they never receive raw emails or passwords.
- The identity-service ClusterIP is **not exposed via Ingress** directly; all external traffic flows through the BFF.
