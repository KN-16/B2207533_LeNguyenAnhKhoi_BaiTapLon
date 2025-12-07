# Stage 1: Build
FROM node:lts-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Force the API URL to be relative so Nginx can handle the proxy
ENV VITE_API_URL=/api
ENV VITE_BASE_ASSET_URL=/
RUN npm run build

# Stage 2: Production Serve with Nginx
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]