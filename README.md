# PoE2 경로석·서판 검색기

Path of Exile 2 경로석·서판 옵션 검색용 정규식을 생성하는 도구.
React + Vite + Tailwind CSS. Firebase Hosting 배포용.

## 로컬 실행

```bash
npm install
npm run dev
```

→ http://localhost:5173

## 빌드

```bash
npm run build      # dist/ 생성
npm run preview    # 빌드 결과 미리보기
```

## Firebase 배포

### 1. Firebase CLI 설치 (최초 1회)

```bash
npm install -g firebase-tools
firebase login
```

### 2. 프로젝트 ID 연결

`.firebaserc` 파일을 열어 `YOUR_FIREBASE_PROJECT_ID`를 실제 프로젝트 ID로 바꾼다.
(Firebase 콘솔 → 프로젝트 설정 → 프로젝트 ID)

또는 CLI로:

```bash
firebase use --add
```

### 3. 배포

```bash
npm run deploy
```

(내부적으로 `vite build` 후 `firebase deploy --only hosting` 실행)

배포 후 `https://<프로젝트ID>.web.app` 에서 확인.

## 프로젝트 구조

```
src/
  data/options.js       # 경로석·서판 옵션 데이터 (poe2db.tw/kr 검증)
  lib/
    regex.js            # 정규식 생성 로직 (poe2.re 방식)
    options.js          # 옵션 풀 구성, id 생성
  components/
    TabletTypeBar.jsx   # 서판 종류 선택
    OptionRow.jsx       # 옵션 행 (수치 입력 + 텍스트 + 조각)
    ResultBar.jsx       # 결과 검색어 + 선택 칩
    HighlightText.jsx   # 수치 범위 강조
  App.jsx               # 메인
```

## 데이터 갱신

`src/data/options.js`의 `DATA` 객체를 수정하면 된다.
구조: `waystone.{implicit, prefix, suffix}` / `tablet.{common_prefix, common_suffix, unique}`.

## 다음 작업(TODO)

- 즐겨찾기 기능 (localStorage) — 생성된 검색 조합 저장/복원
- 서판 반대부호 3건 거래소명 실측 (환영 안개 느리게, 공물 감소 2건)
- 경로석 거래소명 확인
