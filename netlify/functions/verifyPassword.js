// File: netlify/functions/verifyPassword.js

exports.handler = async function(event, context) {
    // POST 요청이 아니면 에러 처리
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // 클라이언트가 보낸 비밀번호
        const { password } = JSON.parse(event.body);
        
        // Netlify 환경 변수에 저장된 실제 비밀번호
        const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD;

        // 비밀번호 일치 여부 확인
        const isValid = password === TEACHER_PASSWORD;

        // 결과를 JSON 형태로 클라이언트에 반환
        return {
            statusCode: 200,
            body: JSON.stringify({ success: isValid })
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
    }
};