준비하기
Kakao 지도 Javscript API 는 키 발급을 받아야 사용할 수 있습니다.
그리고 키를 발급받기 위해서는 카카오 계정이 필요합니다.

키 발급에는 아래 과정이 필요합니다.

1. 카카오 개발자사이트 (https://developers.kakao.com) 접속
2. 개발자 등록 및 앱 생성
3. 웹 플랫폼 추가: 앱 선택 – [플랫폼] – [Web 플랫폼 등록] – 사이트 도메인 등록
4. 사이트 도메인 등록: [웹] 플랫폼을 선택하고, [사이트 도메인] 을 등록합니다. (예: http://localhost:8080)
5. 페이지 상단의 [JavaScript 키]를 지도 API의 appkey로 사용합니다.
6. 앱을 실행합니다.

등록한 도메인(예: http://localhost:8080)에서 웹 서버를 실행시켜 위 파일을 엽니다.
# Python이 설치된 컴퓨터에서는 해당 폴더로 이동 후
$ cd /path/to/your/folder/

# 다음과 같이 테스트용 웹 서버를 실행할 수 있습니다.
$ python -m SimpleHTTPServer 8080
브라우저를 열어 위 도메인에 접속합니다.
등록된 사이트 도메인에서만 지도API를 사용할 수 있기 때문에 반드시 등록해주세요.

왼쪽 메뉴의 열쇠모양 을 클릭하면 내 애플리케이션 로 이동합니다. 아직 발급받은 키가 없다면 해당 페이지에 접속하여 키를 발급 받으세요.

시작하기
여러분은 간단한 코드를 통해 웹브라우저에 지도를 띄울 수 있습니다.
차근차근 한 단계씩 진행해 보도록 하겠습니다.

지도를 담을 영역 만들기
먼저 지도를 담기 위한 영역이 필요합니다. 500x400 의 크기로 만들어 보겠습니다.

<div id="map" style="width:500px;height:400px;"></div>
지도를 담을 영역으로 스타일이 지정된 <div> 태그를 선언합니다.
<div> 태그의 id값은 map 으로 하도록 하겠습니다.

실제 지도를 그리는 Javascript API를 불러오기
<script type="text/javascript" src="//dapi.kakao.com/v2/maps/sdk.js?appkey=발급받은 APP KEY를 넣으시면 됩니다."></script>
// 이라는 상대 프로토콜을 사용하면, 사용자의 http, https 환경에 따라 자동으로 해당 프로토콜을 따라가게 됩니다.

API를 로딩하는 스크립트 태그는 HTML파일안의 head, body 등 어떠한 위치에 넣어도 상관없습니다.
하지만, 반드시 실행 코드보다 먼저 선언되어야 합니다.

지도를 띄우는 코드 작성
var container = document.getElementById('map'); //지도를 담을 영역의 DOM 레퍼런스
var options = { //지도를 생성할 때 필요한 기본 옵션
	center: new kakao.maps.LatLng(33.450701, 126.570667), //지도의 중심좌표.
	level: 3 //지도의 레벨(확대, 축소 정도)
};

var map = new kakao.maps.Map(container, options); //지도 생성 및 객체 리턴
Map 객체의 두 번째 파라메터로 넣는 options 의 속성 중, center 는 지도를 생성하는데 반드시 필요합니다.
center 에 할당할 값은 LatLng 클래스를 사용하여 생성합니다. 흔히 위경도 좌표라고 부르는 WGS84 좌표계의 좌표값을 넣어서 만드는데요, 생성인자는 위도(latitude), 경도(longitude) 순으로 넣어주세요.

전체 코드는 아래와 같습니다.

<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8"/>
	<title>Kakao 지도 시작하기</title>
</head>
<body>
	<div id="map" style="width:500px;height:400px;"></div>
	<script type="text/javascript" src="//dapi.kakao.com/v2/maps/sdk.js?appkey=발급받은 APP KEY를 넣으시면 됩니다."></script>
	<script>
		var container = document.getElementById('map');
		var options = {
			center: new kakao.maps.LatLng(33.450701, 126.570667),
			level: 3
		};

		var map = new kakao.maps.Map(container, options);
	</script>
</body>
</html>
모두 되었습니다. 여러분의 웹브라우저에는 아래와 같이 500x400 크기의 지도가 생성되었을 겁니다.

50mKakao 맵으로 이동(새창열림)
라이브러리 사용하기
지도 라이브러리란?
Kakao 지도 Javascript API 는 지도와 함께 사용할 수 있는 라이브러리 를 지원하고 있습니다.
라이브러리는 javascript API와 관련되어 있지만 조금 특화된 기능을 묶어둔 것을 말합니다. 이 기능은 추가로 불러와서 사용할 수 있도록 되어있습니다.
현재 사용할 수 있는 라이브러리는 다음과 같습니다.

clusterer: 마커를 클러스터링 할 수 있는 클러스터러 라이브러리 입니다.
services: 장소 검색 과 주소-좌표 변환 을 할 수 있는 services 라이브러리 입니다.
drawing: 지도 위에 마커와 그래픽스 객체를 쉽게 그릴 수 있게 그리기 모드를 지원하는 drawing 라이브러리 입니다.
라이브러리는 계속해서 추가될 예정입니다.

라이브러리 불러오기
라이브러리는 추가로 불러서 사용해야 합니다. 아래와 같이 파라메터에 추가하여 로드합니다.

<script type="text/javascript" src="//dapi.kakao.com/v2/maps/sdk.js?appkey=APIKEY&libraries=LIBRARY"></script>
LIBRARY 토큰 부분에 사용하고자하는 라이브러리 이름을 적으면 해당 라이브러리를 불러올 수 있습니다.

<!-- services 라이브러리 불러오기 -->
<script type="text/javascript" src="//dapi.kakao.com/v2/maps/sdk.js?appkey=APIKEY&libraries=services"></script>
<!-- services와 clusterer, drawing 라이브러리 불러오기 -->
<script type="text/javascript" src="//dapi.kakao.com/v2/maps/sdk.js?appkey=APIKEY&libraries=services,clusterer,drawing"></script>
지도 URL
지도 API를 이용해서 특정 위치를 표시한 후, Kakao 지도에서 크게 보기나 길찾기로 연결하고 싶으신 경우에는 다음과 같은 URL를 이용하시면 됩니다. 이 URL을 이용하시면, 사용자의 환경에 따라 PC 버전의 Kakao 지도 또는 모바일웹 Kakao 지도로 자동 연결됩니다.

지도 바로가기
좌표나 장소ID를 이용하여 Kakao 지도에서 해당 위치를 표시한 상태의 URL을 만들수 있습니다. 장소ID는 키워드로 장소 검색 API 또는 카테고리로 장소 검색 API를 이용한 경우에 반환된 값에서 확인하실 수 있습니다.

URL Pattern	예시
/link/map/위도,경도	https://map.kakao.com/link/map/37.402056,127.108212
/link/map/이름,위도,경도	https://map.kakao.com/link/map/우리회사,37.402056,127.108212
/link/map/장소ID	https://map.kakao.com/link/map/18577297
길찾기 바로가기
좌표나 장소ID를 이용하여 해당 위치를 목적지로 지정한 상태의 길찾기 URL을 만들 수 있습니다.

URL Pattern	예시
/link/to/이름,위도,경도	https://map.kakao.com/link/to/카카오판교오피스,37.402056,127.108212
/link/to/장소ID	https://map.kakao.com/link/to/18577297
로드뷰 바로가기
좌표나 장소ID를 이용하여 해당 위치의 로드뷰를 바로 실행하는 URL을 만들 수 있습니다.

URL Pattern	예시
/link/roadview/위도,경도	https://map.kakao.com/link/roadview/37.402056,127.108212
/link/roadview/장소ID	https://map.kakao.com/link/roadview/18577297
지도 검색결과 바로가기
검색어를 이용하여 검색결과를 표시한 상태의 URL을 만들 수도 있습니다.

URL Pattern	예시
/link/search/검색어	https://map.kakao.com/link/search/카카오
더 살펴보기
여러분은 이제 웹브라우저에 간단한 지도를 만들 수 있게 되었습니다. 하지만 여기서 끝이 아닙니다. 더 나아가 생성한 지도를 여러가지 방법으로 제어할 수 있습니다.
Kakao 지도 Javscript API 를 더 자세히 살펴보세요. 다양한 방법이 준비되어 있습니다.

API를 응용한 예제는 Sample 페이지 로 이동하여 확인할 수 있습니다.
API의 기능에 대해 상세히 알기 원한다면 Documentation 페이지 를 참고해 주세요.
어렵고 복잡한가요? 개발자 포럼 을 방문하세요. 그리고 질문하세요. 여러분과 같은 고민을 하는 개발자를 만나 도움을 얻을 수도 있습니다.