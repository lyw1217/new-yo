package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// NotFoundPage : NoRoute
func NotFoundPage(c *gin.Context) {
	c.JSON(http.StatusNotFound, gin.H{
		"404": "not found",
	})
}

func InitRoutes(r *gin.Engine) {
	r.NoRoute(NotFoundPage)
}
