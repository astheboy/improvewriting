exports.handler = async function(event, context) {
    const { query } = event.queryStringParameters;
    const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
    const url = `https://api.unsplash.com/photos/random?query=${query}&orientation=landscape&content_filter=low&client_id=${UNSPLASH_ACCESS_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            return { statusCode: response.status, body: response.statusText };
        }
        const data = await response.json();
        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch image' }) };
    }
};