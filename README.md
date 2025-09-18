# 상상력을 펼치는 글쓰기 - Imagine Sentences

실시간 창작 활동을 위한 웹 앱입니다. 교사와 학생이 함께 사진을 보고 창의적인 글을 작성할 수 있는 플랫폼입니다.

## 🚀 주요 기능

- **실시간 협업**: 교사와 학생이 실시간으로 창작 활동 진행
- **AI 도우미**: Gemini API를 활용한 창작 영감 제공
- **이미지 기반 활동**: Unsplash API를 통한 영감을 주는 이미지 제공
- **단계별 활동**: 낱말 → 문장 → 공감 순서로 진행되는 체계적인 창작 과정
- **PDF/CSV 내보내기**: 활동 결과를 다양한 형식으로 저장

## 📋 설정 방법

### 1. Firebase 설정

1. `public/js/firebase-config.template.js` 파일을 `firebase-config.js`로 복사
2. Firebase Console에서 프로젝트를 생성하고 웹 앱 등록
3. Firebase 설정 값을 `firebase-config.js`에 입력

```javascript
export const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.firebasestorage.app",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id",
    measurementId: "your-measurement-id"
};
```

### 2. Cloud Functions 환경 변수 설정

1. `functions/` 디렉토리에 `.env` 파일 생성
2. 다음 API 키들을 설정:

```bash
# Unsplash API Key (https://unsplash.com/developers)
UNSPLASH_ACCESS_KEY=your_unsplash_access_key

# Google Gemini API Key (https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=your_gemini_api_key
```

### 3. 배포

```bash
# Functions 배포
firebase deploy --only functions

# Hosting 배포
firebase deploy --only hosting

# 전체 배포
firebase deploy
```

## 🔒 보안 고려사항

- `functions/.env` 파일은 절대 Git에 커밋하지 마세요
- `public/js/firebase-config.js` 파일도 Git에 커밋하지 마세요
- API 키가 노출된 경우 즉시 새 키로 교체하세요

## 🎯 사용 방법

### 교사
1. Google 계정으로 로그인
2. 새 수업 생성
3. 활동 시작 → 낱말 입력 → 문장 쓰기 순서로 진행
4. 실시간으로 학생 활동 모니터링
5. 활동 완료 후 PDF/CSV로 결과 저장

### 학생
1. 교사가 제공한 참여 코드 입력
2. 각 단계에서 창의적인 작품 생성
3. 친구들의 작품에 공감 표시

## 🛠 기술 스택

- **Frontend**: Vanilla JavaScript, Tailwind CSS
- **Backend**: Firebase Functions (Node.js, TypeScript)
- **Database**: Cloud Firestore
- **Authentication**: Firebase Auth
- **AI Integration**: Google Gemini API
- **Image API**: Unsplash API
- **Hosting**: Firebase Hosting

## 📝 라이선스

MIT License
