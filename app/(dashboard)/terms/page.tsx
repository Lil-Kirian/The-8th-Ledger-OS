import Link from "next/link";
import Image from "next/image";
import { Shield, ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
            <h1 className="text-2xl font-bold text-white">Terms of Service</h1>
            <p className="text-xs text-white/30">Last updated: June 2026</p>
          </div>
        </div>

        <div className="space-y-8 text-sm text-white/50 leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4 text-cyan-400" />
              1. Sovereign Agreement
            </h2>
            <p>
              By accessing the 8th Ledger Protocol, you acknowledge that you are entering a sovereign economic system 
              governed by algorithmic consensus, not traditional financial institutions. You agree that all commitments, 
              returns, and asset distributions are executed by protocol logic and cannot be reversed by any central authority.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">2. Commitment & Risk</h2>
            <p>
              All capital committed to pools is subject to the PIR (Protocol Infrastructure Reserve) model and Quantum Merit Consensus. 
              There is no guarantee of winning any asset. Non-winners receive LED returns as defined by protocol parameters. 
              You acknowledge that commitment amounts may be partially locked during the filling and consensus phases.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">3. Prohibited Jurisdictions</h2>
            <p>
              8th Ledger is a global access protocol. However, sovereigns in jurisdictions where participation in 
              community-funded asset pools is explicitly prohibited by local law are required to self-exclude. 
              The protocol does not geoblock, but compliance is the responsibility of the individual sovereign identity.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">4. PAC Contracts</h2>
            <p>
              All commitments mint a Perpetual Asset Contract (PAC) as proof of participation. These contracts are 
              non-transferable cryptographic records tied to your LED identity. They represent ownership percentages 
              in hall assets and may be sold on the 8th Ledger Exchange under the dynamic valuation floor.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">5. Dispute Resolution</h2>
            <p>
              Disputes are handled through the Protocol Arbitration Layer. The Primary Admin and elected arbiters review 
              evidence on-chain. All decisions are final and recorded permanently in the public audit ledger.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">6. Amendments</h2>
            <p>
              The protocol terms may be updated via community governance. Major changes require a supermajority of 
              Whale tier sovereigns. All versions are timestamped and archived in the immutable audit trail.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">7. Hall Closure Protocol</h2>
            <p>
              If an asset becomes unprofitable for 3 consecutive months (AHGI Critical 0-19), the 8th Ledger may execute 
              the Closure Protocol. This includes liquidation, payout distribution, and hall dissolution. All owners 
              receive their proportional share of net proceeds after PIR debt, taxes, worker severance, and the 8th Ledger 
              liquidation fee (2.5%) are settled.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">8. Dormancy & Reclamation</h2>
            <p>
              Accounts inactive for 12 months receive warnings. At 24 months, PACs transfer to the Dormancy Vault. 
              At 36 months, PACs may be auctioned at 120% of dynamic valuation. The original owner receives 80% of 
              proceeds if they return; 20% goes to the 8th Ledger as dormancy fee.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 text-center">
          <p className="text-xs text-white/20">
            Questions? Contact the protocol through your sovereign dashboard or review the public audit ledger.
          </p>
        </div>
      </div>
    </div>
  );
}