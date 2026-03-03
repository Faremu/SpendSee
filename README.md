# SpendSee 💰

**Intelligent Wealth Orchestration**

SpendSee is a high-performance, visually-driven personal finance dashboard designed for precision wealth management. It combines real-time categorical flow analysis with an automated "Auto-Pilot" rule engine to help you orchestrate your financial footprint.

![SpendSee Dashboard](/assets/UI.png)

## ✨ Key Features

- **📊 Footprint Analysis**: Interactive D3-powered TreeMap visualization of your categorical expenses.
- **🤖 Auto-Pilot**: Define custom DCA (Dollar Cost Averaging) and Savings rules. Supports both percentage-based and fixed-amount allocations.
- **🖼️ Smart Brand Icons**: Automatically pulls high-quality brand logos from any domain using the Vexly Logo Proxy API.
- **📱 Mobile Optimized**: Fully responsive bento-grid layout that feels like a native app on mobile devices.
- **⚡ Real-time Ledger**: Instant logging of inflows and outflows with local persistence.
- **💸 Salary Integration**: Dynamic balance calculation based on your monthly income and active rules.

## 🚀 Tech Stack

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4 (Alpha)
- **Visualization**: D3.js
- **Build Tool**: Vite 6
- **Mobile**: Capacitor 8 (Android Support)

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Faremu/SpendSee
   cd mymoney
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## 📱 Mobile Deployment (Android)

This project is ready for mobile using Capacitor.

1. Build the web project:
   ```bash
   npm run build
   ```

2. Initialize Capacitor (if not already done):
   ```bash
   npm run mobile:init
   ```

3. Add Android platform:
   ```bash
   npm run mobile:add-android
   ```

4. Sync and Open in Android Studio:
   ```bash
   npm run mobile:sync
   ```
   ```bash
   npm run mobile:open-android
   ```

## 🎨 Design Philosophy

SpendSee follows a **Bento Grid** design philosophy, prioritizing information density and scannability. The UI uses a sophisticated palette of `slate`, `emerald`, and `indigo` to convey trust and precision.

## 📄 License

MIT License - feel free to use this for your own financial orchestration!
