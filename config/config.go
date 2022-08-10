package config

import (
	"encoding/json" // https://pkg.go.dev/encoding/json
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	log "github.com/sirupsen/logrus"
	"gopkg.in/natefinch/lumberjack.v2"
)

const (
	configPath  string = "./cfg/config.json"
	loggingPath string = "./cfg/logging.json"
)

/*
log.Trace("Something very low level.")
log.Debug("Useful debugging information.")
log.Info("Something noteworthy happened!")
log.Warn("You should probably take a look at this.")
log.Error("Something failed but I'm not quitting.")
// Calls os.Exit(1) after logging
log.Fatal("Bye.")
// Calls panic() after logging
log.Panic("I'm bailing.")
*/
// setup logger
func SetupLogger() {
	path, _ := filepath.Abs(loggingPath)
	file, err := os.Open(path)
	if err != nil {
		log.Println(err)
		return
	}
	defer file.Close()

	var l *lumberjack.Logger

	decoder := json.NewDecoder(file)
	err = decoder.Decode(&l)
	if err != nil {
		log.Println(err)
		return
	}

	hostname, err := os.Hostname()
	if err != nil {
		log.Error(err, "Err. Failed to get Hostname")
	}
	l.Filename = fmt.Sprintf(l.Filename, hostname)

	// Fork writing into two outputs
	multiWriter := io.MultiWriter(os.Stderr, l) // Stderr와 파일에 동시  출력

	logFormatter := new(log.TextFormatter)
	logFormatter.TimestampFormat = time.RFC1123Z // or RFC3339
	logFormatter.FullTimestamp = true

	log.SetFormatter(logFormatter)
	log.SetLevel(log.InfoLevel)
	log.SetOutput(multiWriter)
	log.SetReportCaller(true) // 해당 이벤트 발생 시 함수, 파일명 표기

	log.Error(" ")
	log.Error("===================================================")
	log.Error(" Scraping News with Go                 S T A R T   ")
	log.Error("===================================================")
	log.Error(" ")
	log.Error("< SCRAPER > Successful Logger setup ...............")
}
