"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAiInspiration = exports.startNewActivity = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const node_fetch_1 = require("node-fetch");
// Firebase Admin 초기화
admin.initializeApp();
// Interface definitions removed - using 'any' type for simplicity
/**
 * 새로운 활동 시작 - Unsplash 이미지 가져오기 및 데이터 초기화
 */
exports.startNewActivity = functions.https.onCall(async (data, context) => {
    try {
        console.log('startNewActivity called with data:', JSON.stringify(data));
        const classId = data === null || data === void 0 ? void 0 : data.classId;
        console.log('Extracted classId:', classId);
        if (!classId || typeof classId !== 'string') {
            console.error('Invalid or missing classId:', classId);
            throw new functions.https.HttpsError('invalid-argument', '클래스 ID가 필요합니다.');
        }
        const db = admin.firestore();
        // 1. 기존 데이터 삭제
        const collectionsToClear = ['sentences', 'words'];
        const deletePromises = collectionsToClear.map(async (collectionName) => {
            const snapshot = await db.collection(`classrooms/${classId}/${collectionName}`).get();
            const batch = db.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            if (snapshot.docs.length > 0) {
                await batch.commit();
            }
        });
        await Promise.all(deletePromises);
        // AI Helper 및 앱 상태 초기화
        await db.doc(`classrooms/${classId}/aiHelper/current`).delete().catch(() => { });
        await db.doc(`classrooms/${classId}/appState/current`).set({ currentPhase: 'waiting' });
        // 2. Unsplash에서 새 이미지 가져오기
        const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
        if (!UNSPLASH_ACCESS_KEY) {
            throw new functions.https.HttpsError('failed-precondition', 'Unsplash API 키가 설정되지 않았습니다.');
        }
        const fetchRandomImage = async (query) => {
            const response = await (0, node_fetch_1.default)(`https://api.unsplash.com/photos/random?query=${query}&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`);
            if (!response.ok) {
                throw new Error(`Unsplash API error: ${response.statusText}`);
            }
            return await response.json();
        };
        const [imageData1, imageData2] = await Promise.all([
            fetchRandomImage('inspiration'),
            fetchRandomImage('creativity')
        ]);
        // 3. Firestore에 새 이미지 정보 저장
        await db.doc(`classrooms/${classId}/sharedImages/current`).set({
            url1: imageData1.urls.regular,
            alt1: imageData1.alt_description,
            url2: imageData2.urls.regular,
            alt2: imageData2.alt_description,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // 4. 앱 상태를 'images_only'로 변경
        await db.doc(`classrooms/${classId}/appState/current`).set({ currentPhase: 'images_only' }, { merge: true });
        return { success: true, message: '새로운 활동이 성공적으로 시작되었습니다.' };
    }
    catch (error) {
        console.error('Error in startNewActivity:', error);
        throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : '서버에서 오류가 발생했습니다.');
    }
});
/**
 * AI 영감 생성 - Gemini API를 사용하여 창작 도움말 생성
 */
exports.getAiInspiration = functions.https.onCall(async (data, context) => {
    var _a, _b, _c, _d, _e;
    try {
        console.log('getAiInspiration called with data:', JSON.stringify(data));
        const classId = data === null || data === void 0 ? void 0 : data.classId;
        console.log('Extracted classId:', classId);
        if (!classId || typeof classId !== 'string') {
            console.error('Invalid or missing classId:', classId);
            throw new functions.https.HttpsError('invalid-argument', '클래스 ID가 필요합니다.');
        }
        const db = admin.firestore();
        // 1. Firestore에서 해당 클래스의 이미지 설명을 가져옴
        const imageDoc = await db.doc(`classrooms/${classId}/sharedImages/current`).get();
        if (!imageDoc.exists) {
            throw new functions.https.HttpsError('failed-precondition', "먼저 '활동 시작'으로 사진을 불러와주세요.");
        }
        const { alt1, alt2 } = imageDoc.data();
        // 2. Gemini API 호출
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            throw new functions.https.HttpsError('failed-precondition', 'Gemini API 키가 설정되지 않았습니다.');
        }
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const prompt = `You are a creative writing assistant for Korean elementary school students. Based on two themes, "${alt1 || 'a beautiful landscape'}" and "${alt2 || 'an interesting object'}", please perform the following two tasks and provide the response in a single, valid JSON object. Do not include any text outside the JSON object. The JSON object should have two properties: 1. "exampleSentence": A creative, fun, and easy-to-understand example sentence in Korean that connects the two themes. 2. "keywords": An array of 10 helpful and distinct keywords in Korean related to the themes.`;
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        };
        const apiResponse = await (0, node_fetch_1.default)(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!apiResponse.ok) {
            const errorBody = await apiResponse.text();
            console.error('Gemini API Error:', errorBody);
            throw new Error(`Gemini API 호출 실패: ${apiResponse.statusText}`);
        }
        const responseData = await apiResponse.json();
        const aiResponseText = (_e = (_d = (_c = (_b = (_a = responseData.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text;
        if (!aiResponseText) {
            throw new Error("AI로부터 유효한 응답을 받지 못했습니다.");
        }
        // 3. Firestore에 AI 응답 결과 저장
        await db.doc(`classrooms/${classId}/aiHelper/current`).set({
            content: aiResponseText,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true };
    }
    catch (error) {
        console.error('Error in getAiInspiration:', error);
        throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : '서버에서 오류가 발생했습니다.');
    }
});
//# sourceMappingURL=index.js.map