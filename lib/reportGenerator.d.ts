export declare function generateReport(
  orderData: Record<string, unknown>,
  aiContent: Record<string, unknown>,
  analystNote: string,
  executiveSummary?: string,
): Promise<Buffer>;
