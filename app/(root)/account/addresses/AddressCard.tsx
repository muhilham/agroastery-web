"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Address } from "@/lib/supabase/queries/addresses";
import { MapPin, Pencil, Trash2, Star } from "lucide-react";

interface AddressCardProps {
  address: Address;
}

export default function AddressCard({ address }: AddressCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingDefault, setIsSettingDefault] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Hapus alamat ini?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/account/addresses/${address.id}`, {
        method: "DELETE",
      });
      if (res.ok) router.refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetDefault = async () => {
    setIsSettingDefault(true);
    try {
      const res = await fetch(`/api/account/addresses/${address.id}/default`, {
        method: "PATCH",
      });
      if (res.ok) router.refresh();
    } finally {
      setIsSettingDefault(false);
    }
  };

  return (
    <div className="rounded-xl border border-primary/30 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-primary">
              {address.label ?? "Alamat"}
            </span>
            {address.is_default && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                Default
              </span>
            )}
          </div>
          <p className="text-sm text-white/80 mt-1">
            {address.recipient_name} · {address.phone}
          </p>
          <p className="text-sm text-white/60 mt-0.5">{address.address_line}</p>
          {address.postal_code && (
            <p className="text-xs text-white/40 mt-0.5">
              Kode pos: {address.postal_code}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={`/account/addresses/${address.id}/edit`}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Pencil className="w-3 h-3" />
          Edit
        </Link>

        {!address.is_default && (
          <button
            onClick={handleSetDefault}
            disabled={isSettingDefault}
            className="inline-flex items-center gap-1 text-xs text-primary/70 hover:text-primary disabled:opacity-50"
          >
            <Star className="w-3 h-3" />
            Jadikan Default
          </button>
        )}

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="inline-flex items-center gap-1 text-xs text-destructive/70 hover:text-destructive ml-auto disabled:opacity-50"
        >
          <Trash2 className="w-3 h-3" />
          Hapus
        </button>
      </div>
    </div>
  );
}
