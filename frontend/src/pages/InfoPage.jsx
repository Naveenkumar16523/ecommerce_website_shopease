import React from 'react';
import { useLocation } from 'react-router-dom';

const INFO_PAGES_CONTENT = {
  '/about': {
    tag: 'Our Story',
    title: 'About ShopEase',
    subtitle: 'Redefining modern style with high-end luxury curation and stellar aesthetics.',
    sections: [
      {
        heading: 'Who We Are',
        content: 'ShopEase is a next-generation curated boutique bringing elite fashion to style enthusiasts globally. We represent a intersection of timeless styling, modern digital commerce, and stellar customer experiences.'
      },
      {
        heading: 'Our Vision',
        content: 'To democratize access to high-end global fashion and luxury couture by leveraging seamless technology and intuitive designs. We believe that what you wear is an extension of your creative self-expression.'
      }
    ]
  },
  '/features': {
    tag: 'Capabilities',
    title: 'ShopEase Features',
    subtitle: 'Engineered for smooth navigation, instant search, and a secure shopping environment.',
    sections: [
      {
        heading: 'Theme-Aware Curation',
        content: 'Switch between Light Mode, Dark Mode, and the high-fidelity Cosmic Theme designed to adapt to your environment and personal comfort.'
      },
      {
        heading: 'Instant Cart & Checkout',
        content: 'Equipped with a secure billing process, local and international shipping configurations, and dynamic real-time inventory checks.'
      }
    ]
  },
  '/works': {
    tag: 'How It Works',
    title: 'How ShopEase Works',
    subtitle: 'From premium designer curation directly to your doorstep in three simple phases.',
    sections: [
      {
        heading: '1. Curation & Discover',
        content: 'Our team partners directly with global houses to import authentic products. You explore, refine by categories/styles, and discover new drops.'
      },
      {
        heading: '2. Secure Ordering',
        content: 'Add products to your cart, specify shipping preferences, and pay securely using credit cards, PayPal, or UPI.'
      },
      {
        heading: '3. Express Fulfillment',
        content: 'Orders are dispatched within 24 hours from our centralized hubs. Full end-to-end tracking coordinates are sent straight to your email.'
      }
    ]
  },
  '/career': {
    tag: 'Join Us',
    title: 'Galactic Careers',
    subtitle: 'We are always looking for stellar designers, engineers, and curators to join our crew.',
    sections: [
      {
        heading: 'Our Culture',
        content: 'We operate in a highly collaborative, fast-paced remote environment. We value extreme ownership, visual detail, and passion for design.'
      },
      {
        heading: 'Open Opportunities',
        content: 'Interested in working with us? Send your portfolio and resume to careers@shopease.com, and we will get back to you if there is a match!'
      }
    ]
  },
  '/delivery': {
    tag: 'Logistics',
    title: 'Delivery & Shipments',
    subtitle: 'Understanding shipping speeds, import guidelines, and courier partners.',
    sections: [
      {
        heading: 'Standard Shipping',
        content: 'Takes 3-5 business days. Free for all orders exceeding $150. Fully insured and trackable.'
      },
      {
        heading: 'Cosmic Express Delivery',
        content: 'Next-day delivery available in major metropolitan regions. Flat rate of $15 applies.'
      }
    ]
  },
  '/terms': {
    tag: 'Legal',
    title: 'Terms & Conditions',
    subtitle: 'Operating rules, sales terms, liability limits, and user agreements.',
    sections: [
      {
        heading: 'Use of Service',
        content: 'By accessing or purchasing from ShopEase, you agree to our standard operating guidelines. All content, imagery, and code are intellectual property of ShopEase.'
      },
      {
        heading: 'Order Acceptance',
        content: 'We reserve the right to cancel or limit orders in case of pricing errors, stock shortages, or suspicious security warnings.'
      }
    ]
  },
  '/privacy': {
    tag: 'Security',
    title: 'Privacy Policy',
    subtitle: 'Your data security, cookie settings, and GDPR/CCPA compliance details.',
    sections: [
      {
        heading: 'Information Collection',
        content: 'We collect name, email, shipping addresses, and transaction cookies strictly to process orders and improve user session persistence.'
      },
      {
        heading: 'Data Sharing',
        content: 'We do NOT sell or rent your data. It is only shared with authorized merchant processors and shipping partners to complete your orders.'
      }
    ]
  },
  '/faq-account': {
    tag: 'FAQ',
    title: 'Account FAQ',
    subtitle: 'Resolving issues relating to profile settings and password resets.',
    sections: [
      {
        heading: 'How do I reset my password?',
        content: 'Navigate to the Login page and select "Forgot Password" or contact support@shopease.com to receive a verification reset key.'
      },
      {
        heading: 'Can I delete my account?',
        content: 'Yes, submit a request via the Support panel or email privacy@shopease.com to purge your profile data from our databases.'
      }
    ]
  },
  '/faq-deliveries': {
    tag: 'FAQ',
    title: 'Deliveries FAQ',
    subtitle: 'Answers regarding shipment delays, tracking, and missing packages.',
    sections: [
      {
        heading: 'Where is my order tracking number?',
        content: 'Your tracking number is emailed immediately upon dispatch. You can also view it inside the Orders tab of your User Profile.'
      },
      {
        heading: 'Do you ship internationally?',
        content: 'Yes, we ship to over 120 countries. Customs fees and duties are calculated during checkout based on the delivery destination.'
      }
    ]
  },
  '/faq-orders': {
    tag: 'FAQ',
    title: 'Orders FAQ',
    subtitle: 'Modifying, cancelling, or checking order statuses.',
    sections: [
      {
        heading: 'Can I cancel my order?',
        content: 'Orders can be cancelled within 1 hour of placement before they enter the packaging phase. Go to Profile > Orders and hit Cancel.'
      },
      {
        heading: 'Can I change my delivery address?',
        content: 'If your order has not been dispatched, reach out immediately to live support or mail support@shopease.com with your order code.'
      }
    ]
  },
  '/faq-payments': {
    tag: 'FAQ',
    title: 'Payments FAQ',
    subtitle: 'Authorized payment platforms, refunds, and invoice details.',
    sections: [
      {
        heading: 'What payment methods do you support?',
        content: 'We support all major credit cards, PayPal Express, Apple Pay, Google Pay, and localized UPI transfers.'
      },
      {
        heading: 'How long does a refund take?',
        content: 'Refunds are processed immediately upon cancellation or returned package approval. It takes 5-10 business days for bank transfers to settle.'
      }
    ]
  }
};

export default function InfoPage() {
  const { pathname } = useLocation();
  
  // Resolve path alias (e.g. /delivery-details maps to /delivery)
  const resolvedPath = pathname === '/delivery-details' ? '/delivery' : pathname;
  const pageContent = INFO_PAGES_CONTENT[resolvedPath] || {
    tag: 'Info',
    title: 'Information Page',
    subtitle: 'Welcome to the ShopEase information catalog.',
    sections: [
      {
        heading: 'Details Not Found',
        content: 'We apologize, but this specific page is currently under maintenance. Please navigate back to home.'
      }
    ]
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#070A11] text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Header */}
      <section className="relative py-24 px-6 md:px-16 text-center overflow-hidden border-b border-gray-100 dark:border-gray-900/50 bg-gradient-to-b from-gray-50/50 to-white dark:from-[#0a0f1d] dark:to-[#070A11]">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-500/5 dark:bg-purple-500/5 rounded-full filter blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <span className="text-xs font-bold tracking-[0.25em] text-purple-600 dark:text-neonCyan uppercase mb-3 inline-block">
            {pageContent.tag}
          </span>
          <h1 className="font-syne text-4xl md:text-6xl font-black mb-6 tracking-tight uppercase dark:text-white">
            {pageContent.title}
          </h1>
          <p className="max-w-2xl mx-auto text-base text-gray-600 dark:text-gray-400 font-light leading-relaxed">
            {pageContent.subtitle}
          </p>
        </div>
      </section>

      {/* Main Info Sections */}
      <main className="py-20 px-6 md:px-16 max-w-4xl mx-auto">
        <div className="space-y-16">
          {pageContent.sections.map((section, idx) => (
            <div key={idx} className="border-l-2 border-purple-500/20 dark:border-neonCyan/20 pl-6 md:pl-8">
              <h2 className="text-xl md:text-2xl font-bold mb-4 dark:text-white uppercase tracking-wider font-syne">
                {section.heading}
              </h2>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 font-light leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
