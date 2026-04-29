// app/(root)/account/addresses/[id]/edit/page.tsx
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAddressById } from "@/lib/supabase/queries/addresses";
import EditAddressForm from "./EditAddressForm";

export default async function EditAddressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/account/addresses/${id}/edit`);
  }

  const address = await getAddressById(supabase, id, user.id);
  if (!address) {
    notFound();
  }

  return <EditAddressForm address={address} />;
}
