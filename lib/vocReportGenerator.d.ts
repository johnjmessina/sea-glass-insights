export function generateVOCReport(
  orderData: Record<string, unknown>,
  aiDraft: Record<string, string>,
  analystNote: string,
  analystPerspectives: Record<string, string>,
  vocResponses: string,
): Promise<Buffer>;
