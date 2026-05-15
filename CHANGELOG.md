# Changelog

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
