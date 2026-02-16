FROM node:22-alpine AS base

RUN corepack enable

# https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md#handling-kernel-signals
# While tini is recommended on the page we use dumb-init as it seems to currently be more widely
# adopted among enterprise Node.js applications.
FROM base AS init-provider
RUN apk add --no-cache dumb-init

FROM base AS builder

RUN apk add --no-cache gcompat
WORKDIR /app

COPY package.json pnpm-lock.yaml tsconfig.json ./
COPY src ./src
COPY public ./public

RUN pnpm install --frozen-lockfile && \
    pnpm run build:css && \
    pnpm run build && \
    pnpm prune --prod

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono

COPY --from=init-provider --chown=hono:nodejs /usr/bin/dumb-init /usr/bin/dumb-init
COPY --from=builder --chown=hono:nodejs /app/node_modules /app/node_modules
COPY --from=builder --chown=hono:nodejs /app/dist /app/dist
COPY --from=builder --chown=hono:nodejs /app/public /app/public
COPY --from=builder --chown=hono:nodejs /app/package.json /app/package.json

USER hono

# Wrapping the entrypoint with dumb-init to handle kernel signals properly.
# NodeJS doesn't handle being PID 1 very well, so we use dumb-init to manage signals.
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "/app/dist/index.js"]