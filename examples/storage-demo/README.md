# Storage Demo

Demonstrates Milestone 8 file storage with collection `file` fields.

## Setup

From this directory:

```bash
bun run ../../src/index.ts start
```

## Workflow

```bash
# Register
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"password123"}' \
  | jq -r .token)

# Upload a file
FILE_ID=$(curl -s -X POST http://localhost:8080/api/storage/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F 'file=@README.md' \
  -F 'visibility=public' \
  | jq -r .id)

# Create an attachment record referencing the file
curl -X POST http://localhost:8080/api/attachments \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"title\":\"Demo\",\"file_id\":\"$FILE_ID\"}"

# Download the file (public — no auth required)
curl "http://localhost:8080/api/storage/$FILE_ID"

# Delete the file
curl -X DELETE "http://localhost:8080/api/storage/$FILE_ID" \
  -H "Authorization: Bearer $TOKEN"
```

The `attachments` collection has a `file_id` field of type `file`. Records store the upload `id`; validation ensures the file exists in `_files`.
