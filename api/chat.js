export default async function handler(req, res) {
  // تنظیم CORS برای امنیت و اجازه دسترسی
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'تنها متد POST مجاز است.' });
  }

  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'پیام خالی است.' });
  }

  // لیست کلیدهای API با قابلیت پشتیبان‌گیری
  const apiKeys = [
    "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",
    "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",
    "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",
    "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",
    "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"
  ];

  // دستورالعمل‌های رسمی دستیار فیزون
  const systemPrompt = `شما دستیار هوشمند و رسمی مجموعه «فیزون» به نام «فیزون بات» هستید. 
وظایف و قوانین شما:
۱. کاملاً محترمانه، رسمی، کوتاه و دقیق پاسخ دهید. از پاسخ‌های طولانی و حاشیه پرهیز کنید.
۲. هرگز سلام، احوال‌پرسی یا خوش‌آمدگویی نکنید (این کار از قبل انجام شده است).
۳. اگر درباره قیمت سوال شد: بگو قیمت‌ها از ۵۰ هزار تومان شروع می‌شود و متناسب با میزان سبک یا سنگین بودن پروژه و زمان ساخت متغیر است. برای دریافت قیمت دقیق به روبیکا یا واتساپ پیام دهند.
۴. شماره واتساپ و روبیکا: 09382061251
۵. آیدی پشتیبانی روبیکا: @Fizon_support
۶. کانال اطلاع‌رسانی روبیکا: @Fizon_site
۷. مزایای فیزون: سرعت بالای اجرا، کیفیت پریمیوم و قیمت بسیار مناسب و رقابتی. ساخت انواع وب‌سایت‌ها.
۸. شما توسط تیم فیزون طراحی و توسعه یافته‌اید. هرگز نامی از Groq، Llama یا سایر سرویس‌ها نبرید.`;

  // شفل رندوم کلیدها برای توزیع بار
  const shuffledKeys = [...apiKeys].sort(() => 0.5 - Math.random());

  const messagesPayload = [
    { role: "system", content: systemPrompt },
    ...(history || []),
    { role: "user", content: message }
  ];

  // تلاش برای دریافت پاسخ با مکانیزم Fallback در صورت خطای کلیدها
  for (const apiKey of shuffledKeys) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: messagesPayload,
          temperature: 0.5,
          max_tokens: 500
        })
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.choices[0]?.message?.content || "در حال حاضر امکان پاسخگویی وجود ندارد.";
        return res.status(200).json({ reply });
      }
    } catch (err) {
      console.error("API Key Error, switching to next key...");
    }
  }

  return res.status(500).json({ error: "خطا در ارتباط با سرور هوش مصنوعی." });
                    }
