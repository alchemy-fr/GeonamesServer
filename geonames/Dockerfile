FROM php:5.6-cli

RUN apt-get update && apt-get install -y \
    git \
    wget \
    unzip \
    python \
    gettext \
    mongodb-clients \
    libcurl4-openssl-dev \
    pkg-config \
    libsasl2-dev \
    autoconf \
    g++ \
    make \
    openssl \
    libssl-dev \
    zlib1g-dev

RUN mkdir /data && \
    mkdir /sources && \
    mkdir /var/scripts

COPY files/var/scripts/fetch-geonames.sh /var/scripts/
RUN /var/scripts/fetch-geonames.sh


RUN wget https://nodejs.org/download/release/v0.10.45/node-v0.10.45-linux-x64.tar.gz \
    && tar -xzvf node-v0.10.45-linux-x64.tar.gz \
    && cd node-v0.10.45-linux-x64 \
    && cp -Rf * /usr/local/


RUN pecl install mongo \
    && docker-php-ext-enable mongo

RUN wget https://src.fedoraproject.org/lookaside/pkgs/GeoIP/GeoIP-1.4.8.tar.gz/05b7300435336231b556df5ab36f326d/GeoIP-1.4.8.tar.gz \
    && tar -xvzf GeoIP-1.4.8.tar.gz \
    && cd GeoIP-1.4.8 \
    && ./configure --prefix=/usr \
    && make \
    && make install

ENV COMPOSER_ALLOW_SUPERUSER 1
RUN curl -sS https://getcomposer.org/installer | \
    php -- --install-dir=/usr/bin/ --filename=composer

RUN apt-get autoremove -y \
    && apt-get clean all \
    && rm -rvf /var/lib/apt/lists/* \
    && rm -rvf /usr/share/doc /usr/share/man /usr/share/locale	\
    && rm -rf /tmp/*

COPY ./src/composer.json /var/GeonamesServer/
COPY ./src/composer.lock /var/GeonamesServer/
RUN cd /var/GeonamesServer/ && \
    composer install --prefer-source

COPY ./src/package.json /var/GeonamesServer/
RUN cd /var/GeonamesServer/ && \
    /usr/bin/env npm install

ADD ./files/ /
ADD ./src/  /var/GeonamesServer

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["/var/scripts/indexation.sh"]
