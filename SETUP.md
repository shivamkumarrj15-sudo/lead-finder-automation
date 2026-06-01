# Setup Guide: Apify to Telegram Lead Finder Automation

इस ऑटोमेशन को चलाने के लिए आपको 2 मुख्य चीजें सेटअप करनी होंगी:
1. **Apify API Token**
2. **Telegram Bot Token & Chat ID**

नीचे सभी स्टेप्स हिन्दी और इंग्लिश में विस्तार से समझाए गए हैं।

---

## 1. Apify API Token सेटअप करें

Apify Google Maps Scraper का उपयोग करने के लिए API Token की आवश्यकता होती है:
1. [Apify.com](https://apify.com/) पर जाएं और लॉगिन/रजिस्टर करें।
2. लॉगिन करने के बाद **Apify Console** पर जाएं।
3. बाएँ मेनू में **Settings** (सेटिंग्स) -> **Integrations** (इंटीग्रेशन) टैब पर क्लिक करें।
4. वहाँ आपको **Personal API token** दिखाई देगा, इसे कॉपी करें।
5. इस क्रेडेंशियल को `.env` फ़ाइल में `APIFY_TOKEN=` के आगे पेस्ट करें।

---

## 2. Telegram Bot & Chat ID सेटअप करें

1. **Telegram Bot Token प्राप्त करें:**
   - टेलीग्राम ऐप में **@BotFather** सर्च करें।
   - `/newbot` कमांड भेजें और अपने बोट का नाम और यूज़रनेम सेट करें।
   - बोट बनाने के बाद आपको एक **API Token** मिलेगा (जैसे: `123456789:ABCdefGh...`)।
   - इसे कॉपी करें और `.env` फ़ाइल में `TELEGRAM_BOT_TOKEN=` के आगे डालें।
   - **महत्वपूर्ण:** अपने बोट के साथ बातचीत शुरू करने के लिए टेलीग्राम पर उस बोट को खोलकर `/start` ज़रूर भेजें।

2. **Telegram Chat ID प्राप्त करें:**
   - टेलीग्राम पर **@userinfobot** या **@GetIDBot** सर्च करें।
   - उसे `/start` कमांड भेजें।
   - वह बोट आपको आपकी **Chat ID** (संख्याओं की एक सीरीज़, जैसे: `7863710238`) बता देगा।
   - इसे कॉपी करें और `.env` फ़ाइल में `TELEGRAM_CHAT_ID=` के आगे डालें।

---

## 3. GitHub पर होस्ट करना (Daily Automatic Runs at 7:00 PM IST)

यदि आप अपने कंप्यूटर को हर समय चालू नहीं रखना चाहते हैं, तो आप इसे **GitHub Actions** पर बिल्कुल फ्री में होस्ट कर सकते हैं:

1. **GitHub पर नया Repository बनाएं:**
   - [GitHub.com](https://github.com/) पर जाएं और एक नया **Private** रिपोजिटरी बनाएं।
2. **कोड को GitHub पर अपलोड (Push) करें:**
   - अपने फोल्डर `lead-finder-automation` में टर्मिनल खोलें और निम्नलिखित कमांड्स चलाएं:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git branch -M main
     git remote add origin https://github.com/आपका-यूज़रनेम/आपके-रिपोजिटरी-का-नाम.git
     git push -u origin main
     ```
3. **GitHub Secrets सेट करें:**
   - GitHub पर अपने रिपोजिटरी पेज पर जाएं।
   - **Settings** -> **Secrets and variables** (बाएँ मेनू में) -> **Actions** पर क्लिक करें।
   - **New repository secret** बटन पर क्लिक करें और निम्नलिखित 4 सीक्रेट्स जोड़ें:
     - `APIFY_TOKEN` (आपका Apify एपीआई टोकन)
     - `TELEGRAM_BOT_TOKEN` (आपका टेलीग्राम बोट टोकन)
     - `TELEGRAM_CHAT_ID` (आपकी टेलीग्राम चैट आईडी)
     - `SEARCH_LOCATION` (जिस शहर में सर्च करना है, जैसे: `Jaipur` या `Noida`)
4. **मैनुअल टेस्ट रन करना (Optional):**
   - रिपोजिटरी के **Actions** टैब पर जाएं।
   - बाएँ मेनू से **Daily Lead Generation** पर क्लिक करें।
   - **Run workflow** बटन पर क्लिक करके तुरंत टेस्ट रन कर सकते हैं।
   - ऑटोमेशन **हर दिन ठीक शाम 7:00 बजे IST (13:30 UTC)** अपने आप रन होकर आपको टेलीग्राम पर लीड्स भेज देगा।

---

## 4. लोकल (कंप्यूटर पर) चलाना और टेस्ट करना

### विकल्प A: तुरंत टेस्ट करने के लिए
टर्मिनल में यह कमांड चलाएं:
```bash
node index.js
```

### विकल्प B: कंप्यूटर पर बैकग्राउंड शेड्यूलर चालू करने के लिए
फोल्डर में स्थित **`start-scheduler.bat`** फ़ाइल पर डबल-क्लिक करें। यह कंप्यूटर पर शेड्यूलर मोड चालू कर देगा।

---

## 5. डेली कैटेगरी रोटेशन (Categories Rotation)

हमने `categories.json` फ़ाइल में 20 प्रकार की लोकप्रिय बिज़नेस कैटेगरीज़ (जैसे: `restaurants`, `dentists`, `gyms`, `cafes`, `salons`, आदि) पहले से ही डाल दी हैं।
- स्क्रिप्ट हर दिन के दिनांक (day of the year) के अनुसार आटोमैटिक तरीके से अलग कैटेगरी चुनेगी।
- उदाहरण: आज `restaurants in Jaipur` तो कल `dentists in Jaipur` का डेटा सर्च होगा।
- आप `categories.json` फ़ाइल को एडिट करके अपनी मनपसंद कैटेगरीज़ जोड़ या बदल सकते हैं।
