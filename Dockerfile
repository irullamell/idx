FROM node:20-slim

# Install Chrome dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libnss3 \
    libxss1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Set Puppeteer to use system Chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY package*.json ./

RUN npm ci --omit=dev

COPY index-authenticated.js ./
COPY index.js ./

# Create volume for persistent cookies
VOLUME ["/data"]

EXPOSE 8080

CMD ["node", "index-authenticated.js"]
