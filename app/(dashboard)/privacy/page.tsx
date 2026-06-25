import Link from "next/link";
import Image from "next/image";
import { Fingerprint, ArrowLeft, Eye, Lock, Radio } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <div className="border-b border-white/5">
        <div className="mx-auto max-w-3xl px-4 py-6 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="relative h-8 w-8">
            <Image src="/img/logo.png" alt="8th Ledger" fill className="object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
            <p className="text-xs text-white/30">Zero-knowledge by design</p>
          </div>
        </div>

        <div className="space-y-8 text-sm text-white/50 leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Fingerprint className="h-4 w-4 text-cyan-400" />
              1. No Personal Data Collection (Tier 1)
            </h2>
            <p>
              8th Ledger does not collect names, addresses, government IDs, or biometric data for Visitor tier sovereigns. 
              Your identity is a cryptographic LED (Ledger Identity Number) generated locally in your browser. 
              For Sovereign+ tiers, KYC data is collected solely for compliance and withdrawal verification, 
              encrypted at rest, and never shared with third parties.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Eye className="h-4 w-4 text-emerald-400" />
              2. On-Chain Transparency
            </h2>
            <p>
              All pool commitments, consensus results, PIR allocations, and LED transactions are recorded on 
              the public audit ledger. This is by design — the protocol is publicly auditable. However, wallet 
              addresses and LED IDs are pseudonymous. There is no mapping between a LED and a real-world identity 
              unless you voluntarily disclose it or complete SIV (Sovereign Identity Verification).
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-400" />
              3. Encryption
            </h2>
            <p>
              All communications between your client and protocol nodes are encrypted via TLS 1.3. Session cookies 
              are signed and HttpOnly. TOTP secrets for 2FA are hashed with PBKDF2. We do not store plaintext passwords, 
              recovery codes, or private keys. Your wallet balance and transaction history are only visible to your 
              authenticated session.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Radio className="h-4 w-4 text-violet-400" />
              4. No Third-Party Tracking
            </h2>
            <p>
              8th Ledger does not use Google Analytics, Facebook pixels, or ad trackers. We do not sell, rent, or share 
              any data with third parties. The only external services used are payment processors for fiat deposits, 
              which operate under their own privacy frameworks and receive only the minimum data required for transaction 
              completion.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">5. Data Retention</h2>
            <p>
              Audit logs and blockchain records are retained indefinitely — this is the nature of immutable ledgers. 
              Session data, IP logs, and server access logs are rotated every 30 days. If you request account deletion, 
              your LED is deactivated but historical transaction records remain on the public chain.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">6. Your Rights</h2>
            <p>
              As a sovereign, you have the right to: (a) export your transaction history, (b) revoke your session 
              tokens, (c) generate new recovery codes, (d) request deactivation of your LED, and (e) audit any 
              pool or treasury transaction through the public ledger interface.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">7. KYC Data Protection</h2>
            <p>
              For Sovereign+ tiers, government ID images, selfies, and address proofs are stored encrypted with 
              AES-256. Access is restricted to the Primary Admin and compliance officers. Biometric templates are 
              hashed — raw images are deleted after verification. All KYC overrides are logged in the security audit trail.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 text-center">
          <p className="text-xs text-white/20">
            Privacy is not a feature. It is the foundation.
          </p>
        </div>
      </div>
    </div>
  );
}