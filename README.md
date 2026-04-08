# Mini SaaS Repo

성능과 확장성을 고려한 현대적인 Monorepo 기반의 Full-stack SaaS 템플릿입니다. 효율적인 개발을 위해 Turborepo, NestJS, React(Vite)를 기반으로 구축되었습니다.

## 🚀 Tech Stack

### Frontend (`apps/admin-web`)

- **Core**: React 19, Vite, TypeScript
- **Routing**: TanStack Router
- **State Management**: Jotai, TanStack Query (v5)
- **Form Management**: TanStack Form, Zod
- **Styling**: Tailwind CSS (v4)
- **API Client**: Axios, Orval (Auto-generated from Swagger)
- **UI Components**: UI 공유 패키지 (`@repo/ui`)

### Backend (`apps/admin-api`)

- **Core**: NestJS (v11), TypeScript
- **ORM**: MikroORM (v7)
- **Query Builder**: Kysely (Type-safe SQL)
- **Database**: PostgreSQL
- **Documentation**: Swagger
- **Authentication**: JWT (jose), Bcrypt
- **Build**: esbuild, SWC

### Infrastructure & Tooling

- **Monorepo**: PNPM Workspaces, Turborepo
- **Configuration**: Shared config (`@repo/config`)
- **Utilities**: Shared utils (`@repo/utils`)
- **Environment**: Dotenvx (modern environment management)

## 📁 Project Structure

```text
root/
├── apps/
│   ├── admin-api/          # NestJS 백엔드 API
│   └── admin-web/          # React 어드민 프론트엔드
├── packages/
│   ├── ui/                 # 공통 UI 컴포넌트 라이브러리 (Tailwind v4)
│   ├── config/             # 공통 설정 (ESLint, TS, etc.)
│   └── utils/              # 공통 유틸리티 함수
├── .infra/                 # 인프라 설정 (Postgres, etc.)
└── turbo.json              # Turborepo 설정
```

## 🛠 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (Version >= 22)
- [PNPM](https://pnpm.io/) (Version 8.15.6)
- PostgreSQL (로컬 또는 Docker)

### Installation

```bash
# 의존성 설치
pnpm install
```

### Setup & Initialization

프로젝트 구동을 위해 필요한 데이터베이스 스키마 생성, 시드 데이터 삽입, API 클라이언트 생성을 한 번에 실행합니다.

```bash
pnpm set-up
```

### Running Development Server

모든 애플리케이션(API & Web)을 동시에 실행합니다.

```bash
pnpm dev
```

## 📜 Key Commands

- `pnpm dev`: 모든 앱의 개발 서버 실행
- `pnpm set-up`: DB 초기화 및 코드 생성 (Orval, Kysely)
- `pnpm build`: 전체 프로젝트 빌드
- `pnpm lint`: 전체 프로젝트 린트 체크
- `pnpm update:db`: (Backend) MikroORM 마이그레이션 적용

## 💡 Features

- **Standardized Form System**: `useAppForm` 패턴을 통한 일관된 폼 로직 및 Zod 검증.
- **Strict Type Safety**: 프론트엔드-백엔드 간 End-to-End 타입 안정성 보장 (Orval & Kysely).
- **Modern UI/UX**: Tailwind v4 및 최신 디자인 트렌드를 반영한 프리미엄 UI.
- **Scalable Architecture**: 기능별 모듈화 및 레이어드 아키텍처 적용.
- **API Documentation**: Swagger를 통한 자동 API 문서화 (`/docs`).
- **I18n Support**: 다국어 지원을 위한 `nestjs-i18n` 적용.
- **Audit Logging**: 데이터 변경 이력 추적을 위한 Audit 시스템.

## 🛠 Development Workflow

1. **Backend Development**: `apps/admin-api`에서 새로운 엔드포인트나 엔티티를 작성합니다.
2. **API Metadata**: `pnpm run setup:swagger`를 실행하여 Swagger 메타데이터를 갱신합니다.
3. **Frontend Sync**: `apps/admin-web`에서 `pnpm run set-up` (Orval)을 실행하여 프론트엔드 API 클라이언트를 자동 생성합니다.
4. **UI Development**: `packages/ui`에서 공통 컴포넌트를 정의하고 `admin-web`에서 사용합니다.

---
Created and maintained with ❤️ by [Antigravity](https://github.com/google-deepmind).
