#!/bin/bash
ENDPOINT=http://halin.s3-website-us-east-1.amazonaws.com
BUCKET=halin

npm run build
s3cmd put --recursive -P dist/* s3://$BUCKET
