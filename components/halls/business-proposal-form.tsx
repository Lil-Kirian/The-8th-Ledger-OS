"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BusinessProposalForm({
  hallId,
  enabledFeatures,
}: {
  hallId: string;
  enabledFeatures: { inventory: boolean; forge: boolean; ihcp: boolean };
}) {
  return (
    <Card className="border-slate-800 bg-slate-900/50">
      <CardHeader>
        <CardTitle className="text-white">Business Proposal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-400">
        <p>
          Proposal creation for hall `{hallId.slice(-6)}` is ready to connect to
          the governance service.
        </p>
        <p>
          Enabled: inventory {enabledFeatures.inventory ? "yes" : "no"}, forge{" "}
          {enabledFeatures.forge ? "yes" : "no"}, IHCP{" "}
          {enabledFeatures.ihcp ? "yes" : "no"}.
        </p>
      </CardContent>
    </Card>
  );
}
