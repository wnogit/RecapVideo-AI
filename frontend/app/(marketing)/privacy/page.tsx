import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - RecapVideo.AI',
  description: 'Privacy Policy for RecapVideo.AI video translation service',
};

export default function PrivacyPage() {
  return (
    <div className="container max-w-4xl py-12 md:py-20">
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 8, 2026</p>

        <section className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">1. Introduction</h2>
          <p className="text-muted-foreground leading-relaxed">
            RecapVideo.AI (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) respects your privacy and is committed to 
            protecting your personal data. This Privacy Policy explains how we collect, use, 
            and safeguard your information when you use our Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">2. Information We Collect</h2>
          
          <h3 className="text-lg font-medium mt-6 mb-3">2.1 Account Information</h3>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Email address</li>
            <li>Name (if provided)</li>
            <li>Profile picture (from Google OAuth)</li>
            <li>Password (encrypted)</li>
          </ul>

          <h3 className="text-lg font-medium mt-6 mb-3">2.2 Usage Data</h3>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Videos created and processed</li>
            <li>YouTube URLs submitted</li>
            <li>Credit transaction history</li>
            <li>Login timestamps and session data</li>
          </ul>

          <h3 className="text-lg font-medium mt-6 mb-3">2.3 Technical Data</h3>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>IP address</li>
            <li>Browser type and version</li>
            <li>Device information</li>
            <li>Operating system</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We use the collected information to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Provide and maintain our Service</li>
            <li>Process your video requests</li>
            <li>Manage your account and credits</li>
            <li>Send important service notifications</li>
            <li>Prevent fraud and abuse</li>
            <li>Improve our Service and user experience</li>
            <li>Respond to customer support requests</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">4. Data Storage and Security</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We take data security seriously:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>All data is encrypted in transit (HTTPS/TLS)</li>
            <li>Passwords are hashed using industry-standard algorithms</li>
            <li>Videos are stored securely in cloud storage (Cloudflare R2)</li>
            <li>We use secure, reputable hosting providers</li>
            <li>Regular security audits and updates</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">5. Data Sharing</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We do NOT sell your personal data. We may share data with:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>Service Providers:</strong> Cloud hosting, payment processors, email services</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            <li><strong>Business Transfers:</strong> In case of merger or acquisition</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">6. Third-Party Services</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We integrate with the following third-party services:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>Google OAuth:</strong> For secure sign-in</li>
            <li><strong>YouTube:</strong> For transcript extraction</li>
            <li><strong>Cloudflare R2:</strong> For video storage</li>
            <li><strong>Microsoft Azure:</strong> For text-to-speech services</li>
            <li><strong>OpenAI/Google AI:</strong> For translation and summarization</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">7. Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use essential cookies for authentication and session management. 
            We do not use tracking or advertising cookies.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">8. Your Rights</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            You have the right to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Export your data</li>
            <li>Withdraw consent at any time</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">9. Data Retention</h2>
          <p className="text-muted-foreground leading-relaxed">
            We retain your data for as long as your account is active. Upon account deletion, 
            we will remove your personal data within 30 days, except where retention is 
            required by law.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">10. Children&apos;s Privacy</h2>
          <p className="text-muted-foreground leading-relaxed">
            Our Service is not intended for users under 13 years of age. We do not knowingly 
            collect data from children under 13.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">11. International Data Transfers</h2>
          <p className="text-muted-foreground leading-relaxed">
            Your data may be processed in countries other than your own. We ensure appropriate 
            safeguards are in place for international data transfers.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">12. Changes to This Policy</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update this Privacy Policy periodically. We will notify you of significant 
            changes via email or through the Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">13. Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            For privacy-related questions or requests, contact us at:{' '}
            <a href="mailto:privacy@recapvideo.ai" className="text-primary hover:underline">
              privacy@recapvideo.ai
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
