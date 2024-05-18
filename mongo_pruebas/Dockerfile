FROM mongo:latest

COPY init-replica-set.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/init-replica-set.sh

CMD ["init-replica-set.sh"]
