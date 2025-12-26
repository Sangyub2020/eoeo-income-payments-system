# Supabase MCP 서버 설정 가이드

## 현재 상태
- MCP 설정 파일 위치: `C:\Users\user\.cursor\mcp.json`
- 현재 설정: URL 기반 (작동하지 않음)
- 필요한 설정: Command 기반

## 설정 방법

### 방법 1: Supabase Personal Access Token 사용 (권장)

1. **Supabase Personal Access Token 생성**
   - Supabase 대시보드 접속
   - 우측 상단 사용자 아이콘 클릭
   - "Account Preferences" → "Access Tokens" 이동
   - "Generate new token" 클릭
   - 토큰 이름 입력 후 생성
   - 생성된 토큰 복사 (한 번만 표시됨)

2. **MCP 설정 파일 업데이트**
   
   `C:\Users\user\.cursor\mcp.json` 파일을 다음과 같이 수정:

   ```json
   {
     "mcpServers": {
       "supabase": {
         "command": "npx",
         "args": [
           "-y",
           "@supabase/mcp-server-supabase@latest",
           "--access-token",
           "YOUR_PERSONAL_ACCESS_TOKEN_HERE"
         ]
       }
     }
   }
   ```

   `YOUR_PERSONAL_ACCESS_TOKEN_HERE`를 생성한 토큰으로 교체하세요.

### 방법 2: 프로젝트 URL과 Service Role Key 사용

환경 변수에서 Supabase 정보를 가져와서 사용할 수도 있습니다:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-url",
        "YOUR_SUPABASE_URL",
        "--service-role-key",
        "YOUR_SERVICE_ROLE_KEY"
      ]
    }
  }
}
```

## 설정 후

1. Cursor IDE 재시작
2. MCP 리소스 확인: `list_mcp_resources` 도구 사용
3. Supabase 데이터베이스에 직접 접근 가능

## 참고
- Personal Access Token은 Supabase 계정 레벨에서 작동합니다
- Service Role Key는 특정 프로젝트에만 적용됩니다
- 보안을 위해 토큰을 안전하게 보관하세요


