FROM node:22.12-alpine AS builder

COPY . /app

WORKDIR /app

RUN --mount=type=cache,target=/root/.npm npm install

FROM node:22-alpine AS release

WORKDIR /app

COPY --from=builder /app/build /app/build
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/package-lock.json /app/package-lock.json

ENV NODE_ENV=production
ENV TUSKY_API_KEY=dbabe38a-169a-4b15-835c-ef743167e440

RUN npm ci --ignore-scripts --omit-dev

ENTRYPOINT ["node", "build/index.js"]
