FROM openjdk:8-jre

ARG ELASTICSEARCH_VERSION=0.90.13
ARG ROOT_DIR=/elasticsearch

ENV ELASTICSEARCH_VERSION ${ELASTICSEARCH_VERSION}
ENV PATH ${ROOT_DIR}/bin:$PATH

RUN curl -s -L -O https://s3.amazonaws.com/dd-agent-tarball-mirror/elasticsearch-${ELASTICSEARCH_VERSION}.tar.gz

RUN mkdir -p ${ROOT_DIR}
RUN tar zxf elasticsearch-${ELASTICSEARCH_VERSION}.tar.gz -C ${ROOT_DIR} --strip-components=1

RUN mkdir -p ${ROOT_DIR}/config
COPY config/elasticsearch.yml  ${ROOT_DIR}/config
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

EXPOSE 9200 9300
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["elasticsearch", "-f"]