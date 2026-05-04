This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Tailwind style guide 
# CSS to Tailwind Utility Classes Conversion

## Base Styles
```css
* { margin: 0; padding: 0; box-sizing: border-box; }
```
Tailwind: `box-border m-0 p-0` 

```css
body { background-color: #1a1a1a; color: #f5ebc9; }
```
Tailwind: `bg-neutral-900 text-[#f5ebc9]`

## Typography Base

### Text Elements
```css
h1 { font-size: 48px; font-weight: 300; letter-spacing: 0.1em; line-height: 1.4; }
```
Tailwind: `text-5xl font-light tracking-wider leading-relaxed`

```css
h2 { font-size: 32px; font-weight: 200; letter-spacing: 0.05em; }
```
Tailwind: `text-3xl font-extralight tracking-wider`

```css
h3 { font-size: 18px; font-weight: 300; letter-spacing: 0.1em; }
```
Tailwind: `text-lg font-light tracking-wider`

```css
h4 { font-size: 18px; font-weight: 300; }
```
Tailwind: `text-lg font-light`

```css
h6 { color: #ccc4a9; }
```
Tailwind: `text-xs font-bold text-[#ccc4a9]`

```css
p { font-weight: 200; line-height: 1.6; color: #ccc4a9; }
```
Tailwind: `font-extralight leading-relaxed text-[#ccc4a9]`

```css
a { text-decoration: none; color: #f5ebc9; font-size: 14px; }
a:hover { color: #f5e4ac; }
```
Tailwind: `no-underline text-[#f5ebc9] text-sm hover:text-[#f5e4ac]`

## Layout Base

### Sections Wrapper
```css
.sections-wrapper { padding: 64px; display: flex; flex-direction: column; gap: 80px; }
```
Tailwind: `p-16 flex flex-col gap-20`

### Base Section
```css
.base-section { width: 100%; display: flex; flex-direction: column; gap: 32px; }
```
Tailwind: `w-full flex flex-col gap-8`

### Base Container
```css
.base-container { width: 100%; display: flex; gap: 24px; }
```
Tailwind: `w-full flex gap-6`

### Card
```css
.card { display: flex; flex-direction: column; width: 100%; gap: 64px; padding: 24px; border: 0.5px solid #f5ebc9; border-radius: 32px; }
```
Tailwind: `flex flex-col w-full gap-16 p-6 border border-[#f5ebc9] rounded-3xl`

### Text Container
```css
.text-container { display: flex; flex-direction: column; gap: 8px; }
```
Tailwind: `flex flex-col gap-2`

## Navigation
```css
nav { position: fixed; top: 0; left: 0; right: 0; display: flex; justify-content: space-between; align-items: center; height: 64px; padding: 0 64px; z-index: 100; background: transparent; transition: background-color 0.3s ease; }
```
Tailwind: `fixed top-0 left-0 right-0 flex justify-between items-center h-16 px-16 z-50 bg-transparent transition-colors duration-300`

### Hamburger Menu
```css
.hamburger { display: none; cursor: pointer; min-width: 44px; height: 44px; position: relative; border: none; background: none; margin-left: auto; }
```
Tailwind: `hidden md:flex min-w-[44px] h-11 relative cursor-pointer border-none bg-none ml-auto`

## Hero Section
```css
.hero-section { background-image: url(assets/images/hero-bg.jpg); background-size: cover; height: 100vh; padding: 64px; flex-direction: row; justify-content: flex-end; align-items: center; }
```
Tailwind: `bg-[url('assets/images/hero-bg.jpg')] bg-cover h-screen p-16 flex flex-row justify-end items-center`

### Hero Container
```css
.hero-container { width: 50%; max-width: 564px; display: flex; flex-direction: column; gap: 24px; }
```
Tailwind: `w-1/2 max-w-[564px] flex flex-col gap-6`

### CTA Button
```css
.cta-button { display: flex; align-items: center; justify-content: center; width: 144px; height: 40px; padding: 0 16px; border: 0.5px solid #f5ebc9; border-radius: 32px; font-size: 14px; letter-spacing: 0.05em; transition: all 0.75s ease; }
```
Tailwind: `flex items-center justify-center w-36 h-10 px-4 border border-[#f5ebc9] rounded-full text-sm tracking-wider transition-all duration-700`

## Values Section
```css
.values-svg { width: 160px; height: 160px; align-self: flex-end; }
```
Tailwind: `w-40 h-40 self-end`

```css
.values-description { font-weight: 200; font-size: 20px; opacity: 1; color: #f5ebc9; }
```
Tailwind: `font-extralight text-xl opacity-100 text-[#f5ebc9]`

## Featured Section
```css
.featured-container { flex-wrap: wrap; }
.featured-container .card { width: calc(50% - 12px); }
```
Tailwind: `flex flex-wrap gap-6`
For cards: `w-[calc(50%-12px)]`

## Footer
```css
.footer-section { padding: 64px; background-color: #171717; flex-direction: row; }
```
Tailwind: `p-16 bg-neutral-900 flex flex-row`

## Responsive Design

### Tablet (min-width: 810px and max-width: 1023px)
Add `md:` prefix to these classes:
```css
.hero-container { width: 80%; }
h1 { font-size: 40px; }
```
Tailwind: `md:w-4/5 md:text-4xl`

### Mobile (max-width: 809px)
Add `sm:` prefix to these classes:
```css
h1 { font-size: 24px; font-weight: 400; }
.hero-container { width: 100%; max-width: none; }
```
Tailwind: `sm:text-2xl sm:font-normal sm:w-full sm:max-w-none`

### Mobile Navigation
```css
.nav-links-container.active { display: flex; gap: 0px; padding-bottom: 24px; }
```
Tailwind: `sm:flex sm:gap-0 sm:pb-6`

### Mobile Sections
```css
.values-container, .featured-container, .opinion-container { overflow-x: scroll; padding: 0 24px; }
```
Tailwind: `sm:overflow-x-scroll sm:px-6`

### Mobile Cards
```css
.card { min-width: 280px; }
```
Tailwind: `sm:min-w-[280px]`

### Mobile Footer
```css
.footer-section { padding: 32px 24px; flex-direction: column; gap: 40px; }
```
Tailwind: `sm:p-8 sm:flex-col sm:gap-10`

