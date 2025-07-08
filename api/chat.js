export default async function handler(req, res) {
    const { userMessage } = req.body;
  
    const messages = [
      { role: "system", content: "You are a helpful cooking assistant guiding a user through spinach tortellini." },
      { role: "user", content: userMessage }
    ];
  
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
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
  
    const data = await openaiRes.json();
    res.status(200).json({ reply: data.choices[0].message.content });
  }


