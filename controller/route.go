package controller

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strconv"
	"strings"

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

func ParseWeather(body []FcstItem_t, name string) string {

	parsed_data := ""

	parsed_data += name + "@"
	// 0: 1시간 기온, 5: 하늘 상태, 6: 강수 형태, 7: 강수 확률, 9: 강수량, 10: 습도, 11: 1시간 신적설
	parsed_data += body[0].FcstDate[0:4] + "년 " + body[0].FcstDate[4:6] + "월 " + body[0].FcstDate[6:8] + "일 "
	parsed_data += body[0].FcstTime[0:2] + "시 예보" + "@"
	// 1시간 기온
	parsed_data += body[0].Category + " : "
	parsed_data += body[0].FcstValue + "@"
	// 하늘 상태
	parsed_data += body[5].Category + "   : "
	parsed_data += body[5].FcstValue + "@"
	// 강수 형태
	parsed_data += body[6].Category + "   : "
	parsed_data += body[6].FcstValue + "@"
	// 강수 확률
	parsed_data += body[7].Category + "   : "
	parsed_data += body[7].FcstValue + "@"
	// 강수량
	if body[6].FcstValue != "없음" {
		parsed_data += body[9].Category + "       : "
		parsed_data += body[9].FcstValue + "@"
	}
	// 습도
	parsed_data += body[10].Category + "          : "
	parsed_data += body[10].FcstValue
	// 1시간 신적설
	if body[11].FcstValue != "적설없음" {
		parsed_data += "@"
		parsed_data += body[11].Category + ": "
		parsed_data += body[11].FcstValue
	}

	return parsed_data
}

func weatherKeyword(c *gin.Context, keywords []string) {

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

	q := req.URL.Query()

	for i, k := range keywords {
		key := fmt.Sprintf("k%d", i+1)
		q.Add(key, k)
	}

	// Query : Period, 0: 오늘, 1: 내일
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

		if period > 1 {
			c.JSON(http.StatusBadRequest, gin.H{
				"status": http.StatusBadRequest,
				"reason": "Query p is invalid.",
			})
			return
		}

		q.Add("p", p)

		req.URL.RawQuery = q.Encode()

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

		if resp.StatusCode != http.StatusOK {
			c.JSON(http.StatusNotFound, gin.H{
				"status": http.StatusNotFound,
				"reason": "Not Found",
			})
			return
		}

		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			log.Error(err, "Err, Failed to ReadAll")
			c.JSON(http.StatusInternalServerError, gin.H{
				"status": http.StatusInternalServerError,
				"reason": "Internal Server Error",
			})
			return
		}

		parse_resp := FcstContents_t{}
		err = json.Unmarshal(body, &parse_resp)
		if err != nil {
			log.Error("error decoding response: %v", err)
			if e, ok := err.(*json.SyntaxError); ok {
				log.Error("syntax error at byte offset %d", e.Offset)
			}
			log.Error("response: %q", string(body))
			c.JSON(http.StatusInternalServerError, gin.H{
				"status": http.StatusInternalServerError,
				"reason": "Internal Server Error",
			})
			return
		}

		c.String(resp.StatusCode, "%s", ParseWeather(parse_resp.Contents, parse_resp.Name))

		return

	} else {
		// 조회된 전체 기간 (default : 24h)
		// 에러처리
		c.JSON(http.StatusBadRequest, gin.H{
			"status": http.StatusBadRequest,
			"reason": "Query p is invalid.",
		})
		return
	}
}

func weatherMidterm(c *gin.Context, mid string) {
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

	q := req.URL.Query()

	q.Add("mid", mid)

	req.URL.RawQuery = q.Encode()

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

	if resp.StatusCode != http.StatusOK {
		c.JSON(http.StatusNotFound, gin.H{
			"status": http.StatusNotFound,
			"reason": "Not Found",
		})
		return
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Error(err, "Err, Failed to ReadAll")
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": http.StatusInternalServerError,
			"reason": "Internal Server Error",
		})
		return
	}

	parse_resp := FcstMidContents_t{}
	err = json.Unmarshal(body, &parse_resp)
	if err != nil {
		log.Error("error decoding response: %v", err)
		if e, ok := err.(*json.SyntaxError); ok {
			log.Error("syntax error at byte offset %d", e.Offset)
		}
		log.Error("response: %q", string(body))
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": http.StatusInternalServerError,
			"reason": "Internal Server Error",
		})
		return
	}

	splited_str := strings.FieldsFunc(parse_resp.Contents, func(r rune) bool {
		return r == '*' || r == '○'
	})

	result_str := make([]string, 0)

	result_str = append(result_str, strings.Split(splited_str[0], "-")...)
	result_str = append(result_str, splited_str[1:]...)

	c.String(resp.StatusCode, "%s", strings.Join(result_str, "@○"))

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
