// 브라우저가 아니라 Vercel 서버에서 실행되는 코드
// 'process.env.KMA_AUTH_KEY'로 Secret 값을 읽을 수 있고 키가 Vue 번들에 들어가지 않음.
export default async function handler(request, response) {
  try {
    const { type = 'metar', icao } = request.query

    // Vercel 서버에서만 Secret 환경변수를 읽음
    const authKey = process.env.KMA_AUTH_KEY

    if (!authKey) {
      return response.status(500).json({
        message: 'KMA_AUTH_KEY 환경변수가 설정되지 않았습니다.',
      })
    }

    let endpoint

    if (type === 'metar') {
      endpoint = 'getMetar'
    } else if (type === 'sigmet') {
      endpoint = 'getSigmet'
    } else {
      return response.status(400).json({
        message: '지원하지 않는 KMA API 유형입니다.',
      })
    }

    const params = new URLSearchParams({
      pageNo: '1',
      numOfRows: '10',
      dataType: 'XML',
      authKey,
    })

    if (type === 'metar') {
      if (!icao) {
        return response.status(400).json({
          message: 'METAR 조회에는 ICAO 코드가 필요합니다.',
        })
      }

      params.set('icao', icao)
    }

    const url =
      `https://apihub.kma.go.kr/api/typ02/openApi/` +
      `AmmIwxxmService/${endpoint}?${params.toString()}`

    const kmaResponse = await fetch(url)
    const body = await kmaResponse.text()

    response.status(kmaResponse.status)

    response.setHeader(
      'Content-Type',
      kmaResponse.headers.get('content-type') ||
        'application/xml; charset=utf-8',
    )

    return response.send(body)
  } catch (error) {
    console.error('KMA API Proxy Error:', error)

    return response.status(500).json({
      message: 'KMA API 요청 중 오류가 발생했습니다.',
    })
  }
}
