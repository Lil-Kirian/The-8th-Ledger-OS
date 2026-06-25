// lib/ihcp.ts
// Internal Hall Contribution Pool — Phase 4
// 8th Ledger: Any hall can vote to enable IHCP (51%). Repaid from revenue before dividends with 5% priority return.

export type IhcpPurpose = "payroll" | "inventory" | "marketing" | "upgrade" | "emergency";

export interface IhcpContribution {
  id: string;
  hallId: string;
  ledgerId: string;
  amount: number;
  purpose: IhcpPurpose;
  repaidAmount: number;
  status: "active" | "repaid" | "defaulted" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

export const IHCP_PRIORITY_RETURN = 0.05; // 5% priority return on top of principal

/**
 * Total amount to repay (principal + 5% priority return)
 */
export function calculateIhcpTotalReturn(contribution: number): number {
  return Math.round(contribution * (1 + IHCP_PRIORITY_RETURN));
}

/**
 * Recommended IHCP target based on asset vertical.
 * Class I (passive): lower operational need
 * Class II (managed): medium operational need
 * Class III (active): high operational need
 */
export function getIhcpRecommendedTarget(assetTypeId: string): number {
  const vertical = assetTypeId.split("-")[0];
  const targets: Record<string, number> = {
    ledgerprop: 10000,
    ledgerauto: 15000,
    ledgerenergy: 12000,
    ledgeraccess: 10000,
    ledgerhealth: 18000,
    ledgeredu: 16000,
    ledgertravel: 15000,
    ledgerbiz: 25000,
    ledgeragri: 20000,
    ledgertech: 22000,
  };
  return targets[vertical] || 15000;
}

/**
 * Calculate monthly repayment schedule.
 * 10% of net revenue (after tithe) goes to IHCP until repaid.
 */
export function calculateIhcpRepayment(
  contributionAmount: number,
  monthlyRevenue: number,
  tithePercent: number = 20
): { monthlyRepayment: number; monthsToRepay: number; totalOwed: number } {
  const netRevenue = monthlyRevenue * (1 - tithePercent / 100);
  const totalOwed = calculateIhcpTotalReturn(contributionAmount);
  const monthlyRepayment = Math.round(netRevenue * 0.1); // 10% of net revenue
  const monthsToRepay = Math.ceil(totalOwed / Math.max(monthlyRepayment, 1));
  return { monthlyRepayment, monthsToRepay, totalOwed };
}

/**
 * Calculate dividend impact when IHCP is active.
 * Shows what the dividend would be with vs without IHCP deduction.
 */
export function calculateIhcpDividendImpact(
  contributionAmount: number,
  monthlyRevenue: number,
  ownershipPercent: number
): { 
  ihcpDeduction: number; 
  netDividend: number; 
  originalDividend: number;
} {
  const tithe = monthlyRevenue * 0.2;
  const netAfterTithe = monthlyRevenue - tithe;
  const ihcpDeduction = Math.round(netAfterTithe * 0.1); // 10% to IHCP
  const netAfterIhcp = netAfterTithe - ihcpDeduction;
  const originalDividend = Math.round(netAfterTithe * (ownershipPercent / 100));
  const netDividend = Math.round(netAfterIhcp * (ownershipPercent / 100));
  return { ihcpDeduction, netDividend, originalDividend };
}

export function getIhcpStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: "Active — Repaying",
    repaid: "Repaid — Complete",
    defaulted: "Defaulted — Hall Vote Required",
    cancelled: "Cancelled — Refunded",
  };
  return labels[status] || status;
}

export function getIhcpPurposeLabel(purpose: string): string {
  const labels: Record<string, string> = {
    payroll: "Worker Payroll",
    inventory: "Stock Purchase",
    marketing: "Marketing Campaign",
    upgrade: "Facility Upgrade",
    emergency: "Emergency Fund",
  };
  return labels[purpose] || purpose;
}

/**
 * Universal rule: Any hall can enable IHCP via 51% vote.
 */
export function canHallEnableIhcp(): boolean {
  return true;
}

export function getIhcpProposalTemplate(purpose: IhcpPurpose, amount: number): string {
  const templates: Record<IhcpPurpose, string> = {
    payroll: `Proposal to fund worker payroll via Internal Hall Contribution Pool. Amount: $${amount}. Repayment: 10% of net revenue until repaid with 5% priority return.`,
    inventory: `Proposal to fund inventory restocking via Internal Hall Contribution Pool. Amount: $${amount}. Repayment: 10% of net revenue until repaid with 5% priority return.`,
    marketing: `Proposal to fund marketing campaign via Internal Hall Contribution Pool. Amount: $${amount}. Repayment: 10% of net revenue until repaid with 5% priority return.`,
    upgrade: `Proposal to fund facility upgrade via Internal Hall Contribution Pool. Amount: $${amount}. Repayment: 10% of net revenue until repaid with 5% priority return.`,
    emergency: `Emergency proposal to fund critical asset protection via Internal Hall Contribution Pool. Amount: $${amount}. Repayment: 10% of net revenue until repaid with 5% priority return.`,
  };
  return templates[purpose];
}

export function getIhcpRepaymentPriority(): number {
  return 5; // 5%
}

export function getIhcpMaxDurationMonths(): number {
  return 24;
}

export function getIhcpMinContribution(): number {
  return 100;
}

export function getIhcpPurposes(): IhcpPurpose[] {
  return ["payroll", "inventory", "marketing", "upgrade", "emergency"];
}

/**
 * Check if a hall has outstanding IHCP debt that affects dividend distribution.
 */
export function hasActiveIhcpDebt(contributions: IhcpContribution[]): boolean {
  return contributions.some((c) => c.status === "active" && c.repaidAmount < calculateIhcpTotalReturn(c.amount));
}

/**
 * Total outstanding IHCP debt for a hall.
 */
export function calculateTotalIhcpDebt(contributions: IhcpContribution[]): number {
  return contributions
    .filter((c) => c.status === "active")
    .reduce((sum, c) => sum + (calculateIhcpTotalReturn(c.amount) - c.repaidAmount), 0);
}

/**
 * Format IHCP contribution for display.
 */
export function formatIhcpContribution(c: IhcpContribution): string {
  const total = calculateIhcpTotalReturn(c.amount);
  const remaining = total - c.repaidAmount;
  const percent = Math.round((c.repaidAmount / total) * 100);
  return `${getIhcpPurposeLabel(c.purpose)}: $${c.amount} → $${total} total (${percent}% repaid, $${remaining} remaining)`;
}