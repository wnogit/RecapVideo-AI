import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - RecapVideo.AI',
  description: 'Terms of Service for RecapVideo.AI video translation service',
};

export default function TermsPage() {
  return (
    <div className="container max-w-4xl py-12 md:py-20">
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 8, 2026</p>

        <section className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            By accessing or using RecapVideo.AI (&quot;the Service&quot;), you agree to be bound by these 
            Terms of Service. If you do not agree to these terms, please do not use our Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">2. Description of Service</h2>
          <p className="text-muted-foreground leading-relaxed">
            RecapVideo.AI is an AI-powered platform that allows users to create translated 
            and dubbed video recaps from YouTube content. Our Service includes:
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
            <li>YouTube transcript extraction</li>
            <li>AI-powered translation to multiple languages including Burmese</li>
            <li>Text-to-speech voice generation</li>
            <li>Video processing and rendering</li>
            <li>Cloud storage for generated videos</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">3. User Accounts</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            To use certain features of our Service, you must create an account. You agree to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Provide accurate and complete information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Notify us immediately of any unauthorized access</li>
            <li>Be responsible for all activities under your account</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">4. Credits and Payments</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Our Service operates on a credit-based system:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>New users receive 3 free credits upon signup</li>
            <li>Credits can be purchased through our platform</li>
            <li>Credits are non-refundable unless required by law</li>
            <li>Unused credits do not expire</li>
            <li>One credit equals one video creation</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">5. Acceptable Use</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            You agree NOT to use our Service to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Create content that infringes on intellectual property rights</li>
            <li>Generate illegal, harmful, or offensive content</li>
            <li>Distribute malware or spam</li>
            <li>Attempt to bypass security measures</li>
            <li>Use VPN or proxy to circumvent regional restrictions</li>
            <li>Resell or redistribute our Service without authorization</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">6. Intellectual Property</h2>
          <p className="text-muted-foreground leading-relaxed">
            You retain ownership of content you create using our Service. However, you are 
            responsible for ensuring you have the rights to use any source material. 
            RecapVideo.AI and its logos are trademarks of our company.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">7. Content Guidelines</h2>
          <p className="text-muted-foreground leading-relaxed">
            Users are responsible for ensuring their use of YouTube content complies with 
            YouTube&apos;s Terms of Service and applicable copyright laws. We recommend using 
            content that is either your own, licensed, or falls under fair use provisions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">8. Service Availability</h2>
          <p className="text-muted-foreground leading-relaxed">
            We strive to maintain 99.9% uptime but do not guarantee uninterrupted access. 
            We may temporarily suspend the Service for maintenance, updates, or security reasons.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
          <p className="text-muted-foreground leading-relaxed">
            RecapVideo.AI is provided &quot;as is&quot; without warranties. We are not liable for any 
            indirect, incidental, or consequential damages arising from your use of the Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">10. Termination</h2>
          <p className="text-muted-foreground leading-relaxed">
            We reserve the right to suspend or terminate accounts that violate these terms. 
            Upon termination, your right to use the Service ceases immediately.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">11. Changes to Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update these terms periodically. Continued use of the Service after changes 
            constitutes acceptance of the new terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">12. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            For questions about these Terms, please contact us at{' '}
            <a href="mailto:support@recapvideo.ai" className="text-primary hover:underline">
              support@recapvideo.ai
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
