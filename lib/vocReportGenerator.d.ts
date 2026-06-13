import type { VocQuestion, VocQuantData } from "./vocTypes";

export function generateVOCReport(
  orderData:           Record<string, unknown>,
  aiDraft:             Record<string, string>,
  analystNote:         string,
  analystPerspectives: Record<string, string>,
  questionMap:         VocQuestion[],
  quantData?:          VocQuantData,
): Promise<Buffer>;
