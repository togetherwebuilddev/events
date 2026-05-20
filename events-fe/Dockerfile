FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
ARG NPM_STRICT_SSL=false
RUN npm config set strict-ssl ${NPM_STRICT_SSL} && npm install

COPY public public
COPY src src
COPY tsconfig.json tsconfig.json

ARG REACT_APP_API_BASE_URL=
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL

RUN npm run build

FROM nginx:1.27-alpine

ARG API_PROXY_TARGET=https://backend-production-b6962.up.railway.app
ENV API_PROXY_TARGET=$API_PROXY_TARGET

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
