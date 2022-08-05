package controller

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// NotFoundPage : NoRoute
func NotFoundPage(c *gin.Context) {
	c.JSON(http.StatusNotFound, gin.H{
		"status": "404",
		"reason": "Not Found",
	})
}

// /article?paper=hankyung , /article?paper=maekyung , /article?paper=quicknews
func getArticle(c *gin.Context) {
	target := c.Query("paper")
	contents := make([]Contents_t, 0)

	switch target {
	case "hankyung":
		var data Contents_t
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
		var data Contents_t
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
		var data Contents_t
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
		var data Contents_t
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

	// Query : [mid], midterm forecast, 중기예보 RSS(지역명)
	mid := c.Query("mid")

	// Query : [k1, k2, k3], Keyword, 검색 키워드(지역명)
	k1 := c.Query("k1")
	k2 := c.Query("k2")
	k3 := c.Query("k3")

	if len(k1) > 0 || len(k2) > 0 || len(k3) > 0 {
		keywords := make([]string, 0)

		if len(k1) > 0 {
			keywords = append(keywords, k1)
		}
		if len(k2) > 0 {
			keywords = append(keywords, k2)
		}
		if len(k3) > 0 {
			keywords = append(keywords, k3)
		}
		weatherKeyword(c, keywords)

	} else if len(mid) > 0 {
		weatherMidterm(c, mid)

	} else {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": http.StatusBadRequest,
			"reason": "Bad Request",
		})
		return
	}
}

func getRomanization(c *gin.Context) {
	// Query : query, 로마자로 변환할 한글 이름
	query := c.Query("query")
	if len(query) > 0 {
		resp, err := GetPapagoRomanization(query)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status": http.StatusInternalServerError,
				"reason": "Internal Server Error",
			})
		}

		if len(resp) > 0 {
			c.String(http.StatusOK, "%s", resp)
		} else {
			c.JSON(http.StatusBadRequest, gin.H{
				"status": http.StatusBadRequest,
				"reason": "Bad Request",
			})
		}
	} else {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": http.StatusBadRequest,
			"reason": "Bad Request",
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

	r.GET("/romanization", getRomanization)
}
