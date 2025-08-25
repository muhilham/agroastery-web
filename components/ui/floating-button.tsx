"use client";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "./badge";
import { Button } from "./button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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

const formSchema = z.object({
  username: z.string().min(2).max(50),
});

const RecipantDetailForm = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  return (
    <Sheet>
      <SheetContent side="bottom" className="min-h-svh">
        <SheetHeader>
          <SheetTitle className="text-start">Detail penerima</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama lengkap</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama lengkap" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor Penerima</FormLabel>
                  <FormControl>
                    <Input placeholder="Nomor handphone" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Alamat lengkap.."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="bottom-0 absolute w-full inset-x-0 py-4 px-6 bg-[#141414]">
              <div className="inline-flex w-full justify-between items-center mb-3">
                <span className="text-sm text-[#CCC4A9] font-normal">
                  Subtotal
                </span>
                <span className="font-bold text-[#CCC4A9]">12.000.000</span>
              </div>
              <Button type="submit" className="h-12">
                Pesan Sekarang
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

const OrderDetail = () => {
  const createWhatsAppMessage = () => {
    const message = [
      "Halo Agroastery,",
      "",
      `Saya mau pesan BIJI KOPI STANDARD GAYO FULL ARABICA (100G) , Grind Level (Beans).`,
      "",
      "Alamat : Kosan mahasiswa bandung 42291 (081222790896) - Fiqry cherudin",
      "",
      "Terima kasih",
    ].join("\n");

    const whatsappUrl = new URL("https://api.whatsapp.com/send");
    whatsappUrl.searchParams.append("phone", "+628979092726");
    whatsappUrl.searchParams.append("text", message);

    window.open(whatsappUrl.toString());
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Beli Langsung</Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Varian produk</SheetTitle>
        </SheetHeader>
        <div className="inline-flex gap-3 my-3 items-end mb-4 ">
          <div className="bg-[#242424] p-2 rounded-xl">
            <Image
              src="/assets/coffe/blend-gayo.png"
              width={64}
              height={64}
              alt="produk"
            />
          </div>
          <div className="space-y-1">
            <div className="text-sm text-secondary">1kg, Beans</div>
            <div className="text-base font-extrabold text-primary">
              Rp120.000
            </div>
          </div>
        </div>
        <div className="text-base font-bold text-primary">Pilih ukuran :</div>
        <div className="inline-flex gap-2 items-center mt-2">
          <Badge variant="outline">100g</Badge>
          <Badge variant="outline">100g</Badge>
          <Badge variant="outline">100g</Badge>
        </div>
        <div className="text-base font-bold text-primary mt-4">
          Pilih grind level :
        </div>
        <div className="inline-flex gap-2 items-center mt-2 pb-24">
          <Badge variant="outline">Beans</Badge>
          <Badge variant="outline">Grind Fine</Badge>
          <Badge variant="outline">Grind Medium</Badge>
        </div>
        <div className="p-3 bg-[#141414] absolute bottom-0 w-full inset-x-0">
          <Button variant="outline" onClick={() => createWhatsAppMessage()}>
            Beli Langsung
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export const FloatingButton = () => {
  return (
    <div className="fixed bottom-0 w-full left-0 desktop:hidden bg-black inline-flex gap-5 z-40 px-6 items-center py-4">
      <div className="inline-flex items-center gap-2">
        <Button size="icon" className="w-14 h-10 px-4">
          <Image
            src="/assets/tokopedia.svg"
            width={24}
            height={24}
            alt="tokopedia"
          />
        </Button>
        <Button size="icon" className="w-14 h-10 px-4">
          <Image
            src="/assets/shoppe.svg"
            width={24}
            height={24}
            alt="tokopedia"
          />
        </Button>
      </div>
      <RecipantDetailForm />
      <OrderDetail />
    </div>
  );
};
