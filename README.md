# VeloxForm

**AI-powered form builder** – create smart forms in seconds, share them with a public link, and let AI help respondents understand and complete them.

🔗 **Live demo:** [veloxform-sara.vercel.app](https://veloxform-sara.vercel.app)

## Screenshots

**AI form generation** – describe the form in words or upload an image, and the form is ready in seconds
<img width="1902" height="757" alt="AI form generation" src="https://github.com/user-attachments/assets/1d3048de-7bb4-4a63-a69f-c2eeb101746c" />

**Business dashboard** – all forms, submissions and customers in one place
<img width="1897" height="722" alt="Business dashboard" src="https://github.com/user-attachments/assets/795fec7a-ef32-46c1-8ebe-753117c07b63" />

**Sharing with customers** – QR code, WhatsApp or a direct link
<img width="1892" height="885" alt="Sharing with customers" src="https://github.com/user-attachments/assets/795a8e0a-bfa3-42f4-80d1-f895cfcc0531" />


---

## Features

- **AI form generation** – describe the form in words or upload an image, and get a ready-to-use form (OpenAI API)
- **AI explanations** – respondents can ask the AI to explain fields and questions while filling the form
- **Visual form builder** – add, edit and arrange fields from the dashboard
- **Public form links** – every form gets a shareable URL (`/forms/[slug]`)
- **Digital signature** – signature field for forms that require one
- **PDF export** – completed submissions are generated as PDF files
- **Submissions dashboard** – view and manage all responses in one place
- **Email notifications** – automated emails via Resend
- **Authentication** – sign up and login with protected dashboard routes
- - **Easy sharing** – share forms via QR code, WhatsApp or a direct link
- **Customer management** – track customers and their submissions from the dashboard

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui |
| State management | Zustand |
| Backend & Database | Supabase (PostgreSQL, Auth, Storage) |
| AI | OpenAI API |
| Email | Resend |
| Deployment | Vercel |

## Development Process

This project was built end-to-end using **AI-assisted development with Claude Code and Cursor** – from planning the architecture and database schema, through feature development and refactoring, to debugging and deployment.

## Project Structure

```
app/
  (auth)/          # Login and registration
  (dashboard)/     # Dashboard, form builder, submissions
  forms/[slug]/    # Public form page
components/        # UI, fields, builder, signature, PDF
lib/               # Supabase, OpenAI, PDF, validations, email
store/             # Zustand form builder store
supabase/          # Database schema
types/             # TypeScript types
```

## Getting Started

1. Run `supabase/schema.sql` in the Supabase SQL Editor
2. Create Storage buckets: `signatures`, `uploads`, `pdfs` (public read)
3. Create a `.env.local` file with your Supabase, OpenAI and Resend keys
4. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

Developed by **Sara Abash** · [GitHub](https://github.com/SaraAbashGit)
