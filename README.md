# 이사체크 — 이사/전입/확정일자/공과금 변경 체크리스트

공식기관 링크 중심으로 정리한 **이사 전후 행정·생활 절차 참고용 체크리스트** 정적 웹서비스입니다.

> **중요:** 본 서비스는 법률 자문, 행정 대행, 신고 대행 서비스를 제공하지 않습니다.  
> 실제 신청·신고·법적 효력은 공식기관의 최신 안내를 직접 확인하세요.

---

## 프로젝트 소개

이사를 할 때 놓치기 쉬운 절차(전입신고, 확정일자, 임대차 신고, 공과금 정산, 우편물 이전 등)를 한 페이지에서 확인할 수 있도록 정리한 정보성 체크리스트 서비스입니다.

- **타겟 사용자:** 이사를 앞두거나 이사 직후 행정 처리가 필요한 일반 시민
- **서비스 성격:** 공공기관 안내 페이지 수준의 신뢰감을 갖춘 참고용 정보 서비스

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| **날짜별 체크리스트** | 이사 7~3일 전 → 당일 → 이후 1~3일 → 14·30일 내 4단계 타임라인 |
| **체크 상태 저장** | 체크박스 클릭 시 localStorage에 자동 저장, 새로고침 후에도 유지 |
| **진행률 표시** | 완료 항목 수 / 전체 수 + 진행률 바 표시 |
| **전체 초기화** | 버튼 클릭으로 모든 체크 상태 초기화 |
| **상황별 필터** | 계약 형태·주거 유형·지역·추가 서비스 선택 시 관련 항목에 **추천** 배지 표시 |
| **필터 상태 저장** | 선택한 필터도 localStorage에 저장 |
| **공식 링크 모음** | 정부24, 인터넷등기소, 부동산거래관리시스템 등 7개 공식기관 링크 |
| **모바일 최적화** | 모바일 우선(Mobile-first) 반응형 레이아웃 |

---

## 공식기관 링크

| 기관 | URL | 용도 |
|------|-----|------|
| 정부24 | https://www.gov.kr | 전입신고, 주민등록 관련 민원 |
| 대한민국 법원 인터넷등기소 | https://www.iros.go.kr | 확정일자, 부동산 등기 |
| 부동산거래관리시스템 | https://rtms.molit.go.kr | 주택임대차·매매 신고 |
| 인터넷우체국 | https://service.epost.go.kr | 우편물 전송서비스 |
| 한전ON | https://online.kepco.co.kr | 전기요금 이전·정산 |
| 찾기쉬운 생활법령정보 | https://www.easylaw.go.kr | 임대차·이사 관련 법령 정보 |
| 서울시 아리수 사이버고객센터 | https://i121.seoul.go.kr | 서울 수도요금 이전·정산 |

> 공식기관 서비스 내용 및 URL은 변경될 수 있으므로, 방문 전 최신 정보를 확인하세요.

---

## 개인정보 미수집 원칙

- 이 서비스는 **어떠한 개인정보도 수집·저장·전송하지 않습니다.**
- 체크 상태와 필터 선택은 **사용자 브라우저의 localStorage에만** 저장됩니다.
- 서버로 전송되는 데이터가 없으며, 회원가입·로그인·주소 입력 기능이 없습니다.
- 주민등록번호, 계약서 파일, 계좌번호 등 민감정보를 이 페이지에 입력하지 마세요.

---

## localStorage 사용 설명

이 서비스는 외부 서버 없이 동작하며, 다음 두 키로 브라우저 localStorage를 사용합니다.

| 키 | 저장 내용 |
|----|-----------|
| `move-check-items` | 체크박스 완료 상태 `{ [id]: boolean }` |
| `move-check-filters` | 선택된 필터 값 배열 `string[]` |

브라우저의 **개발자 도구 → Application → Local Storage** 에서 직접 확인하거나 삭제할 수 있습니다.  
**전체 초기화** 버튼을 누르면 체크 상태만 삭제됩니다(필터 선택은 유지).

---

## 프로젝트 구조

```
/
├─ index.html          # 메인 페이지 (원페이지)
├─ css/
│  └─ styles.css       # 전체 스타일 (CSS Variables, Mobile-first)
├─ js/
│  └─ app.js           # 체크리스트 렌더링, localStorage, 필터 로직
├─ data/
│  └─ checklist.json   # 체크리스트 항목 데이터
├─ html/               # TeleportHQ export 원본 (gitignore 처리)
├─ .gitignore
└─ README.md
```

---

## 배포 방법

별도 서버나 데이터베이스 없이 **정적 호스팅 서비스**에 바로 배포 가능합니다.

### Vercel

1. [vercel.com](https://vercel.com) 가입 후 프로젝트 생성
2. GitHub 저장소 연결 또는 `vercel` CLI로 배포
3. `index.html`이 루트에 있으면 별도 설정 불필요

```bash
npm i -g vercel
vercel
```

### Cloudflare Pages

1. [pages.cloudflare.com](https://pages.cloudflare.com) 접속
2. GitHub 저장소 연결
3. Build command: (없음), Output directory: `/` (루트)
4. 저장 후 자동 배포

### Netlify

1. [netlify.com](https://netlify.com) 접속
2. GitHub 연결 또는 폴더 드래그앤드롭 배포
3. Build command: (없음), Publish directory: `/`

> `data/checklist.json`은 **HTTP 서버를 통해 제공되어야** `fetch()`가 동작합니다.  
> 로컬에서 `file://`로 열면 CORS 제한으로 체크리스트가 로딩되지 않을 수 있습니다.  
> 로컬 테스트 시 아래 명령어로 로컬 서버를 실행하세요.

```bash
npx serve .
# 또는
python3 -m http.server 3000
```

브라우저에서 `http://localhost:3000` 접속.

---

## 수정 시 주의사항

1. **공식기관 정보는 주기적으로 확인하세요.**  
   정부 서비스 URL, 신고 기한, 처리 절차는 법 개정이나 서비스 개편에 따라 변경될 수 있습니다.  
   `data/checklist.json`의 `officialNote`, `link` 필드와 `index.html`의 공식 링크를 정기적으로 검토하세요.

2. **법률 자문처럼 보이는 문구를 사용하지 마세요.**  
   "보증금 보호 보장", "확정적으로 안전", "대행", "자동 신고" 같은 표현은 사용하지 않습니다.

3. **공식 링크 우선:**  
   체크 항목의 안내는 해당 공식기관 링크를 직접 연결하는 방식을 유지하세요.

4. **개인정보 수집 금지:**  
   어떤 경우에도 주민등록번호, 주소 전체, 계좌번호, 계약서 파일을 입력받는 기능을 추가하지 마세요.

5. **체크리스트 항목 추가/수정:**  
   `data/checklist.json` 파일만 수정하면 됩니다. 항목별 필드 설명:

   | 필드 | 타입 | 설명 |
   |------|------|------|
   | `id` | string | 고유 식별자 (kebab-case, 변경 시 localStorage 키 리셋됨) |
   | `phase` | string | 단계명 (js/app.js의 PHASE_META 상수와 일치해야 함) |
   | `phaseOrder` | number | 단계 정렬 순서 (1~4) |
   | `title` | string | 항목 제목 |
   | `description` | string | 상세 설명 |
   | `tags` | string[] | 필터 태그 (빈 배열 = 모든 상황에 해당) |
   | `officialNote` | string | 공식기관 관련 참고 문구 |
   | `link` | string | 관련 공식기관 URL |

---

## 기술 스택

- **HTML5** — Semantic HTML, ARIA 접근성
- **CSS3** — CSS Variables, Mobile-first, Grid/Flexbox
- **Vanilla JavaScript** — ES6+, `fetch()`, `localStorage`
- **외부 의존성:** Google Fonts (Noto Sans KR) 1개만 사용
- **빌드 도구:** 없음 (순수 정적 파일)

---

## 라이선스

MIT License
