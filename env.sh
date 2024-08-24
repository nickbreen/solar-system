#!/bin/bash

set -xeuo pipefail

docker build -t yarn - <<EOF
FROM node
RUN corepack enable yarn
RUN yarn set version 4.4.0
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
EOF

case $0 in
  */yarn)
    docker run -it --user $UID --net host --rm --volume $PWD:$PWD:rw --workdir $PWD yarn yarn "$@"
    ;;
  *)
    docker run -it --user $UID --net host --rm --volume $PWD:$PWD:rw --workdir $PWD yarn bash -
    ;;
esac

