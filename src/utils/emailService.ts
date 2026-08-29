import { Invoice } from '../types';
import { formatTaka, toBanglaNumber } from '../utils';

export interface EmailSettings {
  serviceId: string;
  templateId: string;
  publicKey: string;
  enabled: boolean;
  senderName: string;
}

// These are Molla Electronics fallback or template configurable keys for EmailJS
const LOCAL_STORAGE_KEY = 'molla_email_config_v1';

export const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
  serviceId: 'service_molla_electronics', // Placeholder for user customizable service ID
  templateId: 'template_invoice_copy',   // Placeholder for user customizable template ID
  publicKey: 'user_public_key_molla',    // Placeholder for user public token
  enabled: true,
  senderName: 'মোল্লা ইলেকট্রনিক্স'
};

export const emailStorage = {
  getSettings(): EmailSettings {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_EMAIL_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Error fetching email settings', e);
    }
    return DEFAULT_EMAIL_SETTINGS;
  },

  saveSettings(settings: EmailSettings): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving email settings', e);
    }
  }
};

/**
 * Sends a stylized digital copy of the invoice to the customer's email using EmailJS.
 */
export async function sendInvoiceEmail(
  invoice: Invoice,
  customSettings?: EmailSettings
): Promise<{ success: boolean; message: string }> {
  const settings = customSettings || emailStorage.getSettings();

  if (!settings.enabled) {
    return { success: false, message: 'স্বয়ংক্রিয় মেইল পাঠানো বন্ধ রয়েছে।' };
  }

  if (!invoice.customerEmail || !invoice.customerEmail.includes('@')) {
    return { success: false, message: 'কাস্টমারের জেনুইন ইমেইল অ্যাড্রেস পাওয়া যায়নি।' };
  }

  // Construct summarized details of products
  const itemsText = invoice.items
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.productName} (${toBanglaNumber(item.quantity)} পিস) - মূল্য: ${formatTaka(item.price)} (মোট: ${formatTaka(item.total)})`
    )
    .join('\n');

  // Online invoice reader link
  const onlineInvoiceLink = `${window.location.origin}/invoice/${invoice.id}`;

  const templateParams = {
    to_name: invoice.customerName,
    to_email: invoice.customerEmail,
    invoice_id: invoice.id,
    date: toBanglaNumber(invoice.date.split('-').reverse().join('/')),
    sender_brand: settings.senderName,
    items_summary: itemsText,
    subtotal: formatTaka(invoice.subtotal),
    discount: formatTaka(invoice.discount),
    total_payable: formatTaka(invoice.totalPayable),
    paid_amount: formatTaka(invoice.paid),
    due_amount: formatTaka(invoice.due),
    payment_method: invoice.paymentMethod,
    invoice_link: onlineInvoiceLink,
    notes: invoice.due > 0 
      ? `আপনার মেমোতে অবশিষ্ট বকেয়া রয়েছে ${formatTaka(invoice.due)} টাকা। দয়া করে দ্রুত পরিশোধ করুন।` 
      : 'আপনার সম্পুর্ণ বিল পরিশোধিত হয়েছে। মোল্লা ইলেকট্রনিক্সের সাথে থাকার জন্য ধন্যবাদ!'
  };

  try {
    // If keys are placeholder/defaults, we simulation-send with realistic delay and log to prevent client-side HTTP mock fail
    // However, if custom credentials are keyed in, it performs REAL EmailJS POST requests!
    const isPlaceholder = 
      settings.serviceId === DEFAULT_EMAIL_SETTINGS.serviceId || 
      settings.publicKey === DEFAULT_EMAIL_SETTINGS.publicKey;

    if (isPlaceholder) {
      // Simulate real API latency to feel premium and authentic
      await new Promise((resolve) => setTimeout(resolve, 1400));
      
      console.log('--- Mock Sending Automated Invoice Email ---');
      console.log('API Endpoint: https://api.emailjs.com/api/v1.0/email/send');
      console.log('Template Params:', templateParams);
      console.log('---------------------------------------------');

      return {
        success: true,
        message: `[ডেমো মোড] কাস্টমার "${invoice.customerName}" কে (${invoice.customerEmail}) মেইল কপি সিমুলেশন করা হয়েছে। (বাস্তব মেইল পাঠাতে অ্যাডমিন সেটিংসে আপনার নিজস্ব EmailJS কী দিন।)`
      };
    }

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        service_id: settings.serviceId,
        template_id: settings.templateId,
        user_id: settings.publicKey,
        template_params: templateParams
      })
    });

    if (response.ok) {
      return { 
        success: true, 
        message: `কাস্টমার ইমেইল (${invoice.customerEmail}) ঠিকানায় মেমোর ডিজিটাল কপি সফলভাবে পাঠানো হয়েছে!` 
      };
    } else {
      const errorText = await response.text();
      return { 
        success: false, 
        message: `EmailJS ত্রুটি: ${errorText || 'সার্ভার রেসপন্স ব্যর্থ হয়েছে।'} অনুগ্রহ করে অ্যাডমিন সেটিংসে কী চেক করুন।` 
      };
    }
  } catch (error: any) {
    console.error('Email send failure:', error);
    return { 
      success: false, 
      message: `ইমেল সংযোগ করতে ব্যর্থ হয়েছে: ${error?.message || 'নেটওয়ার্ক এরর'}` 
    };
  }
}
