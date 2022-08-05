package controller

type News_t struct {
	Name    string `json:"name"`
	Flag    bool   `json:"send_flag"`
	SendCnt int
}

type CommCfg_t struct {
	SendHour   int      `json:"send_hour"`
	SendMin    int      `json:"send_min"`
	MaxSendCnt int      `json:"max_send_cnt"`
	Media      []News_t `json:"news"`
}

type Contents_t struct {
	Paper   string `json:"paper"`
	Content string `json:"content"`
}

type FcstItem_t struct {
	BaseDate  string `json:"baseDate"`  // 발표일자
	BaseTime  string `json:"baseTime"`  // 발표시각
	FcstDate  string `json:"fcstDate"`  // 예보일자
	FcstTime  string `json:"fcstTime"`  // 예보시각
	Category  string `json:"category"`  // 자료구분문자
	FcstValue string `json:"fcstValue"` // 예보 값
	Nx        int    `json:"nx"`        // 예보지점 X 좌표
	Ny        int    `json:"ny"`        // 예보지점 Y 좌표
}

type FcstContents_t struct {
	Contents []FcstItem_t `json:"contents"`
	Status   int          `json:"status"`
	Name     string       `json:"name"`
}

type FcstMidContents_t struct {
	Contents string `json:"contents"`
	Status   int    `json:"status"`
}
