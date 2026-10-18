FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    DATA_DIR=/data

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY server ./server
COPY public ./public

# SQLite 파일은 /data 에 저장된다. 호스팅의 영구 디스크(볼륨)를 이 경로에 연결해야 재배포해도 글이 남는다
RUN mkdir -p /data
VOLUME /data

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:${PORT}/api/health || exit 1
CMD ["node", "--disable-warning=ExperimentalWarning", "server/index.js"]
