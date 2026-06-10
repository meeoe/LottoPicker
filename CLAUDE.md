# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

빌드 도구나 패키지 매니저 없는 순수 바닐라 JS 정적 웹앱. `index.html`을 브라우저에서 직접 열면 동작한다.

## 파일 구조

- `index.html` — HTML 마크업만 담당. 탭/패널/버튼 구조
- `style.css` — 모든 스타일. 브랜드 컬러는 `#ea3b5a`
- `script.js` — 모든 로직. 전역 함수로 작성되어 HTML의 `onclick`에서 직접 호출됨

## 핵심 로직 (script.js)

**데이터 레이어**
- `FREQ_DEFAULT` — 1~1157회 기준 1~45번 출현 빈도 하드코딩
- `FREQ`, `lastDrw` — localStorage 캐시에서 로드, 업데이트 시 덮어씀 (`CACHE_KEY`, `CACHE_DRW_KEY`)

**번호 생성 알고리즘** (`generateSet`이 `drawMode`에 따라 분기)
- `"random"` → `generateRandomSet`: 순수 랜덤
- `"weighted"` → `generateWeightedSet`: FREQ 빈도를 가중치로 확률적 추출
- `"toppool"` → `generateTopPoolSet`: 상위 20개 번호 풀에서 균등 추출

**고정번호**: `fixedNumbers` Set에 저장. 생성 시 항상 결과에 포함되고 나머지만 추첨

**데이터 업데이트** (`triggerUpdate`)
- 동행복권 API(`dhlottery.co.kr`)를 CORS 프록시를 통해 호출
- `corsproxy.io` 1차 시도 → 실패 시 `allorigins.win` 폴백
- `lastDrw + 1`부터 순차적으로 fetch, `returnValue !== "success"`이면 루프 종료

## 탭 구조

현재 탭은 "고정번호 설정"과 "인기번호" 두 개. 각 탭은 패널(`#fixed-panel`, `#popular-panel`) 표시 여부를 토글하며, 추첨 방식(`drawMode`) 선택 UI가 양쪽 패널에 동일하게 존재.
