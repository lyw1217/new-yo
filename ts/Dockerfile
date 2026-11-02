# NEWYO (TypeScript + Hono)
ARG NODE_IMAGE=node:22.23.4-bookworm-slim

FROM ${NODE_IMAGE} AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

FROM ${NODE_IMAGE}
LABEL org.opencontainers.image.source="https://github.com/lyw1217/new-yo"
ENV NODE_ENV=production \
    TZ=Asia/Seoul \
    PORT=30100 \
    SCRAPER_URL=http://lunchtoday.site:30200
WORKDIR /app
COPY package.json package-lock.json ./
# Runtime needs only node: drop the bundled npm/corepack/yarn (their deps carry the image's only fixable CVEs).
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force \
 && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack /opt/yarn-* \
    /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /usr/local/bin/yarn /usr/local/bin/yarnpkg /root/.npm
COPY --from=build /app/dist ./dist
USER node
EXPOSE 30100
HEALTHCHECK --interval=60s --timeout=5s CMD ["node", "-e", "fetch('http://127.0.0.1:'+process.env.PORT+'/').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"]
CMD ["node", "dist/index.js"]
