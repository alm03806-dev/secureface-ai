# SecureFace live করার নিয়ম (Vercel + Render)

এক GitHub repo থেকেই দুটো চলবে:
- **Frontend** (ওয়েবসাইট) → Vercel
- **Backend** (FastAPI + AI model) → Render (free)

সব কাজ browser আর GitHub Desktop দিয়ে করা যায়, terminal লাগবে না।

---

## ধাপ ১: কোড GitHub-এ তুলুন (GitHub Desktop দিয়ে)

> browser-এ "Upload files" দিয়ে হবে না: সেখানে ২৫ MB-র বেশি ফাইল নেয় না, আর `face_recognition_sface.onnx` ৩৭ MB। GitHub Desktop ১০০ MB পর্যন্ত নেয়।

1. https://desktop.github.com থেকে GitHub Desktop install করে নিজের GitHub account দিয়ে login করুন।
2. **File → Add local repository** → এই `secureface-deploy` ফোল্ডারটা বেছে নিন।
   "This directory does not appear to be a Git repository" লেখা এলে **create a repository** চাপুন, তারপর **Create repository**।
3. বাম পাশে সব ফাইল দেখাবে। নিচে Summary-তে লিখুন `first deploy`, তারপর **Commit to main** চাপুন।
4. উপরে **Publish repository** চাপুন। **Keep this code private** টিক দেওয়াই রাখুন, তারপর **Publish**।

`.env` ফাইল এই ফোল্ডারে নেই, থাকলেও `.gitignore` সেটা আটকাবে। কোনো গোপন তথ্য GitHub-এ যাবে না।

## ধাপ ২: Backend → Render

1. https://render.com → **Sign in with GitHub**।
2. উপরে **New + → Blueprint** চাপুন, তারপর আপনার repo বেছে নিন (না দেখালে **Configure account** দিয়ে repo-র অনুমতি দিন)।
3. Render `render.yaml` পড়ে `secureface-api` সার্ভিস দেখাবে। দুটো ঘর পূরণ করতে বলবে:
   - **FERNET_KEY**: Claude-এর দেওয়া key-টা paste করুন। এটা মুখের তথ্য এনক্রিপ্ট করে, তাই কাউকে দেবেন না।
   - **DEFAULT_ADMIN_PASSWORD**: অ্যাডমিনের জন্য একটা শক্ত পাসওয়ার্ড দিন।
4. **Apply** চাপুন। প্রথম build-এ ৫–১০ মিনিট লাগবে।
5. শেষ হলে উপরে একটা লিংক পাবেন, যেমন `https://secureface-api.onrender.com`। এটা কপি করুন।
   ঠিকমতো চলছে কি না দেখতে ব্রাউজারে `…onrender.com/health` খুলুন। `"status":"online"` দেখালে সব ঠিক আছে।

## ধাপ ৩: Frontend → Vercel

1. https://vercel.com → **Continue with GitHub**।
2. **Add New… → Project** → আপনার repo-র পাশে **Import** চাপুন।
3. **Root Directory**-র পাশে **Edit** চাপুন, `frontend` বেছে নিয়ে **Continue** চাপুন। Framework নিজে থেকেই **Vite** দেখাবে।
4. **Environment Variables** খুলে একটা যোগ করুন:
   - Name: `VITE_API_URL`
   - Value: Render-এর লিংক, যেমন `https://secureface-api.onrender.com` (শেষে `/` দেবেন না)
5. **Deploy** চাপুন। ১–২ মিনিট পর `https://….vercel.app` লিংক পাবেন। এটাই আপনার live সাইট।

## ধাপ ৪: পরীক্ষা

1. Vercel লিংক খুলুন। ক্যামেরার অনুমতি চাইলে **Allow** দিন (https সাইটে ক্যামেরা চলে)।
2. `admin` আর ধাপ ২-এর পাসওয়ার্ড দিয়ে লগইন করুন।
3. প্রথমে মুখ রেজিস্টার করুন, তারপর যাচাই করুন।

---

## জেনে রাখুন (free plan)

- **ঘুমিয়ে পড়ে:** Render free সার্ভার ১৫ মিনিট কেউ ব্যবহার না করলে ঘুমিয়ে যায়। পরের প্রথম অনুরোধে প্রায় ১ মিনিট লাগে। এজন্য app ৯০ সেকেন্ড পর্যন্ত অপেক্ষা করে।
- **Database মুছে যায়:** Free plan-এ ডিস্ক স্থায়ী না। নতুন deploy বা restart হলে ব্যবহারকারী আর রেজিস্টার করা মুখ মুছে যায়। স্থায়ী রাখতে Render-এ একটা free PostgreSQL বানিয়ে তার লিংক `DATABASE_URL`-এ দিন, অথবা paid disk নিন। তবে PostgreSQL-এর জন্য `psycopg2-binary` লাগবে, এটা এখনো `requirements.txt`-এ নেই।
- **মেমরি:** backend চলতে প্রায় ৩৯০ MB লাগে। Render free plan-এ সীমা ৫১২ MB। একসাথে অনেকে ব্যবহার করলে আটকে যেতে পারে।
- **আপডেট:** GitHub Desktop-এ commit করে **Push origin** চাপলেই Vercel আর Render দুটোই নিজে থেকে নতুন করে deploy হয়।
