# SAPIENTIA

SAPIENTIA는 철학적 사고와 지혜를 탐구하는 플랫폼입니다. 세 가지 이해의 기둥(자아와 존재, 자연과 우주, 사회와 미래)을 통해 깊이 있는 통찰을 제공하고, 사용자가 자신의 생각을 기록할 수 있는 저널 기능을 제공합니다.

## 기술 스택

### 프론트엔드
- HTML5, CSS3, JavaScript (ES6+)
- Vite (개발 서버 및 빌드 도구)
- Web Components (커스텀 컴포넌트)

### 백엔드
- Supabase (PostgreSQL 데이터베이스)
- Supabase Auth (인증 시스템)
- Supabase Storage (이미지 저장)
- Supabase Edge Functions (서버리스 함수)

### 기타
- Resend API (이메일 발송)
- localStorage (오프라인 지원)

## 주요 기능

- **사용자 인증**: 이메일/비밀번호 로그인, 소셜 로그인
- **저널 시스템**: 개인 생각 기록, 태그 지정, 검색 기능
- **콘텐츠 탐색**: 철학적 축과 이해의 기둥을 통한 콘텐츠 구조화
- **뉴스레터**: 구독 관리 및 발송 시스템
- **관리자 대시보드**: 콘텐츠 관리, 사용자 통계, 뉴스레터 발송

## 프로젝트 구조

```
sapientia-website/
├── index.html                # 메인 페이지
├── content/                  # 철학적 축 콘텐츠
│   ├── origin.html           # 사유의 기원
│   ├── depth.html            # 사유의 심연
│   └── extension.html        # 사유의 확장
├── pillars/                  # 이해의 기둥 콘텐츠
│   ├── self-existence.html   # 자아와 존재
│   ├── nature-cosmos.html    # 자연과 우주
│   └── society-future.html   # 사회와 미래
├── admin/                    # 관리자 페이지
│   ├── index.html            # 대시보드
│   ├── themes.html           # 콘텐츠 테마 관리
│   ├── questions.html        # 철학적 질문 관리
│   ├── newsletter.html       # 뉴스레터 관리
│   ├── admin.js              # 관리자 기능 스크립트
│   └── admin.css             # 관리자 페이지 스타일
├── styles/                   # 스타일시트
│   ├── main.css              # 메인 스타일
│   └── content.css           # 콘텐츠 페이지 스타일
├── scripts/                  # 자바스크립트
│   └── main.js               # 메인 스크립트
├── utils/                    # 유틸리티 함수
│   ├── supabase.js           # Supabase 클라이언트
│   ├── auth.js               # 인증 관련 함수
│   ├── journal.js            # 저널 관련 함수
│   └── email.js              # 이메일 관련 함수
├── components/               # 웹 컴포넌트
│   ├── auth/                 # 인증 컴포넌트
│   │   ├── AuthButton.js     # 인증 버튼
│   │   └── AuthModal.js      # 인증 모달
│   └── journal/              # 저널 컴포넌트
│       ├── JournalManager.js # 저널 관리자
│       └── JournalEditor.js  # 저널 에디터
├── supabase/                 # Supabase 설정
│   ├── migrations/           # 데이터베이스 마이그레이션
│   │   └── 001_initial_schema.sql # 초기 스키마
│   └── functions/            # Edge Functions
│       ├── send-email/       # 이메일 발송 함수
│       └── send-newsletter/  # 뉴스레터 발송 함수
├── .env.example              # 환경 변수 예제
├── vite.config.js            # Vite 설정
└── package.json              # 프로젝트 메타데이터
```

## 설치 및 실행

### 필수 조건
- Node.js 16.x 이상
- npm 또는 yarn
- Supabase 계정

### 설치 단계

1. 저장소 클론
   ```bash
   git clone https://github.com/yourusername/sapientia.git
   cd sapientia
   ```

2. 의존성 설치
   ```bash
   npm install
   ```

3. 환경 변수 설정
   ```bash
   cp .env.example .env
   ```
   `.env` 파일을 열고 Supabase URL, API 키 등을 설정합니다.

4. Supabase 프로젝트 설정
   ```bash
   npx supabase init
   ```

5. 데이터베이스 마이그레이션 실행
   ```bash
   npx supabase db push
   ```

6. 개발 서버 실행
   ```bash
   npm run dev
   ```

## 배포

### Vercel 배포

1. Vercel CLI 설치
   ```bash
   npm install -g vercel
   ```

2. 배포
   ```bash
   vercel
   ```

### 수동 배포

1. 빌드
   ```bash
   npm run build
   ```

2. `dist` 폴더의 내용을 웹 서버에 업로드

## 개발자 정보

SAPIENTIA는 철학적 사고와 지혜를 탐구하는 플랫폼으로, 2025년 출시를 목표로 개발 중입니다.

## 라이선스

이 프로젝트는 비공개 소프트웨어로, 모든 권리는 SAPIENTIA에 있습니다. 