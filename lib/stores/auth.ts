import { atom } from "nanostores";
import type { User } from "@supabase/supabase-js";

export const $user = atom<User | null>(null);
export const $authLoading = atom<boolean>(true);
