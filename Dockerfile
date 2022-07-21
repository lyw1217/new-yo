# NEWYO
FROM golang:1.18

ENV GIN_MODE=debug
ENV PORT=30100
    
WORKDIR /usr/src/app

# pre-copy/cache go.mod for pre-downloading dependencies and only redownloading them in subsequent builds if they change
COPY go.mod go.sum ./
RUN go mod download && go mod verify

COPY . .
RUN go build -v -o /usr/local/bin/app .

EXPOSE ${PORT}

CMD ["app"]