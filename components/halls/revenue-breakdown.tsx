"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RevenueBreakdown({ hallId }: { hallId: string }) {
  return (
    <Card className="border-slate-800 bg-slate-900/50">
      <CardHeader>
        <CardTitle className="text-white">Revenue Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-400">
        Revenue analytics for hall `{hallId.slice(-6)}` should be sourced from
        revenue logs and dividend distributions.
      </CardContent>
    </Card>
  );
}
