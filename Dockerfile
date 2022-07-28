# NEWYO
ARG BUILD_IMAGE=golang:1.18-alpine3.15
ARG BASE_IMAGE=alpine:3.15


FROM ${BUILD_IMAGE} AS builder
    
WORKDIR /usr/src/app

# pre-copy/cache go.mod for pre-downloading dependencies and only redownloading them in subsequent builds if they change
COPY go.mod go.sum ./
RUN go mod download && go mod verify

COPY . .
RUN go build -v -o /usr/local/bin/newyo .

FROM ${BASE_IMAGE}
LABEL AUTHOR Youngwoo Lee (mvl100d@gmail.com)
ENV GIN_MODE=debug \
    PORT=30100 \
    TZ=Asia/Seoul

RUN apk --no-cache add tzdata && \
	cp /usr/share/zoneinfo/$TZ /etc/localtime && \
	echo $TZ > /etc/timezone \
	apk del tzdata

WORKDIR /usr/src/app

COPY --chown=0:0 --from=builder /usr/local/bin/newyo /usr/local/bin/newyo

EXPOSE ${PORT}

CMD ["newyo"]