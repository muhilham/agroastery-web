# Changelog

## [0.10.1](https://github.com/muhilham/agroastery-web/compare/v0.10.0...v0.10.1) (2026-07-23)


### Bug Fixes

* **konsultasi:** clean copy with coma ([f912db5](https://github.com/muhilham/agroastery-web/commit/f912db516d497eb389bfe95aef4f1dfda356c8ab))

## [0.10.0](https://github.com/muhilham/agroastery-web/compare/v0.9.0...v0.10.0) (2026-07-23)


### Features

* consultation booking feature ([#44](https://github.com/muhilham/agroastery-web/issues/44)) ([f9f9024](https://github.com/muhilham/agroastery-web/commit/f9f902461fe2735efd9e0a5bfb89f3ab6cb11237))


### Bug Fixes

* **consultations:** align booking page colors with site design system ([5b76e9d](https://github.com/muhilham/agroastery-web/commit/5b76e9d143a4ca6fe95e5b6847e5028a32a8b42e))
* **konsultasi:** clean up booking flow layout spacing ([#46](https://github.com/muhilham/agroastery-web/issues/46)) ([2b40d45](https://github.com/muhilham/agroastery-web/commit/2b40d453bdf580b1ee6643a95384d459022d25fe))
* **plan:** tz-independent date handling, pivot sig note, rls comment, task ordering ([2dc92cc](https://github.com/muhilham/agroastery-web/commit/2dc92cc9a111b9b6fbe2e049e819ad9ecc69fbb8))


### Documentation

* **plan:** consultation booking implementation plan ([38fe219](https://github.com/muhilham/agroastery-web/commit/38fe219aaa0005ed1a52b12de577319ce1f21a0f))
* **spec:** consultation booking feature design ([20f99e3](https://github.com/muhilham/agroastery-web/commit/20f99e344097a09686044e377a1dae8dffacd6a3))

## [0.9.0](https://github.com/muhilham/agroastery-web/compare/v0.8.0...v0.9.0) (2026-07-22)


### Features

* **home:** update hero copy to social proof buyers ([d17657d](https://github.com/muhilham/agroastery-web/commit/d17657d59e534bcb2da5bbd2eac82fd0d7e26cae))
* **home:** update hero copy to social proof, point plan doc to self-pickup checkout ([e7348fc](https://github.com/muhilham/agroastery-web/commit/e7348fcc7ee4ba310660665a0fb3aab035585887))

## [0.8.0](https://github.com/muhilham/agroastery-web/compare/v0.7.0...v0.8.0) (2026-07-20)


### Features

* **checkout:** accept pickup orders in checkout API request schema ([e1bdaaf](https://github.com/muhilham/agroastery-web/commit/e1bdaaff828d39897f6d641989f3c451044eeb56))
* **checkout:** add fulfillmentMethod to client form schema ([98f146b](https://github.com/muhilham/agroastery-web/commit/98f146b920e4e25ffbb868fb95cbfae951a866d5))
* **checkout:** add self-pickup toggle to checkout page ([591e8dc](https://github.com/muhilham/agroastery-web/commit/591e8dc9435a4306b1b77ff3b8148f51311940d1))
* **checkout:** extract shipping-cost guard into testable function ([9dd3518](https://github.com/muhilham/agroastery-web/commit/9dd35186bd534a69ce28607e23feef62f6a6c169))
* **checkout:** pickup-aware copy on success page ([bf353fc](https://github.com/muhilham/agroastery-web/commit/bf353fc9145cd3981ca423e1dff3a54ab5a0a84d))
* **email:** show pickup-specific copy in order confirmation ([abff126](https://github.com/muhilham/agroastery-web/commit/abff126cc9b2406e2fe27592d1558e87068e3df0))
* **orders:** show pickup location on order detail page ([14382d3](https://github.com/muhilham/agroastery-web/commit/14382d3dc56e0c6cfa7dccf17dd8bc02d6423516))
* **telegram:** show 'Ambil Sendiri' instead of courier name for pickup orders ([7787814](https://github.com/muhilham/agroastery-web/commit/77878143a3b098e5784f3ae3bd18a790e9f78116))
* **track:** show pickup location instead of courier tracking ([cd54ae2](https://github.com/muhilham/agroastery-web/commit/cd54ae2650d9ddfe0805953aa135b3cb155d6ef9))


### Documentation

* **env:** document self-pickup env vars ([0625ec0](https://github.com/muhilham/agroastery-web/commit/0625ec03652fd3bc09b980031a04e1037940d7ea))
* **plan:** add self-pickup checkout implementation plan ([423f23b](https://github.com/muhilham/agroastery-web/commit/423f23ba7880a9c54c0efa9ec905c03e851b6e50))
* **plan:** fix Task 3 test import crash + task-number typos ([b06843f](https://github.com/muhilham/agroastery-web/commit/b06843fd9605319320935db97823ccc2c8afbb06))
* **spec:** add self-pickup checkout design ([79c7189](https://github.com/muhilham/agroastery-web/commit/79c7189ff918bfc3a9f7c4a7e20411a5b0c3e3e9))
* **spec:** add touch-points section after code review ([26770fa](https://github.com/muhilham/agroastery-web/commit/26770fa39ae7f94fe7c90004c3f257df16e73a6a))

## [0.7.0](https://github.com/muhilham/agroastery-web/compare/v0.6.0...v0.7.0) (2026-07-16)


### Features

* **homepage:** add price comparison badge above Buy Now button ([97396c0](https://github.com/muhilham/agroastery-web/commit/97396c046948b8d3712bb570bf693f8ea4271b45))
* **product:** add OpenGraph metadata for link sharing ([011abc6](https://github.com/muhilham/agroastery-web/commit/011abc6bf54ed4d5fc15bfc419d901677948db1e))


### Bug Fixes

* **links:** update homepage coffee product links to correct paths ([296f9e3](https://github.com/muhilham/agroastery-web/commit/296f9e3f122ac7abcda394208ed8247e01e1bf7c))
* **product:** improve OG metadata quality ([44fea1f](https://github.com/muhilham/agroastery-web/commit/44fea1f65b5cff080f9a35c9ca9f329b7b493cce))
* **product:** spec compliance fixes for OG metadata ([72cface](https://github.com/muhilham/agroastery-web/commit/72cface6e9a3d21b905d848af52be1872e758351))

## [0.6.0](https://github.com/muhilham/agroastery-web/compare/v0.5.0...v0.6.0) (2026-05-25)


### Features

* **jubelio:** recover from duplicate SO race condition and send Telegram link ([a40b908](https://github.com/muhilham/agroastery-web/commit/a40b908419bff3cec5f41593bd2d6099346b057d))

## [0.5.0](https://github.com/muhilham/agroastery-web/compare/v0.4.6...v0.5.0) (2026-05-22)


### Features

* add download QR button to payment page ([9a938a0](https://github.com/muhilham/agroastery-web/commit/9a938a00353ea30b72b783948bce7ae65ecf3799))


### Bug Fixes

* hide download QR button when QR is loading ([4d61dbb](https://github.com/muhilham/agroastery-web/commit/4d61dbbad8ef7e0334020cc135b3de7b2917b34f))
* improve download QR button contrast on white card ([6193626](https://github.com/muhilham/agroastery-web/commit/6193626fe9ac07971bde55a04fed21990a18eba7))
* **product-detail:** prevent long &nbsp;-filled descriptions from pushing sidebar off-screen ([d31f8f9](https://github.com/muhilham/agroastery-web/commit/d31f8f9f5db87865a689f0011fa846bd3f3a41cd))


### Tests

* add tests for download QR button ([6b006c9](https://github.com/muhilham/agroastery-web/commit/6b006c9a30c9ea8a0992c74951fc2ff726cb14cc))


### Documentation

* plan download qris button ([bd25a1b](https://github.com/muhilham/agroastery-web/commit/bd25a1bb809bafb659190516bb2232a89ce0c5f1))

## [0.4.6](https://github.com/muhilham/agroastery-web/compare/v0.4.5...v0.4.6) (2026-05-21)


### Bug Fixes

* **build:** exclude scripts/ from TypeScript compilation ([6213566](https://github.com/muhilham/agroastery-web/commit/621356698e7c006171b0267c139ff0aa4c5ff2e2))

## [0.4.5](https://github.com/muhilham/agroastery-web/compare/v0.4.4...v0.4.5) (2026-05-21)


### Bug Fixes

* **jubelio:** auto-discover bundles via api.jubelio.com/item-bundles ([1a1e4eb](https://github.com/muhilham/agroastery-web/commit/1a1e4ebb0a5d73b6beaebb42542469791f251eb0))

## [0.4.4](https://github.com/muhilham/agroastery-web/compare/v0.4.3...v0.4.4) (2026-05-21)


### Bug Fixes

* **jubelio:** correct SKU lookup and contact_id for Jubelio sync ([e8b6e85](https://github.com/muhilham/agroastery-web/commit/e8b6e8508b4b345373941cf1d5f408f032dc1570))

## [0.4.3](https://github.com/muhilham/agroastery-web/compare/v0.4.2...v0.4.3) (2026-05-16)


### Bug Fixes

* **biteship-webhook:** move debug logs after all fallbacks + add tests ([9b22b5d](https://github.com/muhilham/agroastery-web/commit/9b22b5d1bdbc322604f335876478e0c84ae4bc66))

## [0.4.2](https://github.com/muhilham/agroastery-web/compare/v0.4.1...v0.4.2) (2026-05-16)


### Bug Fixes

* **biteship-webhook:** match orders by reference_id from Biteship API ([f1497bd](https://github.com/muhilham/agroastery-web/commit/f1497bd1764d218011787e3aa247aa9da0842f95))

## [0.4.1](https://github.com/muhilham/agroastery-web/compare/v0.4.0...v0.4.1) (2026-05-15)


### Bug Fixes

* **biteship-webhook:** add fallback lookups for old orders with order_number reference_id ([cac90a1](https://github.com/muhilham/agroastery-web/commit/cac90a18bda51a6d59be270ac17d3238f4014808))

## [0.4.0](https://github.com/muhilham/agroastery-web/compare/v0.3.4...v0.4.0) (2026-05-15)


### Features

* **checkout:** store sku on ecom_order_items for jubelio sync ([153f80c](https://github.com/muhilham/agroastery-web/commit/153f80cd9c1aba227e7622eacbdc5cbef7e4cea3))

## [0.3.4](https://github.com/muhilham/agroastery-web/compare/v0.3.3...v0.3.4) (2026-05-14)


### Bug Fixes

* **katalog:** strip HTML tags from product description in product grid ([4bc51ae](https://github.com/muhilham/agroastery-web/commit/4bc51ae1718e2bff07c88db63e221fd018e3f7c3))

## [0.3.3](https://github.com/muhilham/agroastery-web/compare/v0.3.2...v0.3.3) (2026-05-14)


### Bug Fixes

* **biteship-webhook:** re-enable courier_tracking_id updates ([ce65a58](https://github.com/muhilham/agroastery-web/commit/ce65a589603367b1fbb7e178af1f665634581c00))
* **biteship-webhook:** skip courier_tracking_id until column is added to production schema ([9244ad7](https://github.com/muhilham/agroastery-web/commit/9244ad77bfed1227356880af8f81b903baf819dc))

## [0.3.2](https://github.com/muhilham/agroastery-web/compare/v0.3.1...v0.3.2) (2026-05-11)


### Bug Fixes

* **biteship:** add tracking_number fallback for webhook resolution ([7dcea3c](https://github.com/muhilham/agroastery-web/commit/7dcea3cca3e5a79e595eb55b5ba344ee36961642))
* **biteship:** remove Content-Type from GET request and add reference_id fallback ([9598da8](https://github.com/muhilham/agroastery-web/commit/9598da8a881231d65c7e44b254afd4b461626130))

## [0.3.1](https://github.com/muhilham/agroastery-web/compare/v0.3.0...v0.3.1) (2026-05-10)


### Bug Fixes

* **types:** add missing ecom_order_biteship_history to supabase types and tighten null guard ([0050b91](https://github.com/muhilham/agroastery-web/commit/0050b9161f7f1d3293a8ed17d600a2ec6fbd1e2a))

## [0.3.0](https://github.com/muhilham/agroastery-web/compare/v0.2.3...v0.3.0) (2026-05-08)


### Features

* **biteship:** accept overrideReferenceId in createDraft ([c2aa40e](https://github.com/muhilham/agroastery-web/commit/c2aa40ec7abec5ef59ec9cf9a9c75f6c1142bcf6))
* **biteship:** add retryDraft with Telegram alerts ([2820459](https://github.com/muhilham/agroastery-web/commit/28204597caaaacfdbe0c13ed552773871c82f5a3))
* **webhook:** handle courier_not_found with retry + history fallback ([cd7faa1](https://github.com/muhilham/agroastery-web/commit/cd7faa1c9178e5a36bb3b4bc2dd91dd7700d1b84))


### Bug Fixes

* **biteship:** separate draft creation from status update in retryDraft ([246c7d6](https://github.com/muhilham/agroastery-web/commit/246c7d66a47873051893611356dd7d3e4b40e5d0))
* **biteship:** use referenceId consistently and verify POST payload in test ([cfd8ed9](https://github.com/muhilham/agroastery-web/commit/cfd8ed9a88e7de460fca5c0da2c5498fd942d265))
* **webhook:** add error checks and strengthen courier_not_found tests ([646884b](https://github.com/muhilham/agroastery-web/commit/646884b5fb5a934f086a6861d10e07f642fccab6))


### Documentation

* add Biteship courierNotFound auto-retry design spec ([c7ab655](https://github.com/muhilham/agroastery-web/commit/c7ab655951136f7c9e34da900a4e6140f89364de))
* add implementation plan for Biteship courierNotFound auto-retry ([2a8fd1f](https://github.com/muhilham/agroastery-web/commit/2a8fd1f11fc79d738669dfdf7802d6027a16afd6))
* fix plan v2 review issues ([8580770](https://github.com/muhilham/agroastery-web/commit/8580770304776d0f8fa3c0edf6c878eb48455d54))
* fix plan v4 review issues ([ee017b1](https://github.com/muhilham/agroastery-web/commit/ee017b177c5f781d6c6baea2f294ffec438054c1))
* fix plan v5 — idempotent recovery find filter ([1cbe02e](https://github.com/muhilham/agroastery-web/commit/1cbe02e4c99931db37c0ccc9cfbc155637096d44))
* fix spec issues from review ([86e8bcc](https://github.com/muhilham/agroastery-web/commit/86e8bcc8b8b07cdfac8791f05c10765fe566d490))
* fix v2 review issues ([0bb25a7](https://github.com/muhilham/agroastery-web/commit/0bb25a73daa833aa43b064d87e33237819711d5e))

## [0.2.3](https://github.com/muhilham/agroastery-web/compare/v0.2.2...v0.2.3) (2026-05-08)


### Documentation

* add order detail tracking link design spec ([487a3df](https://github.com/muhilham/agroastery-web/commit/487a3df23951df5cfd8234af3b345f817896dbc1))
* add order detail tracking link implementation plan ([0af06bb](https://github.com/muhilham/agroastery-web/commit/0af06bbde09a217e0c63a53d7e74a1eff32ae5d9))

## [0.2.2](https://github.com/muhilham/agroastery-web/compare/v0.2.1...v0.2.2) (2026-05-06)


### Bug Fixes

* **biteship:** allow empty body and no-secret for webhook registration probe ([68ed596](https://github.com/muhilham/agroastery-web/commit/68ed596c86fc1cd55dbdd46bc6c97411dc27db29))

## [0.2.1](https://github.com/muhilham/agroastery-web/compare/v0.2.0...v0.2.1) (2026-05-06)


### Bug Fixes

* **auth:** use NEXT_PUBLIC_APP_URL for callback redirects ([3fa4c5c](https://github.com/muhilham/agroastery-web/commit/3fa4c5c8846063170f1bdaf9fd17d7ceba602ba5))

## [0.2.0](https://github.com/muhilham/agroastery-web/compare/v0.1.0...v0.2.0) (2026-05-04)


### Features

* add edge on pages ([5fa7de7](https://github.com/muhilham/agroastery-web/commit/5fa7de77223630e2d77c43ae9617599f8d010d7a))
* add instant courier on mobile ([e3f1cd3](https://github.com/muhilham/agroastery-web/commit/e3f1cd3d9501593160aa3e23ea1d758c7f616610))
* add static data ([8e4ea4f](https://github.com/muhilham/agroastery-web/commit/8e4ea4f14c05e39d44d5bef7caccbaff9ffa3e17))
* add static data ([859980d](https://github.com/muhilham/agroastery-web/commit/859980da7c8ecae002666ba5c37a22e4ec1e4684))
* add static produc ([bc292bf](https://github.com/muhilham/agroastery-web/commit/bc292bf562f6fb9a7f7330510b22bb468ec48afc))
* **biteship:** use orderId UUID as reference_id across draft order and webhook ([#17](https://github.com/muhilham/agroastery-web/issues/17)) ([7573a17](https://github.com/muhilham/agroastery-web/commit/7573a172a72b64fef7b1eda013d8260cad28eea8))
* cloudflare compatibility ([c448df7](https://github.com/muhilham/agroastery-web/commit/c448df7ce752610508953af2172457ed415c73ea))
* create ui for product , detail & add some service ([bf152fe](https://github.com/muhilham/agroastery-web/commit/bf152fe2944586de8e5900809e7d7cecb3dc76a2))
* create ui for product , detail & add some service ([acbc761](https://github.com/muhilham/agroastery-web/commit/acbc761b720cf132356c9b545d73882dffecac7e))
* err prod shipping rates ([1170e2d](https://github.com/muhilham/agroastery-web/commit/1170e2dc663aca77755e39297b0739a66e28e9dc))
* err prod shipping rates ([eff05ea](https://github.com/muhilham/agroastery-web/commit/eff05ea47c0638f231ed219ec04699d3175f2a44))
* finish landing page ([f2b1793](https://github.com/muhilham/agroastery-web/commit/f2b1793c718c9d639791e5ba1733b779af3a5dcf))
* fix error build caused by vibin with windsurf ([d80143f](https://github.com/muhilham/agroastery-web/commit/d80143f3c32fc4776468e0a06f3a7610f35b3b20))
* get detail location from cdn ([0039cdb](https://github.com/muhilham/agroastery-web/commit/0039cdbd996c8ea2b4f17eb361b3713bf73a049a))
* get location from biteship ([b7139b2](https://github.com/muhilham/agroastery-web/commit/b7139b28004d32b98cae4edada2576faf062cf7d))
* get location from biteship fix build ([97bca57](https://github.com/muhilham/agroastery-web/commit/97bca57967681e7f72d63295614901fa419a91a7))
* i dont know the changes but somehow the error console is fix  vibe coding using gpt 5 model ([18a50dd](https://github.com/muhilham/agroastery-web/commit/18a50ddd4d0b9bd429aceb08d326a9aa95cc6bc4))
* implement location search by postal code on purchase dialog ([f7d2670](https://github.com/muhilham/agroastery-web/commit/f7d2670e1783c4db8e894bd3b1716205348659c2))
* init maps ([e82e5e3](https://github.com/muhilham/agroastery-web/commit/e82e5e317faa6f087ac0d83c4441f0971288e1a3))
* maps working with some errors ([35472ee](https://github.com/muhilham/agroastery-web/commit/35472ee1dfa300f360dd083a9cc8f030d2b8112e))
* mobile view shipping rates ([d27f712](https://github.com/muhilham/agroastery-web/commit/d27f71216b770322eb6c71fedb763dd4f661c4c8))
* mobile view shipping rates fix err build ([6647f69](https://github.com/muhilham/agroastery-web/commit/6647f69a7024b1e2fef742111eabf26f1dfd7fa7))
* product list json format ([922e968](https://github.com/muhilham/agroastery-web/commit/922e96857e141e64b2d78f1a1fe64cd3f2f03ee6))
* product list json format  fix err cf ([1fc43cd](https://github.com/muhilham/agroastery-web/commit/1fc43cd8b2d5b743d2c4c6ccc0a394187bf8f95a))
* product list json format from cdn ([14d438a](https://github.com/muhilham/agroastery-web/commit/14d438a55528117f168db646fafccadd79dd3d6f))
* refactor debounce ([f0b68fa](https://github.com/muhilham/agroastery-web/commit/f0b68fa248c1fdee2e30279612f747bfaa33e29c))
* refactor hooks ([cb7f68e](https://github.com/muhilham/agroastery-web/commit/cb7f68e6d0c6fcd7fb88c285d7ade55d35ded1bd))
* sent lat long to biteship ([d33c67e](https://github.com/muhilham/agroastery-web/commit/d33c67ec696ccd212b268eb3c1522ed6b3cace0e))
* set weight on shipping params ([830f62d](https://github.com/muhilham/agroastery-web/commit/830f62dc1b7583a59c2e0fcc308467243dd52812))
* shipping feature ([ef72a4b](https://github.com/muhilham/agroastery-web/commit/ef72a4b87b53aa75fe9926c6fc916e2905d724ab))
* shipping feature ([8c3b4f8](https://github.com/muhilham/agroastery-web/commit/8c3b4f85cb6e5764d5bb7fe73dafb217ecbb3341))
* styling for couriers option ([2733171](https://github.com/muhilham/agroastery-web/commit/27331716fc8662cd1df46ad3ea6a85cebf5405cd))
* styling for couriers option fix ([d971740](https://github.com/muhilham/agroastery-web/commit/d971740ef740cc6b39f239aa284e4a8868fd03ad))
* update data product and project structure file ([a5f623d](https://github.com/muhilham/agroastery-web/commit/a5f623d8ed6c08174bfde6fa7fa10dd65164a2e7))


### Bug Fixes

* add edge runtime for api postal-code ([ff783c3](https://github.com/muhilham/agroastery-web/commit/ff783c35851df81662b3f77ff17a7f33a8f6305d))
* **api:** add error handling and BITESHIP_API_KEY validation to shipping rates ([451db11](https://github.com/muhilham/agroastery-web/commit/451db1172cb369e6c132b72760d722dbc168bafb))
* change runtime to edge on /api/og ([8eaa1b3](https://github.com/muhilham/agroastery-web/commit/8eaa1b39478da3537dfabad9e43a1827623edbd1))
* coffe image full screen on mobile , fix navbar menu behavior ([7a19a36](https://github.com/muhilham/agroastery-web/commit/7a19a368d1d2d4aaafaa06ccf1335112330cf873))
* coffe list and navigation bar ([6aaea08](https://github.com/muhilham/agroastery-web/commit/6aaea08eda92a93e3e73d5e00753e83ed13cc8b5))
* content top placement ([f55a7bf](https://github.com/muhilham/agroastery-web/commit/f55a7bf7645fe1c450db9b8b03cc74e14f6a1bb5))
* err log cloudflare build ([d3521ad](https://github.com/muhilham/agroastery-web/commit/d3521add0bdd60606e31d6f51bd702d365e91140))
* error pnpm run build ([c4c0e04](https://github.com/muhilham/agroastery-web/commit/c4c0e044009074b852c83064fbbc49b18c45dd77))
* improve design ([6973d24](https://github.com/muhilham/agroastery-web/commit/6973d242da4fe13da98401a7caf4a88080fb8da4))
* integrate with static data ([a147f99](https://github.com/muhilham/agroastery-web/commit/a147f9951d4bb6168a8fb6266e31106a945e071c))
* link on product list ([a26e75e](https://github.com/muhilham/agroastery-web/commit/a26e75efc3ef9bc03efc18b5e5695471dac706ec))
* mouse click selected address ([#9](https://github.com/muhilham/agroastery-web/issues/9)) ([afe89da](https://github.com/muhilham/agroastery-web/commit/afe89da30a7b680e28b21a20a4c0f4acf77ed3d5))
* og social media ([c28bc3d](https://github.com/muhilham/agroastery-web/commit/c28bc3d6f92af8180e4b061ec5533a3dfd8f0ab3))
* purchase bottomsheets & navigation ([e64789a](https://github.com/muhilham/agroastery-web/commit/e64789a37d814025c25b44fb57d7a126e78dfbe1))
* take out export ([49fbfca](https://github.com/muhilham/agroastery-web/commit/49fbfca11e3b8a19a66db212db8f29fb47dadc6e))
* **telegram:** escape markdown characters and add fallback to plain text ([451db11](https://github.com/muhilham/agroastery-web/commit/451db1172cb369e6c132b72760d722dbc168bafb))
* type on pages ([5469b44](https://github.com/muhilham/agroastery-web/commit/5469b447db24fdb49dffd38debebf5a350678b08))
* unresponsive layouy ([65a108c](https://github.com/muhilham/agroastery-web/commit/65a108c705198506e600d38caf3d547fc13a5aa5))


### Tests

* **biteship:** add assertion for delivery_type field ([451db11](https://github.com/muhilham/agroastery-web/commit/451db1172cb369e6c132b72760d722dbc168bafb))


### Documentation

* add Biteship reference_id UUID alignment design spec ([0a7d2f9](https://github.com/muhilham/agroastery-web/commit/0a7d2f9be206813bb6ee5f50152b54f36495bb7f))
* add Biteship reference_id UUID alignment implementation plan ([820cb6f](https://github.com/muhilham/agroastery-web/commit/820cb6f94096d6e2947e2137c17fd1942660d8da))
* add semver release strategy design spec ([b049e81](https://github.com/muhilham/agroastery-web/commit/b049e817a7fb37a4f6c773af0539ccd7fa27eb5c))
* add semver release strategy implementation plan ([eaa8d77](https://github.com/muhilham/agroastery-web/commit/eaa8d775772c55c12e3901e661b3297398acbb13))
* fix pnpm package manager in release strategy spec ([2fddff8](https://github.com/muhilham/agroastery-web/commit/2fddff859e4d70b6f934301314efb5e0bb3456d2))

## Changelog
