# Vyn Therapy — Complete UX Architecture & Journey Flow Map

## 1. Executive Product Philosophy
Vyn Therapy is an AI-powered physical recovery companion tailored for knowledge workers and desk-based professionals. Rather than functioning as a transactional hardware e-commerce catalog, Vyn weaves therapy hardware, software diagnostics, and guided habit formation into an integrated recovery ecosystem.

---

## 2. Global Navigation Architecture
The app follows standard mobile iOS/Android conventions with:
- **Persistent Header Navigation**: Brand identity, Hamburger Menu Drawer (access to quick shortcuts, AI Recovery Coach, settings, and hardware scanner), and contextual active tab indicator.
- **Bottom Navigation Bar (5 core destinations)**:
  1. **Home** — Daily Check-In, Recovery Score, Today’s Plan, Streak & Habit Engine.
  2. **Recover** — Clinical Protocols, Program Library, Interactive Guided Session Player.
  3. **Learn** — Streaming-style content hub (Video/Audio/Guides), Desk Health, Ergonomics, and Product How-To Library via QR Scanner.
  4. **Shop** — Problem-first therapeutic solutions, Curated Bundles, and Desk Setup Collections.
  5. **Progress / Profile** — Longitudinal recovery analytics, milestones, owned hardware ecosystem, and account management.

---

## 3. End-to-End User Journey Flows

### Flow 1: First-Time Onboarding & Personalized Profile Generation
```
[ App Launch / Splash ]
       ↓
[ Welcome & Value Proposition ]
       ↓
[ Account Creation (Better Auth) ]
       ↓
[ Step 1: Professional Context ]
  • Occupation (Developer, Designer, Accountant, Writer)
  • Daily seated hours (e.g. 8–10 hrs)
  • Workstation posture assessment
       ↓
[ Step 2: Discomfort & Target Focus Areas ]
  • Cervical / Tech Neck, Lumbar Spine, Wrist/Carpal Tunnel, Eye Strain
       ↓
[ Step 3: Hardware Pairing & Products Owned ]
  • Direct hardware QR code scan (Unlocks instant guides & paired protocols)
  • Or manual selection of Vyn ergonomic gear owned
       ↓
[ Step 4: AI Recovery Engine Baseline Calculation ]
  • Generates Initial Physical Resilience Index & Personalized 30-Day Protocol
       ↓
[ Land on Home Dashboard ]
```

---

### Flow 2: Daily Habit & AI Recovery Coach Loop (5–12 mins)
```
[ User Opens App in Morning / Post-Desk Work ]
       ↓
[ Daily 60-Second Check-in Modal ]
  • How does your body feel? (😊 Great · 😐 Okay · 😣 Sore · 😫 Severe)
  • Acute strain hotspots (Neck, Lower Back, Forearms)
       ↓
[ AI Coach Real-Time Plan Generation ]
  • Dynamically compiles 3–4 micro-actions:
    1. 3-min Morning Cervical Mobilization
    2. 5-min Desk Psoas Decompression
    3. Targeted Device Protocol (e.g., Cervical Collar or Acupressure Arc)
    4. Hydration & Micro-Break Timer
       ↓
[ Complete Guided Recovery Session ]
  • Full-screen session player: Video stream, voice cueing, interval countdown, pause/resume
       ↓
[ Post-Session Check & Completion Screen ]
  • Immediate Recovery Score update (+8 pts)
  • Streak Extended (🔥 15 Days)
  • Contextual educational tip & non-intrusive recovery product synergy
```

---

### Flow 3: Hardware QR Scanning & Interactive Product Guide Flow
```
[ User Receives Physical Vyn Product or Box ]
       ↓
[ Scan QR Code via App Header / Learn Tab / Scanner Modal ]
  • Camera instantly decodes secure hardware QR token
       ↓
[ Unlocks Exclusive Product Hub ]
  • "How to Use" Clinician Video Guide (1080p stream)
  • Optimal posture angles & contraindication notes
  • 1-Click "Add to Routine" pairing with existing recovery programs
  • Warranty & direct replacement support
       ↓
[ Hardware Registered to "Products Owned" in User Profile ]
```

---

### Flow 4: Problem-First Discovery & Shopping Flow
```
[ User Identifies Pain Point in Check-In or Navigates to Shop ]
       ↓
[ "Shop by Problem" (Not Category) ]
  • "Tech Neck & Upper Back" → Shows Cervical Traction Pillow + Heat Collar
  • "Carpal Tunnel & Wrist Fatigue" → Shows Micro-Current Wrist Band + Ergonomic Mouse Pad
       ↓
[ Product Story & Clinical Efficacy Page ]
  • Clinician validation & anatomical breakdown
  • Video demonstration & reviews by verified professionals
  • Routine integration preview
       ↓
[ Fast 1-Click Checkout (Flutterwave) ]
       ↓
[ Order Confirmation + Instant Digital Program Unlock ]
```

---

### Flow 5: Gamification, Habit Retention & Progress Flow
```
[ Daily Completion ]
       ↓
[ Earn XP & Resilience Score Boost ]
       ↓
[ Milestone Unlocked ] (e.g. "14-Day Posture Champion", "20-Hour Reset Club")
       ↓
[ Weekly / Monthly Progress Analytics Review ]
  • Body region recovery status (%)
  • Time under therapeutic tension
  • Exportable Cryptographic Report for Physical Therapist / Ergonomist
```
