FROM node:18-alpine

WORKDIR /app

COPY server/package*.json server/
RUN cd server && npm install

COPY server/ ./

ENV PORT=10000
EXPOSE 10000

CMD ["node", "index.js"]