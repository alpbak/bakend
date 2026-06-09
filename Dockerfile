# syntax=docker/dockerfile:1

FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock ./
COPY dashboard/package.json dashboard/bun.lock* ./dashboard/
COPY sdk/javascript/package.json ./sdk/javascript/

RUN bun install
RUN cd dashboard && bun install

COPY . .

RUN bun run build

FROM alpine:3.21 AS runtime

RUN addgroup -S bakend && adduser -S bakend -G bakend

COPY --from=builder /app/dist/bak /bak
RUN chmod +x /bak

EXPOSE 8080

VOLUME ["/data"]
WORKDIR /data

USER bakend

ENTRYPOINT ["/bak", "start", "--config", "/data/bakend.json"]
