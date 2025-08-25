"use client";
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
import { Button } from "@/components/ui/button";
import Navigation from "@/components/ui/navigation";
import { Fragment } from "react";
import Image from "next/image";
import { Minus, Plus } from "lucide-react";
const formSchema = z.object({
  username: z.string().min(2).max(50),
});

const Page = () => {
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
    <Fragment>
      <Navigation />
      <main className="bg-background pt-20 tablet:px-10 desktop:px-20 px-4 min-h-screen">
        <div className="flex w-full justify-between items-end mb-4">
          <div className="inline-flex gap-3 items-end">
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
          <div className="inline-flex items-center gap-4">
            <button className="rounded-full p-1 flex flex-col items-center border border-primary w-8 h-8 text-secondary font-extrabold">
              <Minus />
            </button>
            <div className="font-semibold text-secondary text-base">100</div>
            <button className="rounded-full p-1 flex flex-col items-center border border-primary w-8 h-8 text-secondary font-extrabold">
              <Plus />
            </button>
          </div>
        </div>
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
      </main>
    </Fragment>
  );
};

export default Page;
