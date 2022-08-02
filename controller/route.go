package controller

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strconv"

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
	target := c.Query("paper")
	contents := make([]Contents, 0)

	switch target {
	case "hankyung":
		var data Contents
		resp, err := requestArticle(SCRAPER_URL + "/article?paper=hankyung")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status": "fail",
				"reason": "Internal Server Error",
			})
			break
		}

		data.Paper = "한국경제 Issue Today"
		data.Content = fmt.Sprintf("%v", resp)
		contents = append(contents, data)

		c.JSON(http.StatusOK, gin.H{
			"status":   "success",
			"contents": contents,
		})

	case "maekyung":
		var data Contents
		resp, err := requestArticle(SCRAPER_URL + "/article?paper=maekyung")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status": "fail",
				"reason": "Internal Server Error",
			})
			break
		}

		data.Paper = "매일경제 매.세.지"
		data.Content = fmt.Sprintf("%v", resp)
		contents = append(contents, data)

		c.JSON(http.StatusOK, gin.H{
			"status":   "success",
			"contents": contents,
		})

	case "quicknews":
		var data Contents
		resp, err := requestArticle(SCRAPER_URL + "/article?paper=quicknews")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status": "fail",
				"reason": "Internal Server Error",
			})
			break
		}

		data.Paper = "간추린뉴스"
		data.Content = fmt.Sprintf("%v", resp)
		contents = append(contents, data)

		c.JSON(http.StatusOK, gin.H{
			"status":   "success",
			"contents": contents,
		})

	default:
		/* hankyung */
		var data Contents
		resp, err := requestArticle(SCRAPER_URL + "/article?paper=hankyung")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status": "fail",
				"reason": "Internal Server Error",
			})
			break
		}

		data.Paper = "한국경제 Issue Today"
		data.Content = fmt.Sprintf("%v", resp)
		contents = append(contents, data)

		/* maekyung */
		resp, err = requestArticle(SCRAPER_URL + "/article?paper=maekyung")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status": "fail",
				"reason": "Internal Server Error",
			})
			break
		}

		data.Paper = "매일경제 매.세.지"
		data.Content = fmt.Sprintf("%v", resp)
		contents = append(contents, data)

		/* quicknews */
		resp, err = requestArticle(SCRAPER_URL + "/article?paper=quicknews")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status": "fail",
				"reason": "Internal Server Error",
			})
			break
		}

		data.Paper = "간추린뉴스"
		data.Content = fmt.Sprintf("%v", resp)
		contents = append(contents, data)

		c.JSON(http.StatusOK, gin.H{
			"status":   "success",
			"contents": contents,
		})
	}
}

// 날씨 얻기
func getWeather(c *gin.Context) {

	// Request 객체 생성
	req, err := http.NewRequest("GET", SCRAPER_URL+"/weather", nil)
	if err != nil {
		log.Error(err, "Err, Failed to NewRequest()")
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": http.StatusInternalServerError,
			"reason": "Internal Server Error",
		})
		return
	}

	// Query : Keyword, 검색 키워드(지역명)
	k1 := c.Query("k1")
	k2 := c.Query("k2")
	k3 := c.Query("k3")

	if len(k1) == 0 && len(k2) == 0 && len(k3) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": http.StatusBadRequest,
			"reason": "Bad Request",
		})
		return
	}

	q := req.URL.Query()

	if len(k1) > 0 {
		q.Add("k1", k1)
	}
	if len(k2) > 0 {
		q.Add("k2", k2)
	}
	if len(k3) > 0 {
		q.Add("k3", k3)
	}

	// Query : Period
	p := c.Query("p")

	if len(p) > 0 {
		period, err := strconv.Atoi(p)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"status": http.StatusBadRequest,
				"reason": "Query p is not integer.",
			})
			return
		}
		// 최대 24시간 조회 제한
		if period > 24 {
			period = 24
		}

		q.Add("p", p)

		req.URL.RawQuery = q.Encode()

		fmt.Println(req.URL.String())

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			log.Error(err, "Err, Failed to Get Request")
			c.JSON(http.StatusInternalServerError, gin.H{
				"status": http.StatusInternalServerError,
				"reason": "Internal Server Error",
			})
			return
		}
		defer resp.Body.Close()

		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			log.Error(err, "Err, Failed to ReadAll")
			c.JSON(http.StatusInternalServerError, gin.H{
				"status": http.StatusInternalServerError,
				"reason": "Internal Server Error",
			})
			return
		}

		c.String(resp.StatusCode, "%s", string(body))

		return

	} else {
		// 조회된 전체 기간 (default : 24h)
		// 에러처리
		c.JSON(http.StatusBadRequest, gin.H{
			"status": http.StatusBadRequest,
			"reason": "Query p is not integer.",
		})
		return
	}
}

func InitRoutes(r *gin.Engine) {
	r.NoRoute(NotFoundPage)

	r.GET("/", func(c *gin.Context) {
		c.String(
			http.StatusOK,
			"Hello NEW-YO!",
		)
	})

	r.GET("/article", getArticle)

	r.GET("/weather", getWeather)
}
