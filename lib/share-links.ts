import { APP_URL } from '@/lib/app-url';

/** The public page where customers join a business and see its forms */
export function businessPageUrl(businessId: string): string {
  return `${APP_URL}/b/${businessId}`;
}

export function formUrl(slug: string): string {
  return `${APP_URL}/forms/${slug}`;
}

// Free "share" links: they open the business owner's own WhatsApp / email app with the message ready,
// so nothing is sent from our servers and any recipient can be reached.
export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function mailtoUrl(to: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
