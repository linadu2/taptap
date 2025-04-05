FROM node:20-alpine

WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of your application code
COPY . .

CMD ["node", "index.js"]