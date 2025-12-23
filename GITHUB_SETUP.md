# GitHub 저장소 연결 가이드

## 1단계: GitHub에 새 저장소 생성

1. [GitHub](https://github.com)에 로그인
2. 우측 상단의 "+" 버튼 클릭 → "New repository" 선택
3. 저장소 정보 입력:
   - Repository name: `eoeo-income-payments-system` (또는 원하는 이름)
   - Description: "EOEO 통합 수익 및 결제 관리 시스템"
   - Public 또는 Private 선택
   - **"Initialize this repository with a README" 체크 해제** (이미 로컬에 파일이 있으므로)
4. "Create repository" 클릭

## 2단계: 로컬 Git 저장소 초기화 및 연결

프로젝트 폴더에서 다음 명령어 실행:

```bash
# Git 저장소 초기화
git init

# 모든 파일 추가
git add .

# 첫 커밋
git commit -m "Initial commit"

# GitHub 저장소 연결 (YOUR_USERNAME과 YOUR_REPO_NAME을 실제 값으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 또는 SSH 사용 시:
# git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git

# 메인 브랜치로 푸시
git branch -M main
git push -u origin main
```

## 3단계: Vercel에서 GitHub 저장소 연결

1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. "Add New..." → "Project" 클릭
3. "Import Git Repository" 섹션에서:
   - GitHub 계정 연결 (처음이면 "Connect GitHub" 클릭)
   - 방금 만든 저장소 선택
4. 프로젝트 설정:
   - Framework Preset: **Next.js** (자동 감지됨)
   - Root Directory: `./` (기본값)
   - Build Command: `npm run build` (기본값)
   - Output Directory: `.next` (기본값)
   - Install Command: `npm install` (기본값)
5. **Environment Variables** 섹션에서 환경 변수 추가:
   - `NEXT_PUBLIC_SUPABASE_URL` = (Supabase 프로젝트 URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (Supabase Anon Key)
   - `SUPABASE_SERVICE_ROLE_KEY` = (Supabase Service Role Key)
   - 각 변수에 대해 Production, Preview, Development 모두 선택
6. "Deploy" 클릭

## 4단계: 배포 확인

1. 배포가 완료되면 Vercel이 제공하는 URL로 접속
2. Home 화면이 정상적으로 로드되는지 확인
3. 각 팀별 입금 관리 페이지 테스트

## 참고사항

- GitHub 저장소가 Private인 경우, Vercel에서 GitHub 계정 권한을 승인해야 합니다
- 환경 변수는 Vercel 대시보드의 Settings → Environment Variables에서 나중에 수정할 수 있습니다
- `main` 브랜치에 push하면 자동으로 프로덕션 배포가 됩니다


