# **Vyn Therapy Expanded Business PRD**

## **Vision**

AI-powered recovery companion for knowledge workers.

## **Mission**

Deliver personalized recovery guidance, education, habit building and curated products.

## **Value Proposition**

Complete recovery ecosystem instead of product-only commerce.

## **Problem**

Desk-based professionals suffer recurring physical strain and lack integrated recovery support.

## **Target Persona**

·       Knowledge workers  
·       Future: active professionals, healthcare workers

## **Customer Journey**

1\.       Discover  
2\.       Purchase  
3\.       Download App  
4\.       Profile  
5\.       Assessment  
6\.       Recovery Plan  
7\.       Guided Session  
8\.       Progress  
9\.       Recommendations  
10\.   Repeat Purchase  
11\.   Subscription  
12\.   Advocacy

## **User App Features**

### **Home**

·       Check-in  
·       Recovery score  
·       Plan  
·       Streak

### **Recover**

·       Programs  
·       Guided sessions

### **Learn**

·       Articles  
·       Videos

### **Shop**

·       Problem-first shopping  
·       Bundles

### **Progress**

·       Analytics  
·       Milestones

### **Profile**

·       Orders  
·       Goals

## **Admin Features**

·       Dashboard  
·       Users  
·       Products  
·       Orders  
·       Programs  
·       Content  
·       AI KB  
·       QR  
·       Notifications  
·       Analytics  
·       Support

## **Locked Technical Decisions**

Decided with stakeholder; implementation must follow `docs/implementation-plan.md`.

·       **User app:** React Native via Expo (iOS + Android, OTA updates) — NOT Next.js web
·       **Admin portal:** Next.js (TypeScript)
·       **Backend API:** Node.js (NestJS recommended)
·       **Auth:** Better Auth, self-hosted + Postgres — NO Supabase, no per-user-fee vendor
·       **Storage:** Cloudflare R2 (S3-compatible) + CDN for videos, images, product media
·       **Payments:** Flutterwave for checkout, refunds, repeat purchase and subscriptions — NO Stripe
·       **Commerce/fulfillment:** NO Shopify. Own product/bundle catalog in Postgres is the system of record. Interim fulfillment via a minimal external WooCommerce bridge store (invisible to customers) so TeemDrop auto-sync can fulfill orders; swap to a direct TeemDrop API behind the same provider interface once confirmed
·       **"Download App" journey step** = native store install (Expo) with push, camera QR scan, offline guided sessions

