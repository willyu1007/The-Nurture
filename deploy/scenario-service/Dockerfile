# BuildKit inputs: `nurture` is this checkout; `my-chat` is the pinned sibling
# checkout required by the workspace's link:../My-Chat dependency entries.
FROM node:20-bookworm-slim AS build

WORKDIR /workspace/The-Nurture

COPY --from=my-chat . /workspace/My-Chat
COPY --from=nurture package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY --from=nurture prisma ./prisma
COPY --from=nurture scripts ./scripts
COPY --from=nurture apps ./apps
COPY --from=nurture packages ./packages

RUN corepack enable && pnpm install --frozen-lockfile
RUN pnpm --filter @the-nurture/scenario-service build
RUN pnpm --filter @the-nurture/scenario-service deploy --prod /opt/scenario-service

FROM node:20-bookworm-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

RUN groupadd --system --gid 10001 nurture \
  && useradd --system --uid 10001 --gid nurture --create-home nurture

COPY --from=build --chown=nurture:nurture /opt/scenario-service ./

USER nurture
EXPOSE 8000

CMD ["node", "dist/main.js"]
