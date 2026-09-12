FROM node:22-slim AS builder
WORKDIR /usr/src/app
COPY package.json .
COPY package-lock.json* .
RUN npm ci

FROM node:22-slim
WORKDIR /usr/src/app
RUN chown node:node /usr/src/app
COPY --from=builder --chown=node:node /usr/src/app/ /usr/src/app/
COPY --chown=node:node . .
USER node
# The image is for local previews (docs/features/Docker Support.md). Inside the container the
# server has to listen on all interfaces for published ports to reach it, so publish them on
# the host's loopback address: -p 127.0.0.1:8080:8080 -p 127.0.0.1:3001:3001
CMD ["npx", "quartz", "build", "--serve", "--host", "0.0.0.0"]
