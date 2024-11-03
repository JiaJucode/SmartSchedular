FROM node:20

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

RUN npm install

COPY public ./public
COPY src ./src
COPY .env.local .env.local

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]