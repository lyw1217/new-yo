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
