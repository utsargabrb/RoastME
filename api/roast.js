export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

    if (!process.env.GROQ_API_KEY) {
        return res.status(500).json({ error: 'Missing GROQ_API_KEY.' });
    }

    const { name, job, hobby, flaw, intensity } = req.body;

    const INTENSITY = {
        mild: 'friendly and lighthearted, poking fun gently',
        medium: 'honest and sharp, holding nothing back but staying funny',
        savage: 'absolutely ruthless and savage — brutal but still comedic, zero mercy'
    };

    const details = [
        job ? `They work as a ${job}.` : '',
        hobby ? `Their hobby is ${hobby}.` : '',
        flaw ? `Their admitted flaw is: ${flaw}.` : ''
    ].filter(Boolean).join(' ');

    const prompt = `You are a comedian at a Comedy Central roast. Be ${INTENSITY[intensity] || INTENSITY.medium}. Write a 3-4 sentence roast of ${name}. ${details} Make it funny, specific, and punchy. End with a mic-drop one-liner. Plain text only, no asterisks.`;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                max_tokens: 300,
                messages: [{ role: 'user', content: prompt }]
            })
        });

        const data = await response.json();
        if (!response.ok) {
            const message = data?.error?.message || 'Upstream request failed.';
            return res.status(response.status).json({ error: message });
        }

        const roast = data?.choices?.[0]?.message?.content || 'No roast generated.';
        return res.status(200).json({ roast });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to generate roast.' });
    }
}
