package controller

import (
	"encoding/json"
	"io/ioutil"
	"net/http"

	log "github.com/sirupsen/logrus"

	"github.com/gin-gonic/gin"
)

// NotFoundPage : NoRoute
func NotFoundPage(c *gin.Context) {
	c.JSON(http.StatusNotFound, gin.H{
		"status": "404",
		"reason": "Not Found",
	})
}

// url로 HTTP GET 요청하여 http.Response 객체 반환
func requestGetDocument(url string) (*http.Response, error) {
	// Request 객체 생성
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		log.Error(err, "Err, Failed to NewRequest()")
		return nil, err
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Error(err, "Err, Failed to Get Request")
		return nil, err
	}

	return resp, err
}

func requestArticle(url string) (interface{}, error) {
	resp, err := requestGetDocument(url)
	if err != nil {
		log.Error(err, "Err. Failed to requestGetDocument")
		return "", err
	}

	bytes, _ := ioutil.ReadAll(resp.Body)

	var jsonData map[string]interface{}

	e := json.Unmarshal(bytes, &jsonData) // 이게 파싱하는 구문.
	if e != nil {
		log.Error(err, "Err. Failed to json.Unmarshal")
		return "", err
	}

	return jsonData["contents"], err
}

// /article?paper=hankyung , /article?paper=maekyung , /article?paper=quicknews
func getArticle(c *gin.Context) {
	paper := c.Query("paper")

	switch paper {
	case "hankyung":
		resp, err := requestArticle("http://localhost:30200/article?paper=hankyung")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status": "500",
				"reason": "Internal Server Error",
			})
			break
		}

		c.JSON(http.StatusOK, gin.H{
			"status":   "200",
			"contents": resp,
		})

	case "maekyung":
		resp, err := requestArticle("http://localhost:30200/article?paper=maekyung")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status": "500",
				"reason": "Internal Server Error",
			})
			break
		}

		c.JSON(http.StatusOK, gin.H{
			"status":   "200",
			"contents": resp,
		})

	case "quicknews":
		resp, err := requestArticle("http://localhost:30200/article?paper=quicknews")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status": "500",
				"reason": "Internal Server Error",
			})
			break
		}

		c.JSON(http.StatusOK, gin.H{
			"status":   "200",
			"contents": resp,
		})

	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "400",
			"reason": "Bad Request",
		})
	}
}

func InitRoutes(r *gin.Engine) {
	r.NoRoute(NotFoundPage)

	r.GET("/", func(c *gin.Context) {
		c.String(
			http.StatusOK,
			"Hello World. NEW-YO!",
		)
	})

	r.GET("/article", getArticle)
}
