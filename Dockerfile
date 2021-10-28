FROM node:16-alpine
WORKDIR /root/review-police
COPY ./package.json .
COPY ./tsconfig.json .
COPY src ./src
RUN npm install
RUN npm run build

FROM node:16-alpine

# set working directory
WORKDIR /root/review-police
# copy project file
COPY ./package.json .
# install node packages
RUN npm install --only=production && \
    npm cache verify
# copy app files
COPY ./account-mappings.json .
COPY ./.env .
COPY --from=0 ./root/review-police/build ./build
RUN npm install pm2 -g
# application server port
EXPOSE 3000
# default run command
#CMD [ "npm", "start" ]
CMD [ "pm2-runtime", "./build/app.js"]