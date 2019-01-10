#!/bin/bash
ENDPOINT=http://halin.s3-website-us-east-1.amazonaws.com
BUCKET=halin.graphapp.io

# Publish to the jfrog.io repo where Neo4j Desktop finds it.
#npm publish

# Publish to the static Amazon S3 site.
npm run build
s3cmd put --recursive -P dist/* s3://$BUCKET
