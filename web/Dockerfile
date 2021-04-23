FROM node:15

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json ./
COPY yarn.lock ./

RUN yarn

# Bundle app source
COPY . .
COPY .env.production .env.local

RUN yarn build

ENV NODE_ENV production

EXPOSE 8080
CMD [ "yarn", "start" ]

USER node