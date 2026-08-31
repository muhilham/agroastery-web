"use client";

import { Control } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoaderCircle, MapPin } from "lucide-react";
import { LocationDisplay } from "@/components/location-display";
import dynamic from "next/dynamic";
import type { TForm } from "@/app/(root)/checkout/checkoutSchemas";
import type { Address } from "@/lib/hooks/useAddresses";
import type { VerifiedLocation } from "@/lib/types/shipping";

const MapPicker = dynamic(() => import("@/components/map/MapPicker"), {
  loading: () => (
    <div className="h-[240px] rounded-lg bg-gray-900 border border-white/10 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  ),
  ssr: false,
});

interface CheckoutFormProps {
  formControl: Control<TForm>;
  isGuest: boolean;
  user: { id: string; email?: string | null } | null;
  isLoadingAddresses: boolean;
  addresses: Address[];
  selectedAddressId: string | "new" | null;
  onAddressSelect: (id: string) => void;
  showMap: boolean;
  onToggleMap: () => void;
  watchedLat: number | undefined;
  watchedLng: number | undefined;
  isLoadingShipping: boolean;
  fulfillmentMethod: "delivery" | "pickup" | undefined;
  onFulfillmentChange: (method: "delivery" | "pickup") => void;
  pickupAvailable: boolean;
  location: VerifiedLocation | null;
  shippingError: string | null;
  submitError: string | null;
  onMapChange: (lat: number, lng: number) => void;
}

export default function CheckoutForm({
  formControl,
  isGuest,
  user,
  isLoadingAddresses,
  addresses,
  selectedAddressId,
  onAddressSelect,
  showMap,
  onToggleMap,
  watchedLat,
  watchedLng,
  isLoadingShipping,
  fulfillmentMethod,
  onFulfillmentChange,
  pickupAvailable,
  location,
  shippingError,
  submitError,
  onMapChange,
}: CheckoutFormProps) {
  return (
    <div className="space-y-4">
      {pickupAvailable && (
        <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 space-y-3">
          <h2 className="text-primary font-semibold tracking-widest uppercase text-xs">
            Metode Pengambilan
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onFulfillmentChange("delivery")}
              className={`rounded-lg border p-3 text-sm font-medium transition-colors ${
                fulfillmentMethod === "delivery"
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-white/10 text-secondary"
              }`}
            >
              Kirim
            </button>
            <button
              type="button"
              onClick={() => onFulfillmentChange("pickup")}
              className={`rounded-lg border p-3 text-sm font-medium transition-colors ${
                fulfillmentMethod === "pickup"
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-white/10 text-secondary"
              }`}
            >
              Ambil Sendiri
            </button>
          </div>
          {fulfillmentMethod === "pickup" && (
            <div className="rounded-xl bg-[#242424] border border-white/10 px-4 py-3 space-y-1">
              <p className="text-[#CCC4A9] text-sm font-medium">
                {process.env.NEXT_PUBLIC_PICKUP_ADDRESS}
              </p>
              <p className="text-[#CCC4A9]/60 text-xs">
                {process.env.NEXT_PUBLIC_PICKUP_HOURS}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 1: Alamat Pengiriman */}
      {fulfillmentMethod === "delivery" && (
        <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
            <h2 className="text-primary font-semibold tracking-widest uppercase text-xs">Alamat Pengiriman</h2>
          </div>

          {/* Saved address selector — authenticated users with saved addresses */}
          {user && !isLoadingAddresses && addresses.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Pilih Alamat</label>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
                {addresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => onAddressSelect(addr.id)}
                    className={`flex-shrink-0 w-44 rounded-xl border-2 p-3 text-left transition-colors ${
                      selectedAddressId === addr.id
                        ? "border-primary bg-primary/10"
                        : "border-white/10 bg-[#242424] active:bg-[#2a2a2a]"
                    }`}
                  >
                    {(addr.label || addr.is_default) && (
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/70 mb-1 truncate">
                        {addr.label ?? ""}
                        {addr.is_default ? (addr.label ? " · Utama" : "Utama") : ""}
                      </p>
                    )}
                    <p className="text-xs font-medium text-[#CCC4A9] line-clamp-1">{addr.recipient_name}</p>
                    <p className="text-[11px] text-[#CCC4A9]/50 line-clamp-2 mt-0.5 leading-tight">{addr.address_line}</p>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => onAddressSelect("new")}
                  className={`flex-shrink-0 w-36 rounded-xl border-2 border-dashed p-3 flex flex-col items-center justify-center gap-1 transition-colors ${
                    selectedAddressId === "new"
                      ? "border-primary/50 bg-primary/5"
                      : "border-white/[0.15] bg-transparent active:bg-white/5"
                  }`}
                >
                  <span className="text-primary text-xl leading-none font-light">+</span>
                  <span className="text-xs text-[#CCC4A9]/50">Alamat baru</span>
                </button>
              </div>
            </div>
          )}

          {/* Loading addresses indicator */}
          {user && isLoadingAddresses && (
            <div className="flex items-center gap-2 text-sm text-[#CCC4A9]/60">
              <LoaderCircle className="animate-spin w-4 h-4" />
              <span>Memuat alamat tersimpan...</span>
            </div>
          )}

          {(selectedAddressId === "new" || (selectedAddressId === null && !user)) && (
            <>
              <FormField
                control={formControl}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alamat Lengkap</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Jl. Kemang Barat No. 7, RT.9/RW.1, Bangka, Mampang Prapatan"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={formControl}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kode Pos</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="12190"
                          maxLength={5}
                          inputMode="numeric"
                          {...field}
                        />
                        {isLoadingShipping && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <LoaderCircle className="animate-spin h-4 w-4 text-primary" />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  Pilih Lokasi (Opsional)
                </label>
                {showMap ? (
                  <MapPicker
                    value={{
                      lat: watchedLat || null,
                      lng: watchedLng || null,
                    }}
                    onChange={(coords) => {
                      onMapChange(coords.lat, coords.lng);
                    }}
                    height={240}
                    className="w-full"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={onToggleMap}
                    className="w-full h-[60px] rounded-xl border border-white/10 bg-[#1e1e1e] hover:bg-[#242424] active:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-2.5 group"
                  >
                    <MapPin className="w-4 h-4 text-primary/50 group-hover:text-primary/80 transition-colors" />
                    <span className="text-sm text-[#CCC4A9]/60 group-hover:text-[#CCC4A9]/80 transition-colors">
                      Pilih Lokasi di Peta
                    </span>
                    <span className="text-[10px] text-[#CCC4A9]/25">(Opsional)</span>
                  </button>
                )}
              </div>
            </>
          )}

          {/* Map display for saved addresses with lat/lng */}
          {selectedAddressId !== null && selectedAddressId !== "new" && (() => {
            const addr = addresses.find((a) => a.id === selectedAddressId);
            if (!addr) return null;
            const hasCoordinates = addr.latitude != null && addr.longitude != null;
            return (
              <div className="space-y-3">
                <div className="rounded-xl bg-[#242424] border border-white/10 px-4 py-3 space-y-1">
                  <p className="text-[#CCC4A9] text-sm font-medium">{addr.address_line}</p>
                  {addr.postal_code && (
                    <p className="text-[#CCC4A9]/60 text-xs">Kode Pos: {addr.postal_code}</p>
                  )}
                </div>
                {hasCoordinates && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Lokasi Pin</label>
                    <MapPicker
                      value={{
                        lat: addr.latitude,
                        lng: addr.longitude,
                      }}
                      onChange={() => {}}
                      height={180}
                      showSearch={false}
                      readOnly={true}
                      zoom={16}
                    />
                    <p className="text-xs text-[#CCC4A9]/40">
                      Lokasi telah ditentukan dari alamat tersimpan
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          <LocationDisplay
            location={location}
            isLoading={isLoadingShipping}
            error={shippingError}
          />
        </div>
      )}

      {/* Step 2: Data Penerima */}
      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
          <h2 className="text-primary font-semibold tracking-widest uppercase text-xs">Data Penerima</h2>
        </div>

        <FormField
          control={formControl}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Lengkap</FormLabel>
              <FormControl>
                <Input placeholder="Nama lengkap penerima" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={formControl}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nomor HP</FormLabel>
              <FormControl>
                <Input placeholder="08xxxxxxxxxx" inputMode="tel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isGuest && (
          <FormField
            control={formControl}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="budi@gmail.com" type="email" {...field} value={field.value ?? ""} />
                </FormControl>
                <p className="text-xs text-secondary mt-1">
                  We&apos;ll send your order confirmation here
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      <FormField
        control={formControl}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Catatan (Opsional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Catatan untuk pesanan..."
                className="resize-none"
                rows={2}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {submitError && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {submitError}
        </div>
      )}
    </div>
  );
}
