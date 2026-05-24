import type { Order, AIDraft } from "./supabase";

export function generateReport(
  orderData: Order,
  aiContent: AIDraft,
  analystNote: string
): Promise<Buffer>;
