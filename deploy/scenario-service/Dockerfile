# BuildKit inputs: `nurture` is this checkout; `my-chat` is the pinned sibling
# checkout required by the workspace's link:../My-Chat dependency entries.
ARG NODE_BASE_IMAGE=node:20-bookworm-slim
FROM ${NODE_BASE_IMAGE} AS build

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

# Human-run one-shot target for `prisma migrate deploy`. It intentionally keeps
# the full build workspace and is not used as the long-running service image.
FROM build AS migration

ENTRYPOINT ["node", "apps/scenario-service/dist/runtime-secrets.js"]
CMD ["pnpm", "exec", "prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"]

FROM ${NODE_BASE_IMAGE} AS runtime

ENV NODE_ENV=production
WORKDIR /app

RUN groupadd --system --gid 10001 nurture \
  && useradd --system --uid 10001 --gid nurture --create-home nurture

COPY --from=build --chown=nurture:nurture /opt/scenario-service ./

USER nurture
EXPOSE 8000

CMD ["node", "dist/main.js"]
