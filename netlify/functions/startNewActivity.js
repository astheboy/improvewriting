// 이 함수는 Node.js 환경에서 실행됩니다.
// 필요한 패키지를 설치해야 할 수 있습니다: npm install firebase-admin node-fetch
const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Firebase Admin SDK 초기화
// Netlify 환경 변수에서 서비스 계정 키를 가져옵니다.
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

// Firestore의 하위 컬렉션을 재귀적으로 삭제하는 헬퍼 함수
async function deleteCollection(collectionPath, batchSize) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(query, resolve).catch(reject);
    });
}
async function deleteQueryBatch(query, resolve) {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
        resolve();
        return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    process.nextTick(() => {
        deleteQueryBatch(query, resolve);
    });
}


exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { classId } = JSON.parse(event.body);
        if (!classId) {
            return { statusCode: 400, body: JSON.stringify({ error: '클래스 ID가 필요합니다.' }) };
        }

        // 1. 기존 데이터 삭제
        const collectionsToClear = ['sentences', 'words'];
        const deletionPromises = collectionsToClear.map(col => 
            deleteCollection(`classrooms/${classId}/${col}`, 50)
        );
        await Promise.all(deletionPromises);
        await db.doc(`classrooms/${classId}/aiHelper/current`).delete().catch(() => {});
        await db.doc(`classrooms/${classId}/appState/current`).set({ currentPhase: 'waiting' });
        
        // 2. Unsplash에서 새 이미지 가져오기
        const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
        const fetchRandomImage = async (query) => {
            const response = await fetch(`https://api.unsplash.com/photos/random?query=${query}&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`);
            if (!response.ok) throw new Error(`Unsplash API error`);
            return await response.json();
        };

        const [imageData1, imageData2] = await Promise.all([
            fetchRandomImage('inspiration'), 
            fetchRandomImage('creativity')
        ]);

        // 3. Firestore에 새 이미지 정보 저장
        const imageDocRef = db.doc(`classrooms/${classId}/sharedImages/current`);
        await imageDocRef.set({
            url1: imageData1.urls.regular,
            alt1: imageData1.alt_description,
            url2: imageData2.urls.regular,
            alt2: imageData2.alt_description,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // 4. 앱 상태를 'images_only'로 변경
        const appStateRef = db.doc(`classrooms/${classId}/appState/current`);
        await appStateRef.set({ currentPhase: 'images_only' }, { merge: true });

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: '새로운 활동이 성공적으로 시작되었습니다.' })
        };

    } catch (error) {
        console.error('Error in startNewActivity function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || '서버에서 오류가 발생했습니다.' })
        };
    }
};