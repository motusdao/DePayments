// Contract types
export interface Assignment {
  id: bigint;
  userWallet: string;
  psmWallet: string;
  userOffChainId: string;
  psmOffChainId: string;
  startTime: bigint;
  assignmentType: string;
  therapeuticFocus: string;
  isActive: boolean;
  sessionCount: bigint;
  totalPaid: bigint;
}

export interface Certificate {
  tokenId: bigint;
  psmWallet: string;
  psmOffChainId: string;
  certificationLevel: string;
  documentHash: string;
  documentUri: string;
  rating: bigint;
  issuedAt: bigint;
  validUntil: bigint;
  isActive: boolean;
}

export interface Evaluation {
  id: bigint;
  assignmentId: bigint;
  userWallet: string;
  psmWallet: string;
  userOffChainId: string;
  psmOffChainId: string;
  serviceRating: bigint;
  psmRating: bigint;
  feedback: string;
  wouldRecommend: boolean;
  createdAt: bigint;
}

export interface PSMRating {
  averageRating: bigint;
  totalRatings: bigint;
}

export interface CertificationRequest {
  requestId: string;
  psmWallet: string;
  psmOffChainId: string;
  certificationLevel: string;
  documentHash: string;
  documentUri: string;
  isPaid: boolean;
  feeAmount: bigint;
  timestamp: bigint;
}

// Transaction types
export interface CreateAssignmentParams {
  userWallet: string;
  psmWallet: string;
  userOffChainId: string;
  psmOffChainId: string;
  assignmentType: string;
  therapeuticFocus: string;
}

export interface RecordPaymentParams {
  assignmentId: bigint;
  platformFeePercent: bigint;
  paymentAmount: bigint;
}

export interface RequestCertificationParams {
  requestId: string;
  psmOffChainId: string;
  certificationLevel: string;
  documentHash: string;
  documentUri: string;
  feeAmount: bigint;
}

export interface SubmitEvaluationParams {
  assignmentId: bigint;
  psmWallet: string;
  userOffChainId: string;
  psmOffChainId: string;
  serviceRating: bigint;
  psmRating: bigint;
  feedback: string;
  wouldRecommend: boolean;
}

// Event types
export interface AssignmentCreatedEvent {
  assignmentId: bigint;
  userWallet: string;
  psmWallet: string;
}

export interface PaymentProcessedEvent {
  assignmentId: bigint;
  amount: bigint;
  platformFee: bigint;
}

// Contract interaction result types
export type ContractTransactionResult = {
  success: boolean;
  transactionHash?: string;
  error?: string;
  receipt?: any;
};

export type ContractReadResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
