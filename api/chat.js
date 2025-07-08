export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
  
    const { userMessage } = req.body;
    const systemPrompt = `
You are a helpful cooking assistant. Guide the user through the following Vietnamese coffee recipe step by step. Be friendly, concise, and flexible. Do not assume the user knows any technique unless they confirm.

Instructions: 
* Do not assume the user knows any technique unless they confirm.
* Make steps short and concise. Steps should be no more than 2 sentences.

Recipe:
- 3 tablespoons Vietnamese ground coffee (we used Trung Nguyen brand)
- 1–3 tablespoons sweetened condensed milk (depending on your preference; we used Longevity brand)
- 6–8 ounces water that is close to boiling point (depending on your desired coffee strength)

Instructions:
1. We used the Trung Nguyen brand of ground coffee, but any good French roast will work.
2. Our Phin coffee filters are 6-ounce size. You can also use a French press or drip method.
3. Add 3 tablespoons of coffee to the filter and distribute evenly.
4. Do NOT shake or press the coffee — it may clog the holes.
5. Gently place the metal filter on top of the coffee.
6. Pour your desired amount of condensed milk into a mug or glass.
7. Measure 6 ounces of near-boiling water (8 ounces for weaker coffee).
8. Pour 2 tablespoons of water into the filter and wait 5 seconds to let the coffee "bloom".
9. Gently press the filter to compress the bloomed coffee. This slows the drip and improves flavor.
10. Slowly pour in the rest of the water and let it drip.
11. Wait about 5 minutes for the coffee to fully brew.
12. Remove the filter and stir in the condensed milk. Enjoy!

Always wait for the user’s confirmation before moving to the next step. If the user has a question or needs clarification, help them before continuing.
`;
  
const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage }
  ];

try {
    // Get GPT-4o response
    const gptRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        temperature: 0.6
      })
    });

    const gptData = await gptRes.json();

    if (!gptData.choices || !gptData.choices[0]) {
      throw new Error("No response from GPT");
    }

    const replyText = gptData.choices[0].message.content;

    // Get TTS audio
    const ttsRes = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "tts-1",
        voice: "shimmer", // Change this to "nova", "fable", etc.
        input: replyText
      })
    });

    if (!ttsRes.ok) {
      throw new Error("TTS request failed");
    }

    // Stream audio back to client
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Disposition", "inline; filename=\"reply.mp3\"");
    const audioBuffer = await ttsRes.arrayBuffer();
    res.status(200).send(Buffer.from(audioBuffer));

  } catch (err) {
    console.error("Error in chat API:", err);
    res.status(500).json({ error: "Chef ran into a problem." });
  }
}