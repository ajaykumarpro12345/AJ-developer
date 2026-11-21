// Firebase configuration, Firestore lead storage, & email notification for AJ Developers
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAnalytics, isSupported, logEvent } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const NOTIFY_EMAIL = "ajaypro123456@gmail.com";

const firebaseConfig = {
  apiKey: "AIzaSyCRRr82xbQjyD7I8tXm9dB3n5YwgiNEC0E",
  authDomain: "aj-developer-7467b.firebaseapp.com",
  projectId: "aj-developer-7467b",
  storageBucket: "aj-developer-7467b.firebasestorage.app",
  messagingSenderId: "765965604201",
  appId: "1:765965604201:web:4e11e7918835f3febf99f8",
  measurementId: "G-7HG71RJYQ8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let analytics = null;
isSupported().then((ok) => {
  if (ok) analytics = getAnalytics(app);
}).catch(() => {});

async function sendEmailNotification(payload) {
  // 1. Prefer our Vercel Gmail SMTP endpoint (lands directly in Gmail Primary inbox)
  try {
    const apiRes = await fetch("/api/send-inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    });
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data && data.ok) return data;
    }
  } catch (_) {
    // Fall through to FormSubmit if /api/send-inquiry is unavailable
  }

  // 2. Fallback to FormSubmit if GMAIL_APP_PASSWORD isn't set in Vercel yet
  const body = {
    _subject: `New ${payload.packageType} Inquiry from ${payload.name} — AJ Developers`,
    _replyto: payload.email,
    _template: "table",
    _captcha: "false",
    "Name": payload.name,
    "Email": payload.email,
    "Mobile Number": payload.mobile,
    "Service Package": payload.packageType,
    "Website Type": payload.websiteType,
    "APK Type": payload.apkType || "N/A (Website only)",
    "Product Description": payload.description,
    "Reference URL": payload.referenceUrl || "Not provided",
    "Submitted From": payload.pageUrl
  };

  const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(NOTIFY_EMAIL)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error("Email notification failed: HTTP " + res.status);
  return res.json();
}

async function submitInquiry(data) {
  const payload = {
    name: (data.name || "").trim(),
    email: (data.email || "").trim(),
    mobile: (data.mobile || "").trim(),
    packageType: (data.packageType || "Website").trim(),
    websiteType: (data.websiteType || "").trim(),
    apkType: (data.apkType || "").trim(),
    description: (data.description || "").trim(),
    referenceUrl: (data.referenceUrl || "").trim(),
    notifyEmail: NOTIFY_EMAIL,
    pageUrl: window.location.href
  };

  const [firestoreResult, emailResult] = await Promise.allSettled([
    addDoc(collection(db, "inquiries"), {
      ...payload,
      createdAt: serverTimestamp()
    }),
    sendEmailNotification(payload)
  ]);

  if (firestoreResult.status === "rejected") {
    console.warn("Firestore save error:", firestoreResult.reason);
  }
  if (emailResult.status === "rejected") {
    console.warn("Email notification error:", emailResult.reason);
  }

  if (analytics) {
    try {
      logEvent(analytics, "generate_lead", {
        currency: "USD",
        value: 1,
        package_type: payload.packageType,
        website_type: payload.websiteType,
        apk_type: payload.apkType || "none"
      });
    } catch (_) {}
  }

  return {
    firestoreId: firestoreResult.status === "fulfilled" ? firestoreResult.value.id : null,
    emailed: emailResult.status === "fulfilled"
  };
}

window.AJFirebase = { app, db, getAnalytics: () => analytics, submitInquiry };
