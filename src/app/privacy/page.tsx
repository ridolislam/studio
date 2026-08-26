
import Navbar from "@/components/Navbar";
import { Lock, Shield, Eye, FileText, UserCheck } from "lucide-react";

export const metadata = {
  title: 'Privacy Policy - numcheckr Data Protection',
  description: 'Our commitment to protecting your privacy and business data at numcheckr.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-20 max-w-4xl space-y-12">
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-full mb-2">
            <Shield className="h-4 w-4 text-green-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Security Guaranteed</span>
          </div>
          <h1 className="text-5xl font-black italic uppercase tracking-tighter text-3d">Privacy Policy</h1>
          <p className="text-muted-foreground font-medium">Last Updated: February 2024</p>
        </header>

        <div className="grid grid-cols-1 gap-8">
          <section className="space-y-4 p-8 bg-card rounded-3xl border border-white/5">
            <div className="flex items-center gap-3">
              <Eye className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-black italic uppercase">1. Data Collection</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We collect minimal personal information required to maintain your account, such as your name and email address. When you use our verification tools, we process the data you upload (phone numbers) solely for the purpose of providing the verification service.
            </p>
          </section>

          <section className="space-y-4 p-8 bg-card rounded-3xl border border-white/5">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-black italic uppercase">2. How We Use Data</h2>
            </div>
            <div className="text-sm text-muted-foreground leading-relaxed">
              Your data is used to:
              <ul className="list-disc ml-6 mt-4 space-y-2 opacity-80">
                <li>Provide real-time validation results.</li>
                <li>Calculate and deduct credit usage.</li>
                <li>Ensure system security and prevent abuse.</li>
                <li>Improve our AI models (anonymized data only).</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4 p-8 bg-card rounded-3xl border border-white/5">
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-black italic uppercase">3. Data Security</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We employ industry-standard encryption protocols (SSL/TLS) for all data transfers. Your lead lists are processed in memory and are not permanently stored on our servers unless specifically required for history logs, which you can clear at any time.
            </p>
          </section>

          <section className="space-y-4 p-8 bg-card rounded-3xl border border-white/5">
            <div className="flex items-center gap-3">
              <UserCheck className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-black italic uppercase">4. Anonymous Payments</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              To further protect user privacy, we support decentralized crypto payments (USDT, BTC, etc.) which do not require KYC or personal financial identification.
            </p>
          </section>
        </div>

        <div className="p-8 rounded-3xl bg-primary/5 border border-primary/10 text-center">
          <p className="text-sm font-bold italic">
            Questions? Contact our legal team via WhatsApp or email at support@numcheckr.app
          </p>
        </div>
      </main>
    </div>
  );
}
