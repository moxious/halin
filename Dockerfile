# base image
FROM kkarczmarczyk/node-yarn:latest

# set working directory
RUN mkdir /app
WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH
ENV PORT 3000

# install and cache app dependencies
COPY package.json /app/package.json
RUN yarn install
RUN yarn install react-scripts@1.1.1 -g

EXPOSE 3000

# start app
CMD ["yarn", "start"]
