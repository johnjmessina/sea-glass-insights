export function generateDDRReport(
  orderData: Record<string, unknown>,
  aiDraft: Record<string, string>,
  analystNote: string,
  analystPerspectives: Record<string, string>
): Promise<Buffer>;
