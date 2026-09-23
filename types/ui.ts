export interface I_ContentInterface {
    title: string;
    subtitle: string;
    image: string;
    href?: string;
    price?: number;
    roastLevel?: 'Light' | 'Medium' | 'Medium-Dark' | 'Dark';
}

export interface I_TestimonialInterface {
    name: string;
    message: string;
    product: string;
    /** Where the review came from, e.g. 'Tokopedia'. Rendered as small attribution. */
    source?: string;
}

export interface I_MenuListInterface {
    name: string;
    link: string;
}

export interface I_FooterInterface {
    href: string;
    label: string;
}
