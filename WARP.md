# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Imagine Sentences** is a collaborative Korean creative writing web application for elementary school students. Teachers can create classrooms and guide students through structured writing activities using AI-generated inspirational images and keywords.

## Architecture Overview

### Frontend (Single HTML File)
- **Technology**: Vanilla JavaScript with Firebase v11 modules, TailwindCSS
- **File**: `index.html` (~960 lines) - Complete SPA with multiple screens
- **Authentication**: Google OAuth for teachers, anonymous auth for students
- **Real-time**: Firestore real-time listeners for live collaboration

### Backend (Netlify Serverless Functions)
- **Runtime**: Node.js with Firebase Admin SDK
- **Location**: `netlify/functions/` directory
- **Functions**:
  - `startNewActivity.js` - Fetches Unsplash images, resets classroom data
  - `getAiInspiration.js` - Integrates with Gemini AI for creative prompts
  - `verifyPassword.js` - Basic password verification (legacy)
  - `fetchImage.js` - Unsplash API wrapper (unused)

### Database (Firestore)
```
classrooms/{classId}/
├── appState/current - Current activity phase
├── sharedImages/current - Unsplash images for inspiration
├── aiHelper/current - AI-generated keywords and example sentences
├── words/{wordId} - Student-submitted words
└── sentences/{sentenceId} - Student-submitted sentences with likes
```

## Common Development Commands

### Local Development
```bash
# Start local HTTP server (as noted in user rules)
cd /Users/hanseungryun/Dev/gravitrax_simulation && python3 -m http.server 8000

# For this project specifically
python3 -m http.server 8000
# Then access: http://localhost:8000
```

### Dependencies
```bash
# Install serverless function dependencies
npm install firebase-admin node-fetch
```

### Environment Variables (Netlify)
Required environment variables for deployment:
- `FIREBASE_SERVICE_ACCOUNT_KEY` - Firebase Admin SDK credentials
- `UNSPLASH_ACCESS_KEY` - Unsplash API key for image fetching
- `GEMINI_API_KEY` - Google Gemini API key for AI content generation

## Key Application Flow

### Teacher Flow
1. Google OAuth login → Dashboard
2. Create classroom → Get join code
3. Enter classroom → Teacher control panel
4. "활동 시작" (Start Activity) → Fetch random images
5. "낱말 입력" (Word Input) → Students submit words
6. "문장 쓰기" (Sentence Writing) → Students write sentences
7. Export results as PDF/CSV

### Student Flow
1. Enter 6-digit join code → Anonymous login
2. View images → Submit individual words
3. See collective "word cloud" → Write creative sentences
4. Real-time feed shows all sentences with like system

### Activity Phases
- `waiting` - Initial state, images loading
- `images_only` - Images displayed, word input enabled
- `word_input_active` - Students can submit words, sentence input enabled
- `sentence_input_active` - All features active

## Real-time Features
- **Live word cloud**: Aggregates and displays all student words with frequency-based sizing
- **Sentence feed**: Real-time stream of student sentences with like counts
- **Phase synchronization**: All clients automatically update based on teacher controls
- **AI suggestions**: Live updates when teacher requests AI inspiration

## Key Technical Patterns

### State Management
- Global variables: `currentUser`, `currentClassId`, `activeListeners`
- Phase-based UI showing/hiding using CSS classes
- Firestore real-time listeners with cleanup on navigation

### Authentication Handling
```javascript
// Teachers: Google OAuth
signInWithPopup(auth, new GoogleAuthProvider())

// Students: Anonymous authentication
signInAnonymously(auth)
```

### Data Synchronization
All real-time updates use Firestore `onSnapshot()` listeners with proper cleanup in `activeListeners` array.

## External Dependencies
- **Firebase**: Authentication, Firestore, hosting
- **Unsplash API**: Random inspirational images
- **Google Gemini AI**: Creative writing prompts and keyword generation
- **TailwindCSS**: Styling framework
- **html2canvas + jsPDF**: PDF export functionality

## Security Considerations
- Teachers authenticated via Google OAuth
- Students use anonymous authentication (no persistent data)
- Firestore security rules protect teacher-only operations
- Environment variables protect API keys
- Input validation for join codes and form submissions

## Development Notes
- Single HTML file approach keeps deployment simple
- Netlify Functions handle API integrations and data operations
- Korean language interface with culturally appropriate educational patterns
- Real-time collaboration designed for classroom engagement
- Export features support teacher assessment and record-keeping