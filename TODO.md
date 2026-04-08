# Project TODO List

핵심 비즈니스 로직 중 미구현되었거나 하드코딩된 목업(Mockup) 데이터 부분에 대한 개선 작업 목록입니다.

## 📊 Dashboard (지표 및 통계)

- [ ] **비즈니스 대시보드 (`DashboardService`)**
  - [ ] 실제 프로젝트 매출(Sales) 및 지표 집계 로직 구현
  - [ ] 조직별 리소스 사용률(Usage) 계산 엔진 연동
  - [ ] 구독 중인 요금제(Plan) 정보 매핑 및 실시간 동기화
- [ ] **플랫폼 대시보드 (`Platform DashboardService`)**
  - [ ] 전체 테넌트 수익 합산 및 정산 예정 금액 자동 계산
  - [ ] 시스템 상태 체크 모니터링 API 연동 (System Health)
  - [ ] 정산 대기 데이터 카운트 및 알림 로직 구현

## 💰 Billing & Settlement (결제 및 정산)

- [ ] **요금제 관리 (`Pricing Page`)**
  - [ ] 요금제 변경(업그레이드/다운그레이드) 신청 프로세스 구현
  - [ ] 결제 수단 등록 및 자동 결제 연동 (Stripe 등 연동 고려)
- [ ] **정산 시스템 (`Settlement Page`)**
  - [ ] 정산 상세 정보 내역 조회 및 리포트 다운로드 기능
  - [ ] 정산 승인/반려 처리 관리자 워크플로우 구현

## 🏢 Platform & Customer Management (운영 관리)

- [ ] **플랫폼 서비스 구조 설계 (Service & Customer Management)**
  - [ ] 전체 테넌트(고객사) 목록 조회 및 상세 관리(상태 변경, 강제 중지 등) 기능
  - [ ] 플랫폼 서비스(SaaS 기능) 엔티티 모델링 및 동적 활성화 시스템 구축
  - [ ] 테넌트별 구독 정보 및 요금제 관리 로직 정교화 (현재 metadata 기반에서 독립 엔티티 체계로 전환)
- [ ] **초기 가입 및 온보딩 고도화**
  - [ ] 테넌트 생성 시 기본 설정(요금제, 초기 스태프 등) 자동화 워크플로우

## 🔐 Auth & Security

- [ ] **인증 체계 통합**
  - [ ] MFA(다요소 인증)의 실제 전송 로직 (SMS/Email) 연동

## 🎨 UI/UX Enhancement

## ⚙️ Build System & Infra (Turborepo & Dev Process)

- [ ] **Turborepo & Orval 빌드 프로세스 최적화**
  - [ ] Orval의 API 서버 의존성 처리
  - [ ] `turbo.json` 태스크 그래프 정교화: `set-up` -> `pre-build` -> `build` -> `dev` 흐름의 결정론적 순서 보장
- [ ] **CI/CD 파이프라인 연동**
  - [ ] GitHub Actions를 이용한 자동 빌드 및 테스트 환경 구축

---
마지막 업데이트: 2026-04-08
