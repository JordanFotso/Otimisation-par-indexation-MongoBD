FROM oven/bun:1.1.20

WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install

COPY . .

EXPOSE 3001

CMD ["bun", "run", "dev"]
