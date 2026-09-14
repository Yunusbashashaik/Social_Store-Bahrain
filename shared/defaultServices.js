/**
 * Hardcoded catalog. This list is restored on every Node start and does not vanish.
 * To update a service later, edit this file (and the JPEG under images/) then redeploy.
 * Services 1–20 include photos (Service01.JPG–Service20.JPG). 21–42 photos can be added the same way.
 */
export const DEFAULT_SERVICES = [
  {
    id: `netflix-prime-combo`,
    accent: `#e50914`,
    imageFile: "Service01.JPG",
    nameEn: `🎬 Netflix + Prime Video Combo (One Device)`,
    nameAr: `🎬 باقة نتفليكس + برايم فيديو`,
    descriptionEn: `🎬 Netflix + Prime Video Combo
✅ Netflix + Prime Video Access
✅ Watch Movies, Series & Originals
✅ Shared / Private Screen Options Available
✅ HD / 4K Streaming (content dependent)
✅ One Device Access
✅ Login Warranty Available`,
    descriptionAr: `🎬 باقة نتفليكس + برايم فيديو
✅ الوصول إلى نتفليكس + برايم فيديو
✅ مشاهدة الأفلام والمسلسلات والمحتوى الأصلي
✅ خيارات شاشة مشتركة / خاصة متوفرة
✅ بث بجودة HD / 4K حسب المحتوى
✅ جهاز واحد
✅ ضمان تسجيل الدخول متوفر`,
    prices: { month: 1, year: 8 },
  },
  {
    id: `prime-video-shared`,
    accent: `#00a8e1`,
    imageFile: "Service02.JPG",
    nameEn: `🎬 Prime Video Shared Account`,
    nameAr: `🎬 حساب برايم فيديو مشترك`,
    descriptionEn: `🎬 Prime Video Shared Account
✅ Shared Account Access
✅ Watch Movies, Series & Amazon Originals
✅ One Device / One Screen Access
✅ HD Streaming Available (content dependent)
✅ Login Warranty Available`,
    descriptionAr: `🎬 حساب برايم فيديو مشترك
✅ وصول إلى الحساب المشترك
✅ مشاهدة الأفلام والمسلسلات وأعمال أمازون الأصلية
✅ جهاز واحد / شاشة واحدة
✅ بث بجودة HD حسب المحتوى
✅ ضمان تسجيل الدخول متوفر`,
    prices: { month: 1, year: 8 },
  },
  {
    id: `prime-video-private`,
    accent: `#00a8e1`,
    imageFile: "Service03.JPG",
    nameEn: `🎬 Prime Video Private Screen`,
    nameAr: `🎬 شاشة خاصة برايم فيديو`,
    descriptionEn: `🎬 Prime Video Private Screen
✅ Private Screen Access
✅ Watch Movies, Series & Amazon Originals
✅ One User / One Screen Access
✅ HD Streaming Available (content dependent)
✅ Login Warranty Available`,
    descriptionAr: `🎬 شاشة خاصة برايم فيديو
✅ وصول إلى شاشة خاصة
✅ مشاهدة الأفلام والمسلسلات وأعمال أمازون الأصلية
✅ مستخدم واحد / شاشة واحدة
✅ بث HD حسب المحتوى
✅ ضمان تسجيل الدخول متوفر`,
    prices: { month: 2, year: 8 },
  },
  {
    id: `prime-video-full`,
    accent: `#00a8e1`,
    imageFile: "Service04.JPG",
    nameEn: `🎬 Prime Video Full Account`,
    nameAr: `🎬 حساب برايم فيديو كامل`,
    descriptionEn: `🎬 Prime Video Full Account
✅ Full Access Account
✅ Watch Movies, Series & Amazon Originals
✅ HD / 4K Streaming Support (content dependent)
✅ Multiple Device Support (as per account plan)
✅ Login Warranty Available`,
    descriptionAr: `🎬 حساب برايم فيديو كامل
✅ حساب كامل الصلاحيات
✅ مشاهدة الأفلام والمسلسلات وأعمال أمازون الأصلية
✅ دعم بث HD / 4K حسب المحتوى
✅ دعم أجهزة متعددة حسب الخطة
✅ ضمان تسجيل الدخول متوفر`,
    prices: { month: 4, year: 45 },
  },
  {
    id: `netflix-full`,
    accent: `#e50914`,
    imageFile: "Service05.JPG",
    nameEn: `🎬 Netflix Full Account`,
    nameAr: `🎬 حساب نتفليكس كامل`,
    descriptionEn: `🎬 Netflix Full Account
✅ Full Account Access
✅ Multiple Screens Available (Plan Dependent)
✅ Watch Movies, Series & Originals
✅ HD / Full HD / 4K Quality (Plan Dependent)
✅ All Netflix Features Available
✅ Secure Login Access
✅ Long-Term Warranty (Terms Apply)`,
    descriptionAr: `🎬 حساب نتفليكس كامل
✅ وصول كامل إلى الحساب
✅ شاشات متعددة حسب الخطة
✅ مشاهدة الأفلام والمسلسلات والمحتوى الأصلي
✅ جودة HD / Full HD / 4K حسب الخطة
✅ جميع ميزات نتفليكس متوفرة
✅ تسجيل دخول آمن
✅ ضمان طويل الأمد (حسب الشروط)`,
    prices: { month: 6, year: 70 },
  },
  {
    id: `netflix-private`,
    accent: `#e50914`,
    imageFile: "Service06.JPG",
    nameEn: `🎬 Netflix Private Screen`,
    nameAr: `🎬 شاشة نتفليكس خاصة`,
    descriptionEn: `🎬 Netflix Private Screen
✅ Private Account Access
✅ Only One User / One Screen
✅ Full HD / 4K Available (Plan Dependent)
✅ Personal Viewing Experience
✅ No Sharing With Others
✅ Stable & Secure Login
✅ Long-Term Access Warranty (Terms Apply)`,
    descriptionAr: `🎬 شاشة نتفليكس خاصة
✅ وصول إلى حساب خاص
✅ مستخدم واحد / شاشة واحدة فقط
✅ جودة Full HD / 4K حسب الخطة
✅ تجربة مشاهدة شخصية
✅ بدون مشاركة مع الآخرين
✅ تسجيل دخول مستقر وآمن
✅ ضمان وصول طويل الأمد (حسب الشروط)`,
    prices: { month: 1.5, year: 10 },
  },
  {
    id: `apple-music-shared`,
    accent: `#fc3c44`,
    imageFile: "Service07.JPG",
    nameEn: `🎵 Apple Music Premium Shared Account`,
    nameAr: `🎵 حساب أبل ميوزك بريميوم مشترك`,
    descriptionEn: `🎵 Apple Music Premium Shared Account
📱 Working on 1 Device Only
✅ 100 Million+ Songs Access
✅ Ad-Free Music Streaming
✅ High Quality Audio
✅ Offline Download Available
✅ Premium Music Library Access
✅ Login Warranty Provided
⚠️ Only One Device Login Allowed
⚠️ Do Not Change Account Settings / Password`,
    descriptionAr: `🎵 حساب أبل ميوزك بريميوم مشترك
📱 يعمل على جهاز واحد فقط
✅ الوصول إلى أكثر من 100 مليون أغنية
✅ الاستماع للموسيقى بدون إعلانات
✅ صوت بجودة عالية
✅ تحميل الأغاني والاستماع بدون إنترنت
✅ الوصول إلى مكتبة موسيقى بريميوم
✅ ضمان تسجيل الدخول متوفر
⚠️ يسمح بتسجيل دخول جهاز واحد فقط
⚠️ لا تقم بتغيير إعدادات الحساب / كلمة المرور`,
    prices: { month: 0, year: 0 },
  },
  {
    id: `mubi-shared`,
    accent: `#0055ff`,
    imageFile: "Service08.JPG",
    nameEn: `🎬 MUBI Premium Shared Account`,
    nameAr: `🎬 حساب موبي بريميوم مشترك`,
    descriptionEn: `🎬 MUBI Premium Shared Account
📱 Working on 1 Device Only
✅ Curated Collection of Award-Winning Movies
✅ New Handpicked Film Every Day
✅ Exclusive Independent & Classic Films
✅ HD Streaming Quality
✅ Premium Access Included
✅ Login Warranty Provided
⚠️ Only One Device Login Allowed
⚠️ Do Not Change Email / Password / Account Settings`,
    descriptionAr: `🎬 حساب موبي بريميوم مشترك
📱 يعمل على جهاز واحد فقط
✅ مجموعة مختارة من الأفلام الحائزة على جوائز
✅ فيلم جديد مختار بعناية كل يوم
✅ أفلام مستقلة وكلاسيكية حصرية
✅ جودة بث HD
✅ وصول بريميوم متوفر
✅ ضمان تسجيل الدخول متوفر
⚠️ يسمح بتسجيل دخول جهاز واحد فقط
⚠️ لا تقم بتغيير البريد الإلكتروني / كلمة المرور / إعدادات الحساب`,
    prices: { month: 0, year: 0 },
  },
  {
    id: `osn-plus-shared`,
    accent: `#c026d3`,
    imageFile: "Service09.JPG",
    nameEn: `🎬 OSN+ Premium Shared Account`,
    nameAr: `🎬 حساب OSN+ بريميوم مشترك`,
    descriptionEn: `🎬 OSN+ Premium Shared Account
📱 Working on 1 Device Only
✅ Premium Movies & Series Access
✅ HBO, OSN Originals & Exclusive Content
✅ HD Streaming Quality
✅ Ad-Free Experience
✅ Login Warranty Provided
⚠️ Only One Device Login Allowed
⚠️ Do Not Change Email / Password / Account Settings`,
    descriptionAr: `🎬 حساب OSN+ بريميوم مشترك
📱 يعمل على جهاز واحد فقط
✅ الوصول إلى الأفلام والمسلسلات المميزة
✅ محتوى HBO و OSN الأصلي والحصري
✅ جودة بث HD
✅ تجربة مشاهدة بدون إعلانات
✅ ضمان تسجيل الدخول متوفر
⚠️ يسمح بتسجيل دخول جهاز واحد فقط
⚠️ لا تقم بتغيير البريد الإلكتروني / كلمة المرور / إعدادات الحساب`,
    prices: { month: 0, year: 0 },
  },
  {
    id: `crunchyroll-shared`,
    accent: `#f47521`,
    imageFile: "Service10.JPG",
    nameEn: `🍥 Crunchyroll Premium Shared Account`,
    nameAr: `🍥 حساب كرنشي رول بريميوم مشترك`,
    descriptionEn: `🍥 Crunchyroll Premium Shared Account
📱 Working on 1 Device Only
✅ Premium Anime Access
✅ No Ads Streaming
✅ HD Quality Available
✅ Login Warranty Provided
⚠️ Only One Device Login Allowed
⚠️ Do Not Change Account Settings / Password`,
    descriptionAr: `🍥 حساب كرنشي رول بريميوم مشترك
📱 يعمل على جهاز واحد فقط
✅ الوصول إلى محتوى الأنمي المميز
✅ مشاهدة بدون إعلانات
✅ جودة HD متوفرة
✅ ضمان تسجيل الدخول متوفر
⚠️ يسمح بتسجيل دخول جهاز واحد فقط
⚠️ لا تقم بتغيير إعدادات الحساب / كلمة المرور`,
    prices: { month: 1, year: 8 },
  },
  {
    id: `grammarly-premium`,
    accent: `#15c39a`,
    imageFile: "Service11.JPG",
    nameEn: `✍️ Grammarly Premium Account`,
    nameAr: `✍️ حساب Grammarly بريميوم`,
    descriptionEn: `✍️ Grammarly Premium Account
✅ Advanced Grammar & Spelling Correction
✅ AI Writing Suggestions
✅ Tone & Clarity Improvements
✅ Plagiarism Checker
✅ Vocabulary Enhancement
✅ Writing Style Suggestions
✅ Works on Browser, Mobile & Desktop
📌 Plan Type: Premium Account
📱 Access: Personal Login
🔐 Login Warranty Available
⭐ Best For: Students, Writers, Bloggers & Professionals`,
    descriptionAr: `✍️ حساب Grammarly بريميوم
✅ تصحيح متقدم للقواعد والإملاء
✅ اقتراحات الكتابة بالذكاء الاصطناعي
✅ تحسين النبرة والوضوح
✅ مدقق الانتحال
✅ تحسين المفردات
✅ اقتراحات أسلوب الكتابة
✅ يعمل على المتصفح والهاتف والكمبيوتر
📌 نوع الخطة: حساب بريميوم
📱 الوصول: تسجيل دخول شخصي
🔐 ضمان تسجيل الدخول متوفر
⭐ الأفضل للطلاب والكتاب والمدونين والمحترفين`,
    prices: { month: 1, year: 8 },
  },
  {
    id: `youtube-premium`,
    accent: `#ff0000`,
    imageFile: "Service12.JPG",
    nameEn: `▶️ YouTube Premium Personal Account`,
    nameAr: `▶️ حساب يوتيوب بريميوم شخصي`,
    descriptionEn: `▶️ YouTube Premium Personal Account
✅ Ad-Free YouTube Watching
✅ YouTube Music Premium Included
✅ Background Play (screen off / other apps)
✅ Offline Video Downloads
✅ Works on Mobile, Tablet & PC
✅ Personal Account Only (1 User)
✅ Login Warranty Available`,
    descriptionAr: `▶️ حساب يوتيوب بريميوم شخصي
✅ مشاهدة يوتيوب بدون إعلانات
✅ يتضمن YouTube Music Premium
✅ تشغيل في الخلفية (مع إغلاق الشاشة / تطبيقات أخرى)
✅ تحميل الفيديوهات للمشاهدة بدون إنترنت
✅ يعمل على الهاتف والتابلت والكمبيوتر
✅ حساب شخصي فقط (مستخدم واحد)
✅ ضمان تسجيل الدخول متوفر`,
    prices: { month: 1, year: 8 },
  },
  {
    id: `chatgpt-plus-shared`,
    accent: `#10a37f`,
    imageFile: "Service13.JPG",
    nameEn: `🤖 ChatGPT Plus Shared Account`,
    nameAr: `🤖 حساب ChatGPT Plus مشترك`,
    descriptionEn: `🤖 ChatGPT Plus Shared Account
✅ Access to ChatGPT AI Features
✅ Advanced AI Models & Tools
✅ Writing, Coding & Research Assistance
📱 Working on 1 Device Only
🔒 Shared Account Access
⚡ Instant Login Available`,
    descriptionAr: `🤖 حساب ChatGPT Plus مشترك
✅ الوصول إلى ميزات ChatGPT للذكاء الاصطناعي
✅ نماذج وأدوات ذكاء اصطناعي متقدمة
✅ المساعدة في الكتابة والبرمجة والبحث
📱 يعمل على جهاز واحد فقط
🔒 وصول إلى حساب مشترك
⚡ تسجيل دخول فوري متوفر`,
    prices: { month: 2, year: 10 },
  },
  {
    id: `grok-ai-premium`,
    accent: `#111111`,
    imageFile: "Service14.JPG",
    nameEn: `🤖 Grok AI Premium Account`,
    nameAr: `🤖 حساب Grok AI بريميوم`,
    descriptionEn: `🤖 Grok AI Premium Account
✅ Access to Grok AI Features
✅ Advanced AI Chatbot & Assistance
✅ Image Generation & AI Tools
✅ Fast Response & Premium Features
📱 Working on 1 Device Only
🔒 Personal Login Warranty
⚡ Instant Access Available`,
    descriptionAr: `🤖 حساب Grok AI بريميوم
✅ الوصول إلى ميزات Grok AI
✅ مساعد ودردشة ذكاء اصطناعي متقدمة
✅ إنشاء الصور وأدوات الذكاء الاصطناعي
✅ استجابة سريعة وميزات بريميوم
📱 يعمل على جهاز واحد فقط
🔒 ضمان تسجيل دخول شخصي
⚡ وصول فوري متوفر`,
    prices: { month: 1, year: 8 },
  },
  {
    id: `gemini-ai`,
    accent: `#4285f4`,
    imageFile: "Service15.JPG",
    nameEn: `🤖 Gemini AI 18 Months Available`,
    nameAr: `🤖 Gemini AI متوفر لمدة 18 شهر`,
    descriptionEn: `🤖 Gemini AI 18 Months Available
✅ Premium AI Features Access
✅ Advanced AI Models
✅ Higher Usage Limits
✅ AI Writing & Image Generation Tools
✅ Google Workspace AI Features
✅ Long-Term Access (18 Months)
📱 One Device Login
🔒 Secure & Reliable Access`,
    descriptionAr: `🤖 Gemini AI متوفر لمدة 18 شهر
✅ الوصول إلى ميزات الذكاء الاصطناعي المميزة
✅ نماذج ذكاء اصطناعي متقدمة
✅ حدود استخدام أعلى
✅ أدوات كتابة وإنشاء صور بالذكاء الاصطناعي
✅ ميزات الذكاء الاصطناعي في Google Workspace
✅ وصول طويل الأمد (18 شهر)
📱 تسجيل دخول جهاز واحد
🔒 وصول آمن وموثوق`,
    prices: { month: 1, year: 8 },
  },
  {
    id: `canva-pro`,
    accent: `#00c4cc`,
    imageFile: "Service16.JPG",
    nameEn: `🎨 Canva Pro Available`,
    nameAr: `🎨 Canva Pro متوفر`,
    descriptionEn: `🎨 Canva Pro Available
✅ Premium Templates Access
✅ Pro Elements & Photos
✅ Background Remover Tool
✅ Magic Resize Feature
✅ Brand Kit Access
✅ AI Design Tools
✅ High Quality Export
📱 One Device Login
🔒 Secure & Reliable Access`,
    descriptionAr: `🎨 Canva Pro متوفر
✅ الوصول إلى القوالب المميزة
✅ عناصر وصور Pro
✅ أداة إزالة الخلفية
✅ ميزة تغيير الحجم السحري
✅ الوصول إلى Brand Kit
✅ أدوات تصميم بالذكاء الاصطناعي
✅ تصدير بجودة عالية
📱 تسجيل دخول جهاز واحد
🔒 وصول آمن وموثوق`,
    prices: { month: 1, year: 8 },
  },
  {
    id: `disney-plus`,
    accent: `#113ccf`,
    imageFile: "Service17.JPG",
    nameEn: `📺 Disney+ Premium Account`,
    nameAr: `📺 حساب Disney+ بريميوم`,
    descriptionEn: `📺 Disney+ Premium Account
📱 Working on 1 Phone Only
🌍 Works with Paid VPN
🎬 Watch Movies, Series, Originals & Kids Content
✨ Premium Streaming Experience
🔐 Personal Login Access
⚡ Smooth & Reliable Usage`,
    descriptionAr: `📺 حساب Disney+ بريميوم
📱 يعمل على هاتف واحد فقط
🌍 يعمل مع VPN مدفوع
🎬 مشاهدة الأفلام والمسلسلات والمحتوى الأصلي ومحتوى الأطفال
✨ تجربة بث بريميوم
🔐 وصول تسجيل دخول شخصي
⚡ استخدام سلس وموثوق`,
    prices: { month: 0, year: 0 },
  },
  {
    id: `zee5-premium`,
    accent: `#6d28d9`,
    imageFile: "Service18.JPG",
    nameEn: `📺 ZEE5 Premium Account`,
    nameAr: `📺 حساب ZEE5 بريميوم`,
    descriptionEn: `📺 ZEE5 Premium Account
📱 Working on 1 Phone Only
🌍 Works with Paid VPN
🎬 Watch Movies, Web Series, TV Shows & Originals
✨ Premium Streaming Access
🔐 Personal Login | Smooth Experience`,
    descriptionAr: `📺 حساب ZEE5 بريميوم
📱 يعمل على هاتف واحد فقط
🌍 يعمل مع VPN مدفوع
🎬 مشاهدة الأفلام والمسلسلات والبرامج والمحتوى الأصلي
✨ وصول بث بريميوم
🔐 تسجيل دخول شخصي | تجربة سلسة`,
    prices: { month: 0, year: 0 },
  },
  {
    id: `hulu-premium`,
    accent: `#1ce783`,
    imageFile: "Service19.JPG",
    nameEn: `📺 Hulu Premium Subscription`,
    nameAr: `📺 اشتراك Hulu بريميوم`,
    descriptionEn: `📺 Hulu Premium Subscription
🔹 One Device Access
🔹 Watch Movies, Series & Hulu Originals
🔹 HD Quality Streaming
🔹 Fast & Secure Login
🔹 Instant Activation
🔹 Login Warranty Available`,
    descriptionAr: `📺 اشتراك Hulu بريميوم
🔹 وصول لجهاز واحد
🔹 مشاهدة الأفلام والمسلسلات ومحتوى Hulu الأصلي
🔹 بث بجودة HD
🔹 تسجيل دخول سريع وآمن
🔹 تفعيل فوري
🔹 ضمان تسجيل الدخول متوفر`,
    prices: { month: 0, year: 0 },
  },
  {
    id: `ullu-premium`,
    accent: `#f59e0b`,
    imageFile: "Service20.JPG",
    nameEn: `📺 Ullu Premium Subscription`,
    nameAr: `📺 اشتراك Ullu بريميوم`,
    descriptionEn: `📺 Ullu Premium Subscription
🔹 One Device Access
🔹 Enjoy Premium Web Series & Exclusive Content
🔹 High Quality Streaming
🔹 Fast & Secure Login
🔹 Instant Activation
🔹 Login Warranty Available`,
    descriptionAr: `📺 اشتراك Ullu بريميوم
🔹 وصول لجهاز واحد
🔹 الاستمتاع بالمسلسلات والمحتوى الحصري المميز
🔹 بث بجودة عالية
🔹 تسجيل دخول سريع وآمن
🔹 تفعيل فوري
🔹 ضمان تسجيل الدخول متوفر`,
    prices: { month: 0, year: 0 },
  },
  {
    id: `spotify-premium`,
    imageFile: "Service21.JPG",
    accent: `#1db954`,
    nameEn: `🎵 Spotify Premium Available`,
    nameAr: `🎵 سبوتيفاي بريميوم متوفر`,
    descriptionEn: `🎵 Spotify Premium Available
🎧 Ad-Free Music Listening
🔥 Unlimited Songs & Skips
📥 Download Music & Listen Offline
🎶 High Quality Audio
📱 Access to Premium Features
🔐 Subscription Details:
✅ 1 Device Access
✅ Fast & Secure Login
✅ Premium Music Experience`,
    descriptionAr: `🎵 سبوتيفاي بريميوم متوفر
🎧 استماع للموسيقى بدون إعلانات
🔥 أغاني وتخطي غير محدود
📥 تحميل الموسيقى والاستماع بدون إنترنت
🎶 صوت بجودة عالية
📱 الوصول إلى الميزات المميزة
🔐 تفاصيل الاشتراك:
✅ وصول لجهاز واحد
✅ تسجيل دخول سريع وآمن
✅ تجربة موسيقى بريميوم`,
    prices: { month: 1, year: 8 },
  },
  {
    id: `nordvpn`,
    imageFile: "Service22.JPG",
    accent: `#4687ff`,
    nameEn: `🛡️ NordVPN Available`,
    nameAr: `🛡️ نورد VPN متوفر`,
    descriptionEn: `🛡️ NordVPN Available
🌐 Secure & Private Internet Access
⚡ Fast VPN Servers Worldwide
🔒 Strong Encryption & Online Protection
🚫 Hide IP Address & Browse Privately
🎬 Smooth Streaming & Global Access
🔐 Subscription Details:
✅ 1 Device Access
✅ Fast & Secure Login
✅ Premium VPN Access
🚀 NordVPN — Stay Safe & Connected Anywhere.`,
    descriptionAr: `🛡️ نورد VPN متوفر
🌐 وصول آمن وخاص للإنترنت
⚡ خوادم VPN سريعة حول العالم
🔒 تشفير قوي وحماية عبر الإنترنت
🚫 إخفاء عنوان IP والتصفح بشكل خاص
🎬 بث سلس ووصول عالمي
🔐 تفاصيل الاشتراك:
✅ وصول لجهاز واحد
✅ تسجيل دخول سريع وآمن
✅ وصول VPN بريميوم
🚀 NordVPN — ابقَ آمناً ومتصلًا في أي مكان.`,
    prices: { month: 1, year: 8 },
  },
  {
    id: `capcut-pro`,
    imageFile: "Service23.JPG",
    accent: `#000000`,
    nameEn: `🎞️ CapCut Pro Available`,
    nameAr: `🎞️ كاب كات برو متوفر`,
    descriptionEn: `🎞️ CapCut Pro Available
🎬 Advanced Video Editing Tools
✨ Premium Effects & Filters
🎵 Pro Music & Templates
🤖 AI Editing Features
🖼️ Background Removal & Auto Captions
📱 Export High Quality Videos
🔐 Subscription Details:
✅ Pro Access
✅ Fast & Secure Login
✅ Premium Features Unlocked
🎨 CapCut Pro — Create Professional Videos Easily`,
    descriptionAr: `🎞️ كاب كات برو متوفر
🎬 أدوات متقدمة لتحرير الفيديو
✨ تأثيرات وفلاتر مميزة
🎵 موسيقى وقوالب احترافية
🤖 ميزات تحرير بالذكاء الاصطناعي
🖼️ إزالة الخلفية والترجمة التلقائية
📱 تصدير فيديوهات بجودة عالية
🔐 تفاصيل الاشتراك:
✅ وصول Pro
✅ تسجيل دخول سريع وآمن
✅ فتح الميزات المميزة
🎨 CapCut Pro — أنشئ فيديوهات احترافية بسهولة`,
    prices: { month: 1.5, year: 8 },
  },
  {
    id: `peacock-premium`,
    imageFile: "Service24.JPG",
    accent: `#000000`,
    nameEn: `🦚 Peacock Premium Available`,
    nameAr: `🦚 بيكوك بريميوم متوفر`,
    descriptionEn: `🦚 Peacock Premium Available
🎬 Movies & TV Shows
🔥 Peacock Originals & Exclusive Series
📺 NBC & Bravo Shows
⚽ Live Sports (Premier League, WWE, NBA & More)
🎥 Universal Movies Collection
📱 Watch Anytime, Anywhere`,
    descriptionAr: `🦚 بيكوك بريميوم متوفر
🎬 أفلام وبرامج تلفزيونية
🔥 مسلسلات Peacock الأصلية والحصرية
📺 عروض NBC و Bravo
⚽ رياضات مباشرة (الدوري الإنجليزي، WWE، NBA والمزيد)
🎥 مجموعة أفلام Universal
📱 شاهد في أي وقت وأي مكان`,
    prices: { month: 0, year: 0 },
  },
  {
    id: `sony-liv`,
    imageFile: "Service25.JPG",
    accent: `#e11d48`,
    nameEn: `📺 Sony LIV Premium Available`,
    nameAr: `📺 سوني ليف بريميوم متوفر`,
    descriptionEn: `📺 Sony LIV Premium Available
✅ Watch Live TV Channels
✅ Movies & Web Series
✅ Sony Originals
✅ Live Sports (Cricket, WWE, Football & More)
✅ HD & 4K Streaming Support
✅ Multiple Language Content
✅ Download & Watch Offline`,
    descriptionAr: `📺 سوني ليف بريميوم متوفر
✅ مشاهدة قنوات التلفزيون المباشرة
✅ أفلام ومسلسلات ويب
✅ محتوى Sony الأصلي
✅ رياضات مباشرة (كريكيت، WWE، كرة القدم والمزيد)
✅ دعم بث HD و 4K
✅ محتوى بلغات متعددة
✅ تحميل ومشاهدة بدون إنترنت`,
    prices: { month: 0, year: 0 },
  },
  {
    id: `starzplay`,
    imageFile: "Service26.JPG",
    accent: `#111111`,
    nameEn: `🎬 STARZPLAY Available`,
    nameAr: `🎬 STARZPLAY متوفر`,
    descriptionEn: `🎬 STARZPLAY Available
🍿 Premium Movies & TV Series Streaming
🔥 Exclusive Originals, Hollywood Movies & Arabic Content
⚽ Live Sports & Entertainment Channels
📺 Watch Anytime on Your Favorite Devices
✨ High-Quality Streaming Experience`,
    descriptionAr: `🎬 STARZPLAY متوفر
🍿 بث أفلام ومسلسلات تلفزيونية بريميوم
🔥 أعمال أصلية حصرية وأفلام هوليوود ومحتوى عربي
⚽ قنوات رياضية وترفيهية مباشرة
📺 شاهد في أي وقت على أجهزتك المفضلة
✨ تجربة بث بجودة عالية`,
    prices: { month: 0, year: 0 },
  },
  {
    id: `surfshark`,
    imageFile: "Service27.JPG",
    accent: `#1ebacc`,
    nameEn: `🦈 Surfshark VPN Available`,
    nameAr: `🦈 Surfshark VPN متوفر`,
    descriptionEn: `🦈 Surfshark VPN Available
🔒 Secure & Private Internet Access
🌍 Access Content From Anywhere In The World
⚡ Fast VPN Servers With Unlimited Devices Support
🛡️ Protect Your Online Privacy And Data
📱 Easy Setup & Reliable Connection`,
    descriptionAr: `🦈 Surfshark VPN متوفر
🔒 وصول آمن وخاص للإنترنت
🌍 الوصول إلى المحتوى من أي مكان في العالم
⚡ خوادم VPN سريعة مع دعم أجهزة غير محدود
🛡️ حماية خصوصيتك وبياناتك عبر الإنترنت
📱 إعداد سهل واتصال موثوق`,
    prices: { month: 1, year: 8 },
  },
  {
    id: `expressvpn`,
    imageFile: "Service28.JPG",
    accent: `#da3940`,
    nameEn: `🔒 ExpressVPN Premium`,
    nameAr: `🔒 ExpressVPN بريميوم`,
    descriptionEn: `🔒 ExpressVPN Premium
✅ Fast & Secure VPN Access
✅ Protect Your Online Privacy
✅ Worldwide Server Access
✅ One Device Login Only`,
    descriptionAr: `🔒 ExpressVPN بريميوم
✅ وصول VPN سريع وآمن
✅ حماية خصوصيتك عبر الإنترنت
✅ الوصول إلى خوادم حول العالم
✅ تسجيل دخول لجهاز واحد فقط`,
    prices: { month: 1.5, year: 10 },
  },
  {
    id: `proton-vpn`,
    imageFile: "Service29.JPG",
    accent: `#6d4aff`,
    nameEn: `🔒 Proton VPN Premium`,
    nameAr: `🔒 Proton VPN بريميوم`,
    descriptionEn: `🔒 Proton VPN Premium
✅ High-Speed Secure VPN Access
✅ Privacy & Online Protection
✅ One Device Login Only
✅ Fast & Reliable Connection`,
    descriptionAr: `🔒 Proton VPN بريميوم
✅ وصول VPN آمن عالي السرعة
✅ حماية الخصوصية والأمان عبر الإنترنت
✅ تسجيل دخول لجهاز واحد فقط
✅ اتصال سريع وموثوق`,
    prices: { month: 1, year: 8 },
  },
  {
    id: `apple-tv-plus`,
    imageFile: "Service30.JPG",
    accent: `#000000`,
    nameEn: `🍎 Apple TV+ Available`,
    nameAr: `🍎 Apple TV+ متوفر`,
    descriptionEn: `🍎 Apple TV+ Available
🎬 Premium Movies & Original Series
⭐ Apple Originals & Exclusive Content
📺 Watch Anytime, Anywhere
🔥 High Quality Streaming Experience
✅ Secure Login Warranty`,
    descriptionAr: `🍎 Apple TV+ متوفر
🎬 أفلام مميزة ومسلسلات أصلية
⭐ محتوى Apple الأصلي والحصري
📺 شاهد في أي وقت وأي مكان
🔥 تجربة بث بجودة عالية
✅ ضمان تسجيل دخول آمن`,
    prices: { month: 1, year: 8 },
  },
  {
    id: `hbo-max`,
    imageFile: "Service31.JPG",
    accent: `#b535f6`,
    nameEn: `🎬 HBO Max Available`,
    nameAr: `🎬 HBO Max متوفر`,
    descriptionEn: `🎬 HBO Max Available
⭐ Premium Streaming Service
🎥 Movies, Web Series & HBO Originals
🔥 Latest Hollywood Content
📺 Watch Anytime, Anywhere
✅ Fast & Reliable Access
🔐 Secure Login Warranty`,
    descriptionAr: `🎬 HBO Max متوفر
⭐ خدمة بث بريميوم مميزة
🎥 أفلام ومسلسلات ومحتوى HBO الأصلي
🔥 أحدث محتوى هوليوود
📺 شاهد في أي وقت وأي مكان
✅ وصول سريع وموثوق
🔐 ضمان تسجيل دخول آمن`,
    prices: { month: 1, year: 8 },
  },
  {
    id: `paramount-plus`,
    imageFile: "Service32.JPG",
    accent: `#0064ff`,
    nameEn: `🌟 Paramount+ Available`,
    nameAr: `🌟 Paramount+ متوفر`,
    descriptionEn: `🌟 Paramount+ Available
📺 Premium Paramount+ Subscription
✅ Movies & Series Access
✅ HD Quality Streaming
✅ Fast & Reliable Service
🔐 Login Warranty Available`,
    descriptionAr: `🌟 Paramount+ متوفر
📺 اشتراك Paramount+ بريميوم
✅ الوصول إلى الأفلام والمسلسلات
✅ بث بجودة HD
✅ خدمة سريعة وموثوقة
🔐 ضمان تسجيل الدخول متوفر`,
    prices: { month: 0, year: 0 },
  },
  {
    id: `shahid-vip`,
    imageFile: "Service33.JPG",
    accent: `#e10600`,
    nameEn: `🌟 Shahid VIP Available`,
    nameAr: `🌟 شاهد VIP متوفر`,
    descriptionEn: `🌟 Shahid VIP Available
📺 Premium Shahid VIP Subscription
✅ Full Access Available
✅ HD Quality Streaming
✅ Movies & Series Enjoy Karein
✅ Fast & Reliable Service
🔐 Login Warranty Available`,
    descriptionAr: `🌟 شاهد VIP متوفر
📺 اشتراك شاهد VIP بريميوم
✅ وصول كامل متوفر
✅ بث بجودة HD
✅ استمتع بالأفلام والمسلسلات
✅ خدمة سريعة وموثوقة
🔐 ضمان تسجيل الدخول متوفر`,
    prices: { month: 0, year: 0 },
  },
  {
    id: `genspark-ai`,
    imageFile: "Service34.JPG",
    accent: `#7c3aed`,
    nameEn: `✨ Genspark AI Available`,
    nameAr: `✨ Genspark AI متوفر`,
    descriptionEn: `✨ Genspark AI Available
✅ Premium AI Access
✅ AI Search & Research Tool
✅ Create Smart Content Easily
✅ Fast Activation
✅ Reliable Service`,
    descriptionAr: `✨ Genspark AI متوفر
✅ وصول ذكاء اصطناعي بريميوم
✅ أداة بحث ودراسة بالذكاء الاصطناعي
✅ إنشاء محتوى ذكي بسهولة
✅ تفعيل سريع
✅ خدمة موثوقة`,
    prices: { month: 20, year: 240 },
  },
  {
    id: `claude-ai`,
    imageFile: "Service35.JPG",
    accent: `#d97706`,
    nameEn: `🤖 Claude AI Available`,
    nameAr: `🤖 Claude AI متوفر`,
    descriptionEn: `🤖 Claude AI Available
✅ Premium AI Assistant
✅ Advanced Writing & Research
✅ Coding & Productivity Support
✅ Fast Activation
✅ Reliable Access`,
    descriptionAr: `🤖 Claude AI متوفر
✅ مساعد ذكاء اصطناعي بريميوم
✅ كتابة وبحث متقدم
✅ دعم البرمجة وزيادة الإنتاجية
✅ تفعيل سريع
✅ وصول موثوق`,
    prices: { month: 8, year: 90 },
  },
  {
    id: `magic-light-ai`,
    imageFile: "Service36.JPG",
    accent: `#ec4899`,
    nameEn: `✨ Magic Light AI Available`,
    nameAr: `✨ Magic Light AI متوفر`,
    descriptionEn: `✨ Magic Light AI Available
✅ AI Video Creation Tool
✅ Create Stunning AI Videos
✅ Premium Access
✅ Fast & Reliable Service
✅ Instant Activation`,
    descriptionAr: `✨ Magic Light AI متوفر
✅ أداة إنشاء فيديوهات بالذكاء الاصطناعي
✅ إنشاء فيديوهات مذهلة بالذكاء الاصطناعي
✅ وصول بريميوم
✅ خدمة سريعة وموثوقة
✅ تفعيل فوري`,
    prices: { month: 8, year: 90 },
  },
  {
    id: `chaupal`,
    imageFile: "Service37.JPG",
    accent: `#16a34a`,
    nameEn: `🎬 Chaupal Available`,
    nameAr: `🎬 تشوبال متوفر`,
    descriptionEn: `🎬 Chaupal Available
✅ Premium Subscription
✅ Punjabi, Haryanvi & Regional Content
✅ HD Quality Streaming
✅ Fast Activation
✅ Unlimited Entertainment`,
    descriptionAr: `🎬 تشوبال متوفر
✅ اشتراك بريميوم
✅ محتوى بنجابي وهاريانفي ومحتوى إقليمي
✅ بث بجودة HD
✅ تفعيل سريع
✅ ترفيه غير محدود`,
    prices: { month: 1, year: 8 },
  },
  {
    id: `tod`,
    imageFile: "Service38.JPG",
    accent: `#0ea5e9`,
    nameEn: `⚽ TOD Subscription Available`,
    nameAr: `⚽ اشتراك TOD متوفر`,
    descriptionEn: `⚽ TOD Subscription Available
✅ Watch Live Sports & Entertainment
✅ Football, Movies & TV Shows
✅ HD Streaming Quality
✅ Fast Activation
✅ Available on Multiple Devices
📩 Order Now Today`,
    descriptionAr: `⚽ اشتراك TOD متوفر
✅ مشاهدة الرياضات المباشرة والترفيه
✅ كرة القدم والأفلام والبرامج التلفزيونية
✅ جودة بث HD
✅ تفعيل سريع
✅ متوفر على أجهزة متعددة
📩 اطلب الآن اليوم`,
    prices: { month: 0, year: 0 },
  },
  {
    id: `iptv`,
    imageFile: "Service39.JPG",
    accent: `#f97316`,
    nameEn: `📺 IPTV Subscription Available`,
    nameAr: `📺 اشتراك IPTV متوفر`,
    descriptionEn: `📺 IPTV Subscription Available
✅ Thousands of Live TV Channels
✅ Movies & Series Available
✅ HD & 4K Quality Streaming
✅ Works on Smart TV, Mobile & More
✅ Fast Activation & Support
📩 Contact Us Now for Subscription`,
    descriptionAr: `📺 اشتراك IPTV متوفر
✅ آلاف القنوات التلفزيونية المباشرة
✅ أفلام ومسلسلات متوفرة
✅ بث بجودة HD و 4K
✅ يعمل على التلفزيون الذكي والهاتف والمزيد
✅ تفعيل ودعم سريع
📩 تواصل معنا الآن للاشتراك`,
    prices: { month: 1, year: 8 },
  },
  {
    id: `tiktok-usa`,
    imageFile: "Service40.JPG",
    accent: `#111111`,
    nameEn: `🔥 TikTok USA Accounts Available`,
    nameAr: `🔥 حسابات تيك توك أمريكية متوفرة`,
    descriptionEn: `🔥 TikTok USA Accounts Available
✅ Ready to Login
✅ Secure Access
✅ Fast Service
📲 Order Now`,
    descriptionAr: `🔥 حسابات تيك توك أمريكية متوفرة
✅ جاهزة لتسجيل الدخول
✅ وصول آمن
✅ خدمة سريعة
📲 اطلب الآن`,
    prices: { month: 1, year: 8 },
  },
  {
    id: `esim-travel`,
    imageFile: "Service41.JPG",
    accent: `#0ea5e9`,
    nameEn: `📶 eSIM With Travel Plans 🌍✈️`,
    nameAr: `📶 شريحة eSIM مع خطط سفر 🌍✈️`,
    descriptionEn: `📶 eSIM With Travel Plans 🌍✈️
🌐 Stay Connected Anywhere, Anytime
🚀 Get Affordable Travel eSIMs With Fast Activation
📱 Instant Internet Access Without Physical SIM
🌍 Coverage In Multiple Countries Worldwide
⚡ Easy Setup And Reliable Connection
✅ Perfect For Travelers, Business Trips & Vacations ✈️
🔒 Secure And Hassle-Free Connectivity Everywhere`,
    descriptionAr: `📶 شريحة eSIM مع خطط سفر 🌍✈️
🌐 ابقَ متصلاً في أي مكان وأي وقت
🚀 احصل على شرائح eSIM للسفر بأسعار مناسبة مع تفعيل سريع
📱 إنترنت فوري بدون شريحة فعلية
🌍 تغطية في العديد من الدول حول العالم
⚡ إعداد سهل واتصال موثوق
✅ مثالية للمسافرين ورحلات العمل والإجازات ✈️
🔒 اتصال آمن وسهل بدون تعقيدات في كل مكان`,
    prices: { month: 1, year: 8 },
  },
  {
    id: `whatsapp-number`,
    imageFile: "Service42.JPG",
    accent: `#25d366`,
    nameEn: `📱 WhatsApp Number Available`,
    nameAr: `📱 أرقام واتساب متوفرة`,
    descriptionEn: `📱 WhatsApp Number Available
🔐 Only Login Warranty Provided
⚡ Get Active WhatsApp Numbers With Fast Delivery
✅ Reliable Service With Login Support Only
🚀 Easy Activation And Smooth Usage Experience
⚠️ Note: Login Warranty Only. No Replacement After Successful Login.`,
    descriptionAr: `📱 أرقام واتساب متوفرة
🔐 ضمان تسجيل الدخول فقط متوفر
⚡ احصل على أرقام واتساب مفعلة مع تسليم سريع
✅ خدمة موثوقة مع دعم تسجيل الدخول فقط
🚀 تفعيل سهل وتجربة استخدام سلسة
⚠️ ملاحظة: ضمان تسجيل الدخول فقط. لا يوجد استبدال بعد نجاح تسجيل الدخول.`,
    prices: { month: 1, year: 8 },
  }
];
