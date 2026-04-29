"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dynamic from "next/dynamic";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";

const MapPicker = dynamic(() => import("@/components/map/MapPicker"), {
  loading: () => (
    <div className="h-[240px] rounded-lg bg-gray-900 border border-white/10 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  ),
  ssr: false,
});

export const addressFormSchema = z.object({
  label: z.string().max(50).optional(),
  recipient_name: z.string().min(2, "Minimal 2 karakter").max(100),
  phone: z.string().min(6, "Nomor tidak valid").max(20),
  address_line: z.string().min(10, "Alamat terlalu singkat").max(300),
  postal_code: z
    .string()
    .length(5, "Kode pos harus 5 digit")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

export type AddressFormValues = z.infer<typeof addressFormSchema>;

interface AddressFormProps {
  onSubmit: (data: AddressFormValues) => void;
  defaultValues?: Partial<AddressFormValues>;
  isLoading?: boolean;
  submitLabel?: string;
}

export default function AddressForm({
  onSubmit,
  defaultValues,
  isLoading = false,
  submitLabel = "Simpan",
}: AddressFormProps) {
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      label: "",
      recipient_name: "",
      phone: "",
      address_line: "",
      postal_code: "",
      ...defaultValues,
    },
  });

  const lat = form.watch("lat");
  const lng = form.watch("lng");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Label Alamat</FormLabel>
              <FormControl>
                <Input placeholder="Rumah, Kantor, dll." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="recipient_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Nama Penerima <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="Nama lengkap penerima" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Nomor HP <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input type="tel" placeholder="08xxxxxxxxxx" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address_line"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Alamat <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Jalan, nomor rumah, RT/RW, kelurahan, kecamatan"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="postal_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kode Pos</FormLabel>
              <FormControl>
                <Input placeholder="12345" maxLength={5} inputMode="numeric" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <p className="text-sm font-medium">Lokasi Peta (opsional)</p>
          <MapPicker
            value={
              lat !== undefined && lng !== undefined
                ? { lat, lng }
                : undefined
            }
            onChange={({ lat, lng }) => {
              form.setValue("lat", lat, { shouldDirty: true });
              form.setValue("lng", lng, { shouldDirty: true });
            }}
            onAddressChange={(address) => {
              if (!form.getValues("address_line")) {
                form.setValue("address_line", address, { shouldValidate: true, shouldDirty: true });
              }
            }}
            height={240}
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading && <LoaderCircle className="animate-spin w-4 h-4 mr-2" />}
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}
