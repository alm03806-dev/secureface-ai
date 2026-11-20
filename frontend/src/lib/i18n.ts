// All user-facing text, Bangla and English. Use {name} for values.
export type Lang = 'bn' | 'en';

export const dict = {
  // nav
  nav_home: ['হোম', 'Home'],
  nav_verify: ['যাচাই', 'Verify'],
  nav_enroll: ['রেজিস্টার', 'Register'],
  nav_history: ['ইতিহাস', 'History'],
  nav_admin: ['অ্যাডমিন', 'Admin'],
  nav_login: ['লগইন', 'Log in'],
  nav_logout: ['লগআউট', 'Log out'],
  theme_dark: ['রাতের মোড', 'Night mode'],
  theme_light: ['দিনের মোড', 'Day mode'],
  lang_switch: ['English-এ দেখুন', 'বাংলায় দেখুন'],
  demo_banner: ['ডেমো: ফলাফল আসল না। ক্যামেরা না চললে "ছবি থেকে" দিয়ে যেকোনো ছবি দিন।', 'Demo: results are not real. If the camera is blocked, use "From photo".'],

  // home
  home_title: ['চেহারা দিয়ে নিরাপদ পরিচয় যাচাই', 'Secure identity check with your face'],
  home_sub: [
    'আসল মানুষ কি না আর আপনিই কি না — দুটোই একসাথে দেখে নেয়। ছবি বা মোবাইল স্ক্রিন দেখিয়ে ফাঁকি দেওয়া যায় না।',
    'It checks that you are a real person and that you are you. A photo or a phone screen cannot fool it.',
  ],
  home_cta_verify: ['যাচাই শুরু করুন', 'Start verification'],
  home_cta_enroll: ['মুখ রেজিস্টার করুন', 'Register your face'],
  step1_t: ['মুখ রেজিস্টার করুন', 'Register your face'],
  step1_d: ['একবারই করতে হয়', 'Only once'],
  step2_t: ['ক্যামেরার দিকে তাকান', 'Look at the camera'],
  step2_d: ['ভালো আলোতে, সোজা হয়ে', 'Good light, face straight'],
  step3_t: ['ফলাফল দেখুন', 'See the result'],
  step3_d: ['কয়েক সেকেন্ডেই', 'In a few seconds'],

  // camera
  cam_starting: ['ক্যামেরা চালু হচ্ছে…', 'Starting camera…'],
  cam_error: ['ক্যামেরা চালু করা যায়নি। ব্রাউজারে ক্যামেরার অনুমতি দিন, অথবা ছবি আপলোড করুন।', 'Could not start the camera. Allow camera access in your browser, or upload a photo.'],
  cam_retry: ['আবার চেষ্টা', 'Try again'],
  cam_upload: ['ছবি আপলোড', 'Upload photo'],
  chip_scanning: ['স্ক্যান হচ্ছে…', 'Scanning…'],
  chip_found: ['মুখ পাওয়া গেছে', 'Face found'],
  chip_none: ['মুখ ডিম্বাকার ঘরে আনুন', 'Bring your face into the oval'],
  from_photo: ['ছবি থেকে', 'From photo'],

  // scan stages
  st_scanning: ['মুখ খোঁজা হচ্ছে…', 'Looking for your face…'],
  st_target: ['মুখ পাওয়া গেছে, স্থির থাকুন…', 'Face found, hold still…'],
  st_analyzing: ['আসল মানুষ কি না দেখা হচ্ছে…', 'Checking you are a real person…'],
  st_saving: ['নিরাপদে সংরক্ষণ করা হচ্ছে…', 'Saving securely…'],
  st_wait: ['একটু অপেক্ষা করুন…', 'One moment…'],

  // verify
  v_idle_t: ['ক্যামেরার দিকে তাকান', 'Look at the camera'],
  v_idle_m: ['মুখ ডিম্বাকার ঘরের ভেতরে আনুন।', 'Bring your face into the oval.'],
  v_face_t: ['মুখ পাওয়া গেছে', 'Face found'],
  v_face_m: ['স্থির থেকে নিচের বোতাম চাপুন।', 'Hold still and press the button below.'],
  v_btn: ['চেহারা যাচাই করুন', 'Verify my face'],
  v_btn_again: ['আবার যাচাই করুন', 'Verify again'],
  v_claim_label: ['নির্দিষ্ট কারো সাথে মেলাতে চান? (ঐচ্ছিক)', 'Match against one person? (optional)'],
  v_claim_ph: ['ইউজারনেম লিখুন', 'Enter a username'],
  v_ok_t: ['স্বাগতম{name}!', 'Welcome{name}!'],
  v_ok_m: ['পরিচয় নিশ্চিত হয়েছে।', 'Identity confirmed.'],
  v_spoof_t: ['নকল ছবি ধরা পড়েছে', 'Fake detected'],
  v_spoof_m: ['ছবি বা মোবাইল স্ক্রিন নয়, নিজে ক্যামেরার সামনে আসুন।', 'Not a photo or a screen. Please face the camera yourself.'],
  v_mismatch_t: ['মিল পাওয়া যায়নি', 'No match'],
  v_mismatch_m: ['রেজিস্টার করা কারো সাথে এই মুখ মেলেনি।', 'This face does not match anyone registered.'],
  v_noenroll_t: ['এখনো রেজিস্টার করা নেই', 'Not registered yet'],
  v_noenroll_m: ['যাচাইয়ের আগে একবার মুখ রেজিস্টার করুন।', 'Register your face once before verifying.'],
  v_noface_t: ['কোনো মুখ পাওয়া যায়নি', 'No face found'],
  v_noface_m: ['ফ্রেমের ভেতরে মুখ রেখে সোজা তাকান।', 'Keep your face inside the frame and look straight.'],
  v_multi_t: ['একজনের বেশি মানুষ', 'More than one person'],
  v_multi_m: ['ফ্রেমে শুধু একজন থাকুন।', 'Only one person in the frame, please.'],
  v_retry_t: ['আবার চেষ্টা করুন', 'Please try again'],
  v_fail_t: ['যাচাই হয়নি', 'Verification failed'],

  // enroll
  e_login_t: ['আগে লগইন করুন', 'Log in first'],
  e_login_m: ['মুখ রেজিস্টার করতে একটি অ্যাকাউন্ট লাগবে।', 'You need an account to register your face.'],
  e_login_btn: ['লগইন / অ্যাকাউন্ট খুলুন', 'Log in / Sign up'],
  e_consent_t: ['সম্মতি দিন', 'Give consent'],
  e_consent_m: ['নিচের সুইচটি চালু করুন, তারপর আবার চাপুন।', 'Turn on the switch below, then press again.'],
  e_consent_label: ['আমি সম্মতি দিচ্ছি। আসল ছবি রাখা হবে না, শুধু এনক্রিপ্ট করা কোড থাকবে।', 'I agree. No photo is stored, only an encrypted code.'],
  e_ok_t: ['মুখ সংরক্ষিত হয়েছে', 'Face saved'],
  e_ok_m: ['{name}, এখন থেকে চেহারা দিয়েই যাচাই হবে।', '{name}, you can now verify with your face.'],
  e_fail_t: ['সংরক্ষণ হয়নি', 'Not saved'],
  e_already_t: ['মুখ আগেই রেজিস্টার করা আছে', 'Face already registered'],
  e_already_m: ['চাইলে নতুন করে আবার সংরক্ষণ করতে পারেন।', 'You can save it again if you like.'],
  e_idle_t: ['আপনার মুখ রেজিস্টার করুন', 'Register your face'],
  e_idle_m: ['ভালো আলোতে সোজা তাকিয়ে নিচের বোতাম চাপুন।', 'Face the camera in good light and press the button.'],
  e_btn: ['মুখ সংরক্ষণ করুন', 'Save my face'],
  e_try_verify: ['এখন যাচাই করে দেখুন', 'Try verifying now'],

  // login
  l_tab_in: ['লগইন', 'Log in'],
  l_tab_up: ['নতুন অ্যাকাউন্ট', 'Sign up'],
  l_user_in: ['ইউজারনেম বা ইমেইল', 'Username or email'],
  l_user_up: ['ইউজারনেম', 'Username'],
  l_email: ['ইমেইল', 'Email'],
  l_pass: ['পাসওয়ার্ড', 'Password'],
  l_btn_in: ['লগইন', 'Log in'],
  l_btn_up: ['অ্যাকাউন্ট খুলুন', 'Create account'],
  l_busy: ['একটু অপেক্ষা…', 'Please wait…'],
  l_err_server: ['সার্ভারের সাথে যোগাযোগ হচ্ছে না।', 'Cannot reach the server.'],
  l_err_cred: ['ইউজারনেম বা পাসওয়ার্ড ভুল।', 'Wrong username or password.'],
  l_err_up: ['অ্যাকাউন্ট খোলা যায়নি। তথ্য আবার দেখুন।', 'Could not create the account. Check your details.'],

  // history
  h_title: ['ইতিহাস', 'History'],
  h_all: ['সব', 'All'],
  h_ok: ['সফল', 'Passed'],
  h_spoof: ['নকল', 'Fake'],
  h_failed: ['ইতিহাস আনা যায়নি। আবার চেষ্টা করুন।', 'Could not load history. Try again.'],
  h_empty: ['এখনো কিছু নেই।', 'Nothing yet.'],
  h_unknown: ['অজানা ব্যক্তি', 'Unknown person'],
  s_verified: ['যাচাই সফল', 'Verified'],
  s_spoof: ['নকল ছবি আটকানো হয়েছে', 'Fake blocked'],
  s_enrolled: ['মুখ রেজিস্টার হয়েছে', 'Face registered'],
  s_mismatch: ['মিল পাওয়া যায়নি', 'No match'],
  s_other: ['সম্পন্ন হয়নি', 'Not completed'],

  // admin
  a_only: ['এই পাতা শুধু অ্যাডমিনের জন্য।', 'This page is for admins only.'],
  a_title: ['অ্যাডমিন', 'Admin'],
  a_total: ['মোট যাচাই', 'Total checks'],
  a_ok: ['সফল', 'Passed'],
  a_spoof: ['নকল আটকানো', 'Fakes blocked'],
  a_faces: ['রেজিস্টার করা মুখ', 'Registered faces'],
  a_sens: ['সংবেদনশীলতা', 'Sensitivity'],
  a_pad: ['নকল ধরার সীমা', 'Fake detection limit'],
  a_pad_hint: ['কম মান মানে বেশি কড়া: সন্দেহ হলেই নকল ধরবে।', 'Lower is stricter: anything suspicious is marked fake.'],
  a_strict: ['কড়া', 'Strict'],
  a_soft: ['নরম', 'Relaxed'],
  a_match: ['চেহারা মেলার সীমা', 'Face match limit'],
  a_match_hint: ['বেশি মান মানে মুখ আরও নিখুঁতভাবে মিলতে হবে।', 'Higher means the face must match more closely.'],
  a_easy: ['সহজ', 'Easy'],
  a_hard: ['কঠোর', 'Strict'],
  a_reco: ['প্রস্তাবিত মান', 'Recommended'],
  a_save: ['সেভ করুন', 'Save'],
  a_saved: ['সেভ হয়েছে', 'Saved'],
  a_save_fail: ['সেটিংস সেভ হয়নি।', 'Settings were not saved.'],
  a_users: ['ব্যবহারকারী', 'Users'],
  a_admin_tag: ['অ্যাডমিন', 'admin'],
  a_has_face: ['মুখ রেজিস্টার করা', 'Face registered'],
  a_no_face: ['মুখ রেজিস্টার নেই', 'No face registered'],
  a_inactive: ['নিষ্ক্রিয়', 'inactive'],
  a_del_face: ['মুখের তথ্য মুছুন', 'Delete face data'],
  a_deactivate: ['নিষ্ক্রিয় করুন', 'Deactivate'],
  a_activate: ['সক্রিয় করুন', 'Activate'],
  a_del_user: ['ব্যবহারকারী মুছুন', 'Delete user'],
  a_sure: ['মুছবেন?', 'Delete?'],
  a_fail: ['কাজটি করা যায়নি।', 'That did not work.'],

  // errors
  err_server: ['সার্ভারের সাথে যোগাযোগ হচ্ছে না। একটু পরে আবার চেষ্টা করুন।', 'Cannot reach the server. Try again shortly.'],
  err_noface: ['কোনো মুখ পাওয়া যায়নি। ক্যামেরার দিকে সোজা তাকান।', 'No face found. Look straight at the camera.'],
  err_multi: ['ফ্রেমে একজনের বেশি মানুষ আছে। শুধু একজন থাকুন।', 'More than one person in the frame. Only one, please.'],
  err_blur: ['ছবি ঝাপসা। একটু স্থির থাকুন আর আলো বাড়ান।', 'The image is blurry. Hold still and add light.'],
  err_spoof: ['নকল ছবি বা স্ক্রিন ধরা পড়েছে।', 'A fake photo or screen was detected.'],
  err_login: ['আগে লগইন করুন।', 'Please log in first.'],
  err_generic: ['কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।', 'Something went wrong. Please try again.'],
} as const;

export type Key = keyof typeof dict;

export function translate(lang: Lang, key: Key, vars?: Record<string, string>) {
  let s: string = dict[key][lang === 'bn' ? 0 : 1];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(v);
  return s;
}
