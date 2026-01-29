# zm-draw 실시간 협업 설정 가이드

> Phase 11: Yjs 기반 실시간 협업

---

## 개요

zm-draw는 [Yjs](https://yjs.dev/) CRDT 라이브러리를 사용하여 실시간 협업을 지원합니다.

### 주요 기능

- **실시간 동기화**: 도형, 커넥터 변경 즉시 동기화
- **커서 공유**: 다른 사용자 커서 위치 실시간 표시
- **선택 공유**: 원격 사용자가 선택한 도형 하이라이트
- **오프라인 지원**: IndexedDB로 로컬 저장, 재연결 시 자동 동기화
- **충돌 해결**: CRDT 기반 자동 충돌 해결

---

## 사용법

### 1. 기본 사용 (협업 비활성화)

```tsx
import { DrawCanvas } from '@zm-draw/react';

function App() {
  return <DrawCanvas />;
}
```

### 2. 오프라인 협업 모드

IndexedDB에 저장하여 브라우저 간 데이터 공유 (동일 기기):

```tsx
import { DrawCanvas } from '@zm-draw/react';

function App() {
  return (
    <DrawCanvas
      collaborationEnabled={true}
      roomId="my-project-123"
      userName="사용자이름"
    />
  );
}
```

### 3. 실시간 협업 모드

WebSocket 서버를 통한 멀티 유저 협업:

```tsx
import { DrawCanvas } from '@zm-draw/react';

function App() {
  return (
    <DrawCanvas
      collaborationEnabled={true}
      roomId="my-project-123"
      serverUrl="wss://your-server.com"
      userName="사용자이름"
    />
  );
}
```

---

## WebSocket 서버 설정

### 옵션 1: y-websocket 서버 (권장)

가장 간단한 방법으로 공식 y-websocket 서버를 사용합니다.

#### 설치 및 실행

```bash
# 전역 설치
npm install -g y-websocket

# 서버 실행 (기본 포트 1234)
y-websocket-server

# 또는 포트 지정
PORT=4000 y-websocket-server
```

#### Docker 사용

```dockerfile
FROM node:20-alpine
RUN npm install -g y-websocket
EXPOSE 1234
CMD ["y-websocket-server"]
```

```bash
docker build -t yjs-server .
docker run -p 1234:1234 yjs-server
```

#### 연결

```tsx
<DrawCanvas
  collaborationEnabled={true}
  roomId="my-room"
  serverUrl="ws://localhost:1234"
/>
```

### 옵션 2: 커스텀 Node.js 서버

더 많은 제어가 필요한 경우:

```javascript
// server.js
const WebSocket = require('ws');
const http = require('http');
const { setupWSConnection } = require('y-websocket/bin/utils');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('zm-draw Collaboration Server');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  setupWSConnection(ws, req);
});

const PORT = process.env.PORT || 1234;
server.listen(PORT, () => {
  console.log(`Collaboration server running on port ${PORT}`);
});
```

```bash
node server.js
```

### 옵션 3: 영구 저장소 연결

MongoDB나 Redis와 연결하여 데이터 영구 저장:

```javascript
// server-with-persistence.js
const WebSocket = require('ws');
const http = require('http');
const { setupWSConnection, docs } = require('y-websocket/bin/utils');
const { MongodbPersistence } = require('y-mongodb-provider');

// MongoDB 연결
const mdb = new MongodbPersistence('mongodb://localhost:27017/zm-draw', {
  collectionName: 'yjs-documents',
});

const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', async (ws, req) => {
  setupWSConnection(ws, req, {
    gc: true,
    persistence: mdb,
  });
});

server.listen(1234);
```

---

## 프로덕션 배포

### Nginx 리버스 프록시 (WSS)

```nginx
server {
    listen 443 ssl;
    server_name collab.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:1234;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }
}
```

### 환경 변수

```bash
# .env
NEXT_PUBLIC_COLLAB_SERVER=wss://collab.example.com
```

```tsx
<DrawCanvas
  collaborationEnabled={true}
  roomId={projectId}
  serverUrl={process.env.NEXT_PUBLIC_COLLAB_SERVER}
  userName={user.name}
/>
```

---

## Props 레퍼런스

| Prop | Type | Default | 설명 |
|------|------|---------|------|
| `collaborationEnabled` | `boolean` | `false` | 협업 모드 활성화 |
| `roomId` | `string` | - | 협업 룸 ID (필수) |
| `serverUrl` | `string` | - | WebSocket 서버 URL (없으면 오프라인 모드) |
| `userName` | `string` | `User XXX` | 사용자 표시 이름 |

---

## 트러블슈팅

### 연결이 안 되는 경우

1. **CORS 확인**: 서버에서 CORS 허용 필요
2. **WSS/WS 프로토콜**: HTTPS 사이트는 WSS만 허용
3. **방화벽**: 포트가 열려있는지 확인

### 동기화가 안 되는 경우

1. **roomId 일치**: 모든 클라이언트가 동일한 roomId 사용
2. **IndexedDB 충돌**: 개발 중 데이터 초기화 필요 시 DevTools에서 IndexedDB 삭제

### 성능 최적화

1. **서버 위치**: 사용자와 가까운 리전에 서버 배치
2. **커넥션 풀링**: 동시 접속자 수에 따라 서버 스케일링

---

## 아키텍처

```
┌─────────────────┐      ┌─────────────────┐
│   Client A      │      │   Client B      │
│  ┌───────────┐  │      │  ┌───────────┐  │
│  │ DrawCanvas│  │      │  │ DrawCanvas│  │
│  │   + Yjs   │  │      │  │   + Yjs   │  │
│  └─────┬─────┘  │      │  └─────┬─────┘  │
│        │        │      │        │        │
│  ┌─────▼─────┐  │      │  ┌─────▼─────┐  │
│  │ IndexedDB │  │      │  │ IndexedDB │  │
│  │ (offline) │  │      │  │ (offline) │  │
│  └───────────┘  │      │  └───────────┘  │
└────────┬────────┘      └────────┬────────┘
         │                        │
         │    WebSocket (WSS)     │
         └──────────┬─────────────┘
                    │
           ┌────────▼────────┐
           │  y-websocket    │
           │    Server       │
           │  ┌───────────┐  │
           │  │ MongoDB   │  │ (optional)
           │  │ /Redis    │  │
           │  └───────────┘  │
           └─────────────────┘
```

---

## 다음 단계

- [ ] 인증/권한 관리 (JWT 연동)
- [ ] 룸별 접근 제어
- [ ] 변경 히스토리/버전 관리
- [ ] 댓글 기능 연동

---

*최종 업데이트: 2026-01-29*
