# 🧪 Exam Fight Chemistry

> **Production Chemistry Examination & Live Proctoring Platform** with environmental 360° room scan verification, real-time webcam & microphone monitoring, KaTeX chemistry rendering, and centralized evidence review.

---

## 🌟 Overview & Capabilities

**Exam Fight Chemistry** is a secure, full-stack examination portal engineered for chemistry departments, universities, and testing institutions.

### Key Architecture Modules
1. **Single Entry Authentication**: Unified Sign In and Sign Up with role-based routing (Student, Teacher, Admin).
2. **Interactive Chemistry Question Engine**: Full KaTeX formatting, Unicode subscripts/superscripts/charges, and a Chemistry Virtual Keyboard.
3. **Continuous Hardware Proctoring**: Real-time camera, microphone, face detection, eye tracking, and tab-switch/fullscreen violation locking.
4. **Mandatory 360° Environmental Room Scan**: Minimum 300° scan enforcement with instant invalidation & restart on camera loss.
5. **Centralized Teacher Evidence Review**: Dedicated evidence review console to inspect candidate room scans, recordings, audio logs, and timestamped event timelines.
6. **Dedicated Periodic Table**: Integrated reference periodic table on Student Home with interactive element property inspection.
7. **Exam Calculator**: Built-in scientific calculator with standard physical chemistry constants ($R$, $N_A$, $F$, $h$, $c$).

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- npm or pnpm

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/your-org/exam-fight-chemistry.git
cd exam-fight-chemistry

# Install dependencies
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🗄️ Supabase Backend Configuration

To connect your Supabase production database instance:

### Step 1: Set Environment Variables
Copy `.env.example` to `.env` and fill in your keys:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 2: Initialize Database Schema
1. In your Supabase Dashboard, open the **SQL Editor**.
2. Run the SQL statements in [`supabase/schema.sql`](supabase/schema.sql).
3. Tables and security policies created:
   - `profiles` (Row Level Security protected)
   - `exams`, `questions`, `exam_attempts`, `answers`
   - `proctoring_events`, `room_scans`, `evidence`
   - Role-enforced triggers preventing unauthorized admin privilege escalation.

---

## 🛡️ Production Admin Provisioning

For security, admin accounts cannot be registered publicly via the web application.

### Secure Admin Creation:
1. Register your admin email via standard authentication.
2. In Supabase SQL Editor, promote the account securely:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'admin@examfight.chem';
   ```

---

## 📦 Production Build & Deployment

### Build for Production
```bash
npm run build
```
Build output is generated into the `dist/` directory.

### Deploy to Vercel
1. Connect your repository to Vercel.
2. Set Build Command: `npm run build`
3. Set Output Directory: `dist`
4. Configure Environment Variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
5. `vercel.json` is pre-configured with SPA routing rewrites.

---

## 📄 License
Academic & Institutional Examination Platform — Exam Fight Chemistry.
