FROM node:14-buster-slim as build

WORKDIR /app
ADD package.json package-lock.json ./
RUN npm install

ADD . ./
RUN node ./app.js

FROM nginx:alpine
COPY --from=build /app/dist/ /usr/share/nginx/html