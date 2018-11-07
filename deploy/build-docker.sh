#!/bin/bash
export HALIN_VERSION=$(jq -r '.version' < package.json)

if [ -z $HALIN_VERSION ] ; then 
   echo "Check path; can't find package.json." 
   exit 1 ;
else
   echo "HALIN_VERSION=$HALIN_VERSION"
fi

IMAGE=mdavidallen/halin:$HALIN_VERSION
docker build -t $IMAGE -f Dockerfile .
docker push $IMAGE

