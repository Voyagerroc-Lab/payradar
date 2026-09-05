FROM nginx:alpine

COPY nginx.default.conf.template /etc/nginx/templates/default.conf.template
COPY nginx.security-headers.conf /etc/nginx/security-headers.conf
COPY dist /usr/share/nginx/html

ENV PORT=8080
EXPOSE 8080
