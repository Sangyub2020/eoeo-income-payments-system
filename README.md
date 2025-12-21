# EOEO 통합 수익 및 결제 관리 시스템

EOEO All income 대시보드와 EOEO all sns payments 대시보드를 통합한 웹 기반 관리 시스템입니다.

## 📋 프로젝트 개요

구글 시트로 관리되던 두 개의 대시보드를 실제 DB 구축 및 웹 대시보드 형태로 통합하여 하나의 시스템으로 관리합니다.

### 주요 기능
- ✅ EOEO All income (들어올 돈) 관리
- ✅ EOEO all sns payments 관리
- ✅ 미수금 트래킹
- ✅ 대금집행 예측
- ✅ 플랫폼별, 브랜드별 대금집행 현황

## 🚀 시작하기

### 1. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 `env.example`을 참고하여 설정하세요.

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3002](http://localhost:3002)을 열어 확인하세요.

## 📦 기술 스택

- **Next.js 16** - React 프레임워크
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 스타일링
- **Supabase** - 백엔드 및 데이터베이스
- **Google APIs** - 구글 시트 연동
- **Recharts** - 차트 라이브러리

## 📁 프로젝트 구조

```
eoeo-income-payments-system/
├── app/                    # Next.js App Router
│   ├── api/               # API 라우트
│   ├── dashboard/          # 대시보드 페이지들
│   └── layout.tsx         # 루트 레이아웃
├── components/            # React 컴포넌트
├── lib/                   # 유틸리티 및 헬퍼 함수
├── supabase/              # Supabase 관련 파일
│   └── migrations/        # 데이터베이스 마이그레이션
└── package.json
```

## 📝 스크립트

- `npm run dev` - 개발 서버 실행 (포트 3002)
- `npm run build` - 프로덕션 빌드
- `npm run start` - 프로덕션 서버 실행
- `npm run lint` - ESLint 실행

## 📄 라이선스

ISC

