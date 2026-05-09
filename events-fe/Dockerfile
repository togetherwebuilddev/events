FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
ARG NPM_STRICT_SSL=false
RUN npm config set strict-ssl ${NPM_STRICT_SSL} && npm install

COPY public public
COPY src src
COPY tsconfig.json tsconfig.json

ARG REACT_APP_API_BASE_URL=http://localhost:8081
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
