# Supolead 웹사이트 패키지 사용 안내

이 패키지는 `index.html`, `resources.html`, `case-study.html`, `style.css`, `scripts.js`로 구성된 프런트엔드 템플릿입니다.

## 파일 구성

- `index.html` : 메인 랜딩페이지
- `resources.html` : 리소스 허브 / 블로그형 페이지
- `case-study.html` : 대표 사례 상세 페이지
- `style.css` : 공통 스타일
- `scripts.js` : 모바일 메뉴, FAQ, 카드 필터, 폼 동작
- `assets/` : 로고 및 교체 가능한 더미 이미지

## 가장 먼저 수정할 곳

### 1) 텍스트
각 HTML 파일 안에 아래 주석이 들어 있습니다.

```html
<!-- [수정 포인트] -->
```

이 주석 근처의 제목, 설명, 버튼 링크, 수치, FAQ를 실제 내용으로 바꾸면 됩니다.

### 2) 이미지
`assets/*.svg`는 모두 교체용 더미 파일입니다.

- `hero-ui.svg` : 히어로 / 대시보드
- `team-photo.svg` : 실사 사진
- `chart.svg` : 성과 그래프
- `diagram.svg` : 구조도
- `blog-cover.svg` : 대표 콘텐츠 썸네일
- `case-photo.svg` : 대표 사례 이미지
- `resource-guide.svg` : 자료 다운로드 썸네일

실제 파일로 교체할 때는 같은 경로를 유지하거나 HTML의 `src`만 바꿔도 됩니다.

### 3) 로고
`assets/logo.jpeg`를 실제 로고 파일로 교체하면 됩니다.

### 4) 문의 / 뉴스레터 수신 이메일
`scripts.js` 상단의 아래 두 값을 바꾸세요.

```js
const CONTACT_RECIPIENT = 'hello@example.com';
const NEWSLETTER_RECIPIENT = 'newsletter@example.com';
```

현재는 **mailto 방식**으로 동작합니다. 백엔드나 폼 서비스가 있으면 `scripts.js`의 `bindForms()` 부분을 `fetch()` 요청으로 바꾸면 됩니다.

## 로컬에서 확인하는 방법

### 방법 1. 그냥 파일 열기
`index.html`을 더블클릭해서 브라우저로 열어도 됩니다.

### 방법 2. 간단한 로컬 서버 실행
터미널에서 아래 명령을 실행하세요.

```bash
python -m http.server 8000
```

그 다음 브라우저에서 `http://localhost:8000` 접속.

## 추천 수정 순서

1. `style.css`에서 컬러와 여백 조정
2. `index.html`의 히어로 / 신뢰 로고 / CTA 수정
3. `resources.html`의 대표 콘텐츠 / 카드 링크 수정
4. `case-study.html`의 실제 사례 텍스트와 수치 입력
5. `scripts.js`에서 수신 이메일 또는 API 연동 설정

## 참고

구조 자체는 이전 화이트·레드 와이어프레임과 벤치마킹 보고서에서 정리한 흐름을 바탕으로 재정리했습니다.
