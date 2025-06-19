// ▼▼▼ [수정] 파일 전체를 아래 내용으로 교체해주세요. ▼▼▼

const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Firebase Admin SDK 초기화
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
    });
  }
} catch (e) {
  console.error('Firebase admin initialization error', e.stack);
}
const db = admin.firestore();

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { classId } = JSON.parse(event.body);
        if (!classId) {
            return { statusCode: 400, body: JSON.stringify({ error: '클래스 ID가 필요합니다.' }) };
        }

        // 1. Firestore에서 해당 클래스의 이미지 설명을 가져옴
        const imageDocRef = db.doc(`classrooms/${classId}/sharedImages/current`);
        const imageDoc = await imageDocRef.get();
        if (!imageDoc.exists) {
            throw new Error("먼저 '활동 시작'으로 사진을 불러와주세요.");
        }
        const { alt1, alt2 } = imageDoc.data();

        // 2. Gemini API 호출
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

        const prompt = `You are a creative writing assistant for Korean elementary school students. Based on two themes, "${alt1 || 'a beautiful landscape'}" and "${alt2 || 'an interesting object'}", please perform the following two tasks and provide the response in a single, valid JSON object. Do not include any text outside the JSON object. The JSON object should have two properties: 1. "exampleSentence": A creative, fun, and easy-to-understand example sentence in Korean that connects the two themes. 2. "keywords": An array of 10 helpful and distinct keywords in Korean related to the themes.`;
        
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        };

        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!apiResponse.ok) {
            const errorBody = await apiResponse.text();
            console.error('Gemini API Error:', errorBody);
            throw new Error(`Gemini API 호출 실패: ${apiResponse.statusText}`);
        }
        
        const data = await apiResponse.json();
        const aiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!aiResponseText) {
            throw new Error("AI로부터 유효한 응답을 받지 못했습니다.");
        }

        // 3. Firestore에 AI 응답 결과 저장
        const aiHelperDocRef = db.doc(`classrooms/${classId}/aiHelper/current`);
        await aiHelperDocRef.set({
            content: aiResponseText,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
        };

    } catch (error) {
        console.error('Error in getAiInspiration function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || '서버에서 오류가 발생했습니다.' })
        };
    }
};