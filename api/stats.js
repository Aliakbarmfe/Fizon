import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, get, set } from "firebase/database";

// تنظیمات فایربیس شما
const firebaseConfig = {
  apiKey: "AIzaSyBf6nxS2nWph40jFP5-o-ZLErRcY8Fg2ss",
  authDomain: "fizon-e957c.firebaseapp.com",
  databaseURL: "https://fizon-e957c-default-rtdb.firebaseio.com",
  projectId: "fizon-e957c",
  storageBucket: "fizon-e957c.firebasestorage.app",
  messagingSenderId: "147023014021",
  appId: "1:147023014021:web:9495549e4b5d5e2ebd61ec"
};

// جلوگیری از مقداردهی چندباره Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

// بازه‌های زمانی متغیر و رندوم (به میلی‌ثانیه): ۱۵، ۵، ۲۰، ۲۵، ۲ دقیقه
const INTERVALS = [
  15 * 60 * 1000,
  5 * 60 * 1000,
  20 * 60 * 1000,
  25 * 60 * 1000,
  2 * 60 * 1000
];

export default async function handler(req, res) {
  // تنظیم CORS برای اجازه دسترسی
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const statsRef = ref(db, 'site_stats');
    const snapshot = await get(statsRef);
    const now = Date.now();

    let stats = {
      totalVisits: 4583, // عدد پایه رندوم
      todayVisits: 120,   // عدد اولیه بازدید امروز
      lastUpdate: now,
      nextInterval: INTERVALS[0],
      dayStartTime: now
    };

    if (snapshot.exists()) {
      stats = snapshot.val();
    }

    let isUpdated = false;

    // ۱. بررسی ریست ۲۴ ساعته (آمار روزانه)
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (now - stats.dayStartTime >= twentyFourHours) {
      stats.todayVisits = 0;
      stats.dayStartTime = now;
      isUpdated = true;
    }

    // ۲. بررسی زمان افزودن بازدید (بازدید کل و امروز به‌طور هم‌زمان ۱۰ تا اضافه می‌شوند)
    const currentInterval = stats.nextInterval || INTERVALS[0];
    if (now - stats.lastUpdate >= currentInterval) {
      stats.totalVisits += 10;
      stats.todayVisits += 10;
      stats.lastUpdate = now;
      
      // انتخاب بازه زمانی رندوم بعدی از بین مقادیر (۱۵، ۵، ۲۰، ۲۵، ۲ دقیقه)
      const randomIndex = Math.floor(Math.random() * INTERVALS.length);
      stats.nextInterval = INTERVALS[randomIndex];
      
      isUpdated = true;
    }

    // ذخیره تغییرات در دیتابیس فایربیس
    if (isUpdated || !snapshot.exists()) {
      await set(statsRef, stats);
    }

    // محاسبه زمان باقی‌مانده تا ریست آمار روزانه (۲۴ ساعت)
    const timeElapsedToday = now - stats.dayStartTime;
    const timeRemainingToday = Math.max(0, twentyFourHours - timeElapsedToday);
    
    const hoursLeft = Math.floor(timeRemainingToday / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeRemainingToday % (1000 * 60 * 60)) / (1000 * 60));

    return res.status(200).json({
      totalVisits: stats.totalVisits,
      todayVisits: stats.todayVisits,
      hoursLeft: hoursLeft,
      minutesLeft: minutesLeft
    });

  } catch (error) {
    console.error("Firebase Error:", error);
    return res.status(500).json({ error: "خطا در برقراری ارتباط با دیتابیس." });
  }
}
