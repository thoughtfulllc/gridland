FROM oven/bun:1-alpine

RUN apk add --no-cache git nodejs npm

RUN addgroup -S runner && adduser -S runner -G runner

WORKDIR /app

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

USER runner

ENTRYPOINT ["entrypoint.sh"]
