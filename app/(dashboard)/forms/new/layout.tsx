// AI generation (with retries) can exceed Vercel's default function timeout; the page itself is a client component
export const maxDuration = 60;

export default function NewFormLayout({ children }: { children: React.ReactNode }) {
  return children;
}
