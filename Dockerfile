FROM hugomods/hugo:exts-0.147.0 AS build
WORKDIR /src
COPY . .
# Remove local hextra replacement so Hugo fetches the module from GitHub
RUN sed -i '/replacements:/d; /github.com\/imfing\/hextra -> \/hextra/d' hugo.yaml
RUN hugo --minify --baseURL /

FROM nginx:alpine
COPY --from=build /src/public /usr/share/nginx/html
EXPOSE 80
