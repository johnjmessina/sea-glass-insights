export function generateAISKReport(
  orderData:   Record<string, unknown>,
  aiDraft:     Record<string, string>,
  analystNote: string,
): Promise<Buffer>;
