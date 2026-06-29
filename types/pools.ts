export interface PoolExternalLink {
  label: string;
  url: string;
}

export interface PoolLocationOption {
  label?: string;
  name?: string;
  address?: string;
  country?: string;
  city?: string;
  selected?: boolean;
}

export interface PoolUserOwnership {
  ownershipPercent?: number;
  pacToken?: string | null;
  dynamicValue?: number;
}

export interface PoolDetail {
  id?: string;
  poolId?: string;
  name: string;
  description?: string | null;
  country?: string | null;
  verticalId?: string | null;
  status?: string | null;
  hallClass?: string | null;
  closesAt?: string | Date | null;
  assetValue?: number | null;
  listedPrice?: number | null;
  minCommitment?: number | null;
  maxCommitment?: number | null;
  committed?: number | null;
  participants?: number | null;
  maxParticipants?: number | null;
  estimatedRevenue?: number | null;
  assetImages?: string[] | null;
  locationOptions?: PoolLocationOption[] | null;
  externalLinks?: PoolExternalLink[] | null;
  userOwnership?: PoolUserOwnership | null;
}
