FROM ubuntu:20.04

RUN apt-get update && apt-get install -y curl \
    && curl -fsSL https://deb.nodesource.com/setup_12.x | bash - \
    && apt-get install -y nodejs \
    && node --version \
    && npm --version \
    && npm install -g yarn

WORKDIR /app
COPY . /app/bitxorcore-rest
RUN cd bitxorcore-rest && ./yarn_setup.sh
WORKDIR /app/bitxorcore-rest/rest
