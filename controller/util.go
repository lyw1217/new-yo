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

func encodeRomanization(query string, r RomanContents_t) (string) {
	/* TODO 로마자 표기법을 따르지 않으면서 많이 사용되고 있는 이름들을 어떻게 표현할지
	result_str := make([]string, 0)

	tmp_str := ""
	for _, item := range r.Contents {
		tmp_str += item.Name + ""
	}

	result_str = append(result_str, tmp_str)
	*/

	return fmt.Sprintf("%s을(를) 현행 로마자 표기법으로 바꾸면 %s", query, r.Contents[0].Name)
}

func GetPapagoRomanization(query string) (string, error) {
	req, err := http.NewRequest("GET", SCRAPER_URL+"/romanization", nil)
	if err != nil {
		log.Error(err, "Err, Failed to NewRequest()")
		return "", err
	}

	q := req.URL.Query()
	q.Add("query", query)

	req.URL.RawQuery = q.Encode()

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Error(err, "Err, Failed to Get Request")
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", err
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Error(err, "Err, Failed to ReadAll")
		return "", err
	}

	parse_resp := RomanContents_t{}
	err = json.Unmarshal([]byte(body), &parse_resp)
	if err != nil {
		log.Error("error decoding response: ", err)
		if e, ok := err.(*json.SyntaxError); ok {
			log.Error("syntax error.", e.Error())
		}
		log.Error("response: ", string(body))
		return "", err
	}

	r := encodeRomanization(query, parse_resp)

	return r, nil
}