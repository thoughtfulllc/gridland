FROM oven/bun:1-alpine

RUN apk add --no-cache git nodejs

RUN addgroup -S runner && adduser -S runner -G runner

WORKDIR /app

COPY --chmod=755 entrypoint.sh /usr/local/bin/entrypoint.sh

USER runner

ENTRYPOINT ["entrypoint.sh"]
