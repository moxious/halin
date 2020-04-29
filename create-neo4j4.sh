#!/bin/bash
# Quick script to start a community instance for testing.
docker stop neo4j-empty

PASSWORD=admin
CWD=`pwd`
NEO4J=neo4j:4.0.3-enterprise
#NEO4J=neo4j:4.0.3

docker run -d --name neo4j-empty --rm \
	-p 127.0.0.1:7474:7474 \
        -p 127.0.0.1:7687:7687 \
        --volume $HOME/neo4j/core1/plugins:/plugins \
        --env=apoc.export.file.enabled=true \
        --env=apoc.import.file.enabled=true \
        --env=NEO4J_dbms_security_procedures_unrestricted=apoc.\* \
        --env=NEO4J_ACCEPT_LICENSE_AGREEMENT=yes \
        --env=NEO4J_dbms_memory_pagecache_size=1G \
        --env=NEO4J_dbms_memory_heap_initial__size=2G \
        --env=NEO4J_dbms_memory_heap_max__size=4G \
	--env NEO4J_AUTH=neo4j/admin \
        --env NEO4J_dbms_max__databases=5 \
	-t $NEO4J

echo "When you're ready to run some cypher, execute this:"
echo docker exec --interactive --tty neo4j-empty bin/cypher-shell -a localhost -u neo4j -p $PASSWORD
