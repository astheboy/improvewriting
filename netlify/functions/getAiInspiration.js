exports.handler = async function(event, context) {
    const { alt1, alt2 } = JSON.parse(event.body);
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `You are a creative writing assistant for Korean elementary school students. Based on two themes, "${alt1 || 'a beautiful landscape'}" and "${alt2 || 'an interesting object'}", please perform the following two tasks and provide the response in a single, valid JSON object. Do not include any text outside the JSON object. 1. "exampleSentence": Write one creative, fun, and easy-to-understand example sentence in Korean that connects the two themes. 2. "keywords": Suggest 5 helpful keywords in Korean for each theme. The result should be an object with two keys, "theme1" and "theme2", each containing an array of 5 strings.`;
    const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            return { statusCode: response.status, body: response.statusText };
        }
        const data = await response.json();
        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Failed to get AI inspiration' }) };
    }
};