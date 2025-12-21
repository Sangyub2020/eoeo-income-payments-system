# Vercel 배포 가이드

## 배포 전 준비사항

### 1. 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정해야 합니다:

#### 필수 환경 변수
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anon Key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Service Role Key

#### 선택적 환경 변수 (마이그레이션용)
- `SUPABASE_DB_PASSWORD`: Supabase 데이터베이스 비밀번호
- `SUPABASE_DB_CONNECTION_STRING`: Supabase 데이터베이스 연결 문자열

### 2. Vercel 배포 방법

#### 방법 1: Vercel CLI 사용 (권장)

1. Vercel CLI 설치 (아직 설치하지 않은 경우):
```bash
npm i -g vercel
```

2. Vercel 로그인:
```bash
vercel login
```

3. 프로젝트 배포:
```bash
vercel
```

4. 프로덕션 배포:
```bash
vercel --prod
```

#### 방법 2: Vercel 웹 UI 사용

1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. "Add New..." → "Project" 클릭
3. GitHub/GitLab/Bitbucket 저장소 연결 또는 직접 업로드
4. 프로젝트 설정:
   - Framework Preset: Next.js
   - Root Directory: `./` (기본값)
   - Build Command: `npm run build` (기본값)
   - Output Directory: `.next` (기본값)
5. Environment Variables 섹션에서 환경 변수 추가
6. "Deploy" 클릭

### 3. 환경 변수 설정 방법 (Vercel 대시보드)

1. 프로젝트 선택
2. Settings → Environment Variables
3. 다음 변수들을 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - (선택) `SUPABASE_DB_PASSWORD`
   - (선택) `SUPABASE_DB_CONNECTION_STRING`

각 변수에 대해:
- Environment: Production, Preview, Development 모두 선택
- Value: 실제 값 입력
- "Save" 클릭

### 4. 배포 후 확인사항

1. 배포 완료 후 제공되는 URL로 접속
2. Home 화면이 정상적으로 로드되는지 확인
3. 각 팀별 입금 관리 페이지가 정상 작동하는지 확인
4. 데이터베이스 연결이 정상인지 확인

### 5. 문제 해결

#### 빌드 실패 시
- Vercel 대시보드의 Deployments 탭에서 로그 확인
- 환경 변수가 올바르게 설정되었는지 확인
- `npm run build` 로컬에서 실행하여 오류 확인

#### 데이터베이스 연결 오류
- Supabase 대시보드에서 프로젝트 상태 확인
- 환경 변수 값이 올바른지 확인
- Supabase의 Network Restrictions 설정 확인

### 6. 자동 배포 설정

GitHub 저장소와 연결한 경우:
- `main` 브랜치에 push하면 자동으로 프로덕션 배포
- 다른 브랜치에 push하면 Preview 배포

## 참고사항

- 프로덕션 환경에서는 `SUPABASE_SERVICE_ROLE_KEY`를 반드시 설정해야 합니다.
- 마이그레이션은 Supabase MCP를 통해 로컬에서 실행하거나, Supabase 대시보드의 SQL Editor를 사용하세요.
- Vercel의 무료 플랜에서는 빌드 시간 제한이 있으므로, 큰 프로젝트의 경우 유료 플랜을 고려하세요.

