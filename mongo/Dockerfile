FROM mongo:3.4
COPY mongo-user.sh.d /docker-entrypoint-initdb.d
CMD ["mongod --bind_ip 0.0.0.0"]
