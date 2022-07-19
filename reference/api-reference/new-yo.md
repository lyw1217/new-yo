---
description: 뉴요의 API 레퍼런스 페이지입니다.
---

# New-Yo

## 기사 가져오기

{% swagger baseUrl="http://localhost" method="get" path="/article" summary="조건에 맞는 그 날의 요약된 기사를 가져옵니다." %}
{% swagger-description %}

{% endswagger-description %}

{% swagger-parameter in="query" name="paper" required="true" %}
hankyung 한국경제,

maekyung 매일경제,

quicknews 간추린뉴스


{% endswagger-parameter %}

{% swagger-response status="200" description="OK" %}
```javascript
{
    "name"="Wilson",
    "owner": {
        "id": "sha7891bikojbkreuy",
        "name": "Samuel Passet",
    "species": "Dog",}
    "breed": "Golden Retriever",
}
```
{% endswagger-response %}

{% swagger-response status="400: Bad Request" description="Bad Request" %}
```javascript
{
    // Response
}
```
{% endswagger-response %}

{% swagger-response status="401" description="Permission denied" %}

{% endswagger-response %}
{% endswagger %}
