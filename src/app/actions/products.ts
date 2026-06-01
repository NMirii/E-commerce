"use server";

import { getSession, hasRole } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/service";
import { z } from "zod";
import { updateTag } from "next/cache";
import { zodFirstMessage } from "@/lib/zod-errors";

const productSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(2, "Başlıq çox qısadır"),
  description: z.string().optional(),
  price: z.coerce.number().positive("Qiymət 0-dan böyük olmalıdır"),
  inventory_count: z.coerce.number().int().nonnegative("Stok mənfi ola bilməz"),
  category: z.string().min(1, "Kateqoriya mütləqdir"),
  image_url: z.string().optional(),
});

export type ProductActionState = { success?: boolean; error?: string } | undefined;

export async function saveProductAction(prevState: ProductActionState, formData: FormData): Promise<ProductActionState> {
  try {
    const session = await getSession();
    if (!session) return { error: "İcazəsiz giriş" };
    if (!hasRole(session, ["admin", "manager"])) {
      return { error: "Bu əməliyyat üçün icazəniz yoxdur" };
    }

    const supabase = createServiceClient();

    const rawData = {
      id: (formData.get("id") as string) || undefined,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      price: formData.get("price") as string,
      inventory_count: formData.get("inventory_count") as string,
      category: formData.get("category") as string,
      image_url: (formData.get("image_url") as string) || undefined,
    };

    const validated = productSchema.parse(rawData);

    if (validated.id) {
      // Update
      const { error } = await supabase
        .from("products")
        .update({
          title: validated.title,
          description: validated.description,
          price: validated.price,
          inventory_count: validated.inventory_count,
          category: validated.category,
          image_url: validated.image_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", validated.id);

      if (error) throw error;

      // Audit Log
      await supabase.from("audit_logs").insert({
        user_id: session.userId,
        action_type: "PRODUCT_MUTATION",
        details: { product_id: validated.id, action: "update", changes: validated },
      });
    } else {
      // Insert
      const { data: newProd, error } = await supabase
        .from("products")
        .insert({
          title: validated.title,
          description: validated.description,
          price: validated.price,
          inventory_count: validated.inventory_count,
          category: validated.category,
          image_url: validated.image_url,
        })
        .select()
        .single();

      if (error) throw error;

      // Audit Log
      await supabase.from("audit_logs").insert({
        user_id: session.userId,
        action_type: "PRODUCT_MUTATION",
        details: { product_id: newProd.id, action: "create", data: validated },
      });
    }

    // Next.js 16 read-your-writes cache invalidation
    try {
      updateTag("products-catalog");
    } catch {
      // cache tag optional in some runtimes
    }

    return { success: true };
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return { error: zodFirstMessage(err) };
    }
    return {
      error: err instanceof Error ? err.message : "Xəta baş verdi",
    };
  }
}
