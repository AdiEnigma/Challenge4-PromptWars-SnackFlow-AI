# SnackFlow AI 🍕🏟️

SnackFlow AI is a modern, AI-powered stadium food ordering system. It brings a "Tinder-style" swiping experience to stadium concessions, reducing queue times, maximizing vendor efficiency, and providing stadium managers with real-time demand analytics.

## 🚀 How to Navigate & Access the App

SnackFlow AI consists of three interconnected applications. When you visit the main public URL (e.g., your Vercel deployment link), you will land on the **Hub Page**, which provides direct links to all three portals. 

You can also access them directly via their specific URL paths:

### 1. 🍕 Fan Interface
* **URL Path:** `/fan/` (e.g., `https://your-app.vercel.app/fan/`)
* **Who it's for:** Stadium attendees looking to order food.
* **How to navigate:** Just open the link on a mobile device or desktop. You'll immediately be dropped into the "Swipe" feed where you can swipe right to like a food item, or left to skip it. 

### 2. 🧑‍🍳 Vendor Dashboard
* **URL Path:** `/vendor/` (e.g., `https://your-app.vercel.app/vendor/`)
* **Who it's for:** Food stall operators and kitchen staff inside the stadium.
* **How to navigate:** Open the link to access the vendor portal. From here, you can see live orders, manage your menu, and add new food items that will instantly appear in the Fan Interface's swipe feed.

### 3. 📊 Manager Dashboard
* **URL Path:** `/manager/` (e.g., `https://your-app.vercel.app/manager/`)
* **Who it's for:** Stadium operations and facility managers.
* **How to navigate:** Open the link to view the high-level operations dashboard. You will see stadium-wide analytics, heatmaps of where demand is highest, and AI predictions.

---

## ✨ Key Features

### Fan Experience (Tinder for Food)
- **Swipe-to-Discover:** A fun, engaging UI where fans swipe right to crave and left to skip.
- **Smart Cart Building:** Liked items are automatically added to a cart.
- **AI-Powered Routing:** Once a fan decides what they want, the AI analyzes stall queue lengths, prep times, and walking distance to direct the fan to the fastest possible stall, avoiding congestion.

### Vendor Tools
- **Live Menu Management:** Vendors can add new menu items (with dietary tags, pricing, and images) and mark items as "Popular" or "Sold Out."
- **Instant Feed Updates:** Any changes made by the vendor instantly reflect in the Fan app's swipe feed.
- **Queue Tracking:** Vendors can monitor their current queue length and order volume in real-time.

### Stadium Manager Analytics
- **Live Demand Heatmaps:** Visualize which sections of the stadium are experiencing the highest food demand to deploy staff dynamically.
- **Predictive AI Insights:** The system uses TensorFlow.js to predict upcoming surges in food demand based on game events (e.g., halftime approaching).
- **Revenue & Congestion Monitoring:** Track total sales, average wait times, and bottleneck stalls across the entire venue.

---

## 🛠️ Tech Stack
- **Frontend:** React, Vite, Material UI (MUI), TypeScript, Emotion
- **Backend/AI:** Node.js, Express, Socket.io, TensorFlow.js (for demand prediction)
- **Monorepo:** Managed via npm workspaces (`frontend`, `backend`, `ai-ml`)
