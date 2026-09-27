# ---- build stage ----
FROM node:22-slim AS build
WORKDIR /app
COPY package.json yarn.lock lerna.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN yarn install --frozen-lockfile
COPY client client
COPY server server
RUN yarn workspace presight-client build && yarn workspace presight-server build

# ---- runtime deps ----
# Only the server's production deps. The client is static files by now, so its
# React/Tailwind deps must not reach the final image.
FROM node:22-slim AS runtime-deps
WORKDIR /deps
COPY yarn.lock ./
COPY server/package.json ./package.json
RUN yarn install --production --frozen-lockfile

# ---- runtime stage ----
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/data/users.db \
    STATIC_DIR=/app/client/dist
COPY --from=runtime-deps /deps/node_modules node_modules
COPY --from=build /app/server/dist server/dist
COPY --from=build /app/server/package.json server/package.json
COPY --from=build /app/client/dist client/dist
EXPOSE 3000
CMD ["node", "server/dist/index.js"]
