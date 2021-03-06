package main

import (
	"log"
	"newyo/config"
	"newyo/controller"
	"os"
	"os/signal"
	"syscall"

	"github.com/gin-gonic/gin"
)

func main() {
	
	config.SetupLogger()

	routeHttp := gin.Default()

	// Initialize the routes
	controller.InitRoutes(routeHttp)

	// HTTP
	port := os.Getenv("PORT")
	if port == "" {
		log.Println("Wrong Value of environment : $PORT = '", port, "'")
		os.Exit(1)
	}
	routeHttp.Run(":"+port)

	quit := make(chan os.Signal, 1)
	done := make(chan bool, 1)
	// kill (no param) default send syscanll.SIGTERM
	// kill -2 is syscall.SIGINT
	// kill -9 is syscall. SIGKILL but can't be catch, so don't need add it
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		sig := <-quit
		log.Println("RECEIVE SIG : ", sig)
		done <- true
	}()
	<-done
	log.Println("Shutdown Server ...")
}
