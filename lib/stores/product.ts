
import { SAMPLE_PRODUCT_DETAIL } from '@/constant/sample-product';
import { TProduct } from '@/types/product';
import { atom } from 'nanostores';

export const $productDetailStore = atom<TProduct>(SAMPLE_PRODUCT_DETAIL)
