import type { TProduct, TProductBase } from "@/types/product";
import { CATEGORY_BY_ID } from "../category";
const BASE_URL_CDN = "https://ag-cdn.fiqry.dev/produk";

export const slugify = (slug: string) =>
  slug
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

const RAW_PRODUCTS: TProductBase[] = [
  {
    title: "Biji Kopi BALIPEACH roasted for filter by AGROASTER",
    description:
      "Introducing our Peach-Infused Coffee Beans —a truly unique single-origin experience. Grown in the volcanic soils of the Buleleng region, these coffee beans are meticulously infused with the natural essence of ripe peach, creating a coffee that’s both bold and delightfully aromatic. This is not a blend, but a single-origin coffee transformed through innovation. Perfect for enthusiasts looking to explore new dimensions of flavor, our peach-Infused Buleleng Coffee Beans offer a harmonious fusion of tradition and creativity. <br/><br/><strong>Location</strong><br/>Bulelng, Bali, Indonesia <br/><br/><strong>Process</strong><br/>Peach Infused Natural Anaerob <br/><br/><strong>Species</strong><br/>Arabica <br/><br/><strong>Varietal</strong><br/>Kopyol, Lini-s <br/><br/><strong>Altitude</strong><br/>1300 masl <br/><br/><strong>Nett Weight</strong><br/>150gr <br/><br/><strong>Flavor Notes Perception</strong><br/>Peach Jam - Grape - Red Cherry <br/><br/><strong>Roast Date</strong><br/>16 AUGUST 25",
    shortDescription:
      "Introducing our Peach-Infused Coffee Beans —a truly unique single-origin experience. Grown in the volcanic soils of the Buleleng region,",
    grindSize: ["Beans", "Grind Fine", "Grind Medium"],
    size: ["150g"],
    coffeType: ["Arabica"],
    category_ids: ["7"],
    priceBySize: { "150g": 119000 },
    price: 119000,
    images: [
      {
        image: `${BASE_URL_CDN}/kopi-bali-peach/1.png`,
      },
      {
        image: `${BASE_URL_CDN}/kopi-bali-peach/2.png`,
      },
      {
        image: `${BASE_URL_CDN}/kopi-bali-peach/3.png`,
      },
      {
        image: `${BASE_URL_CDN}/kopi-bali-peach/4.png`,
      },
      {
        image: `${BASE_URL_CDN}/kopi-bali-peach/5.png`,
      },
    ],
  },
  {
    title: "Blend Full Arabica Espresso | CHOCO BUNCH 1 KG | Freshroast",
    description:
      "<strong>Origin</strong> : Brazil - Bali <br/><br/> <strong>Process</strong> : Natural - Wash Anaerobic <br/><br/> <strong>Altitude</strong> : 1200 - 1380 masl <br/><br/> <strong>Varietal</strong> : mix varietas <br/><br/> <strong>Roast Degree (Profile)</strong> : Fullcityplus Roast/Very Early Second Crack/Dark Roast <br/><br/> <strong>Notes</strong> : Mid-High Body | Mid-High Sweetness | Low-Mid Acidity <br/><br/> <strong>Recommended for</strong> : Espresso based , americano, longblack, latte, cappucino <br/><br/> Biji kopi grade terbaik dengan profil sangrai yang di sesuaikan dengan kebutuhan harian kedai kopi. <br/><br/> <strong>Nett Weight</strong> : 1000gram <br/><br/> Berikut adalah jenis variasi gilingan/grindsize berdasarkan alat seduh yang dipakai : <br/><br/> <strong>GRIND FINE</strong> : Tubruk, Mokapot, Vietnam Drip <br/><br/> <strong>GRIND MEDIUM</strong> : Semua alat seduh menggunakan paper filter (V60, Kalita wave, Kono, Aeropress, Chemex, dll) <br/><br/> <strong>GRIND COARSE</strong> : French Press, Cold Drip, Cold Brew, Espresso teknik rebus ",
    shortDescription:
      "Rich Brazil–Bali Arabica with natural and wash anaerobic process, dark roasted for espresso-based drinks. Balanced body, sweetness, and acidity, ideal for daily café needs with multiple grind options.",
    grindSize: ["Beans", "Grind Fine", "Grind Medium", "Grind Coarse"],
    size: ["1000g"],
    coffeType: ["Arabica"],
    category_ids: ["2"],
    priceBySize: { "1000g": 246000 },
    price: 246000,
    images: [
      {
        image: `${BASE_URL_CDN}/arabica-espresso/1.png`,
      },
      {
        image: `${BASE_URL_CDN}/arabica-espresso/2.png`,
      },
      {
        image: `${BASE_URL_CDN}/arabica-espresso/3.png`,
      },
      {
        image: `${BASE_URL_CDN}/arabica-espresso/4.png`,
      },
      {
        image: `${BASE_URL_CDN}/arabica-espresso/5.png`,
      },
    ],
  },
  {
    title: "Biji Kopi KAMOJANG roasted for filter by AGROASTERY",
    description:
      "We discovered this Kamojang coffee from Wanoja during a cupping session offered by our vendor as part of their Padmana Series. Among all the lots, this one stood out with its clarity, sweetness, and vibrant character—making it an easy choice for our next release. <br/><br/> This coffee made its debut at the World Coffee Event Jakarta 2025, during our dedicated 2-hour session at our vendor's booth, Coffee Beyond Borders. A once-in-a-lifetime event that made the launch of this beautiful West Java coffee even more special. <br/><br/> <strong>Location</strong><br/>Mount Kamojang, West Java <br/><br/> <strong>Process</strong><br/>Natural <br/><br/> <strong>Species</strong><br/>Arabica <br/><br/> <strong>Varietal</strong><br/>S-795, Ateng, Sigararutang <br/><br/> <strong>Altitude</strong><br/>1500 - 1700 masl <br/><br/> <strong>Nett Weight</strong><br/>150gr <br/><br/> <strong>Flavor Notes Perception</strong><br/>Blueberry cream - Starfruit - Almond <br/><br/> <strong>Roast Date</strong><br/>09 AUGUST 2025 ",
    shortDescription:
      "A standout West Java Arabica from Mount Kamojang, naturally processed with vibrant blueberry, starfruit, and almond notes. Showcased at World Coffee Event Jakarta 2025.",
    grindSize: ["Beans"],
    size: ["150g"],
    coffeType: ["Arabica"],
    category_ids: ["7"],
    priceBySize: { "150g": 89000 },
    price: 89000,
    images: [
      {
        image: `${BASE_URL_CDN}/kamojang/1.png`,
      },
      {
        image: `${BASE_URL_CDN}/kamojang/2.png`,
      },
      {
        image: `${BASE_URL_CDN}/kamojang/3.png`,
      },
      {
        image: `${BASE_URL_CDN}/kamojang/4.png`,
      },
      {
        image: `${BASE_URL_CDN}/kamojang/5.png`,
      },
    ],
  },
  {
    title:
      "(Grosir min. 10kg) House Blend Espresso - Arabica & Fine Robusta 1 KG | ES46 Blend 1KG ",
    shortDescription:
      "A bold espresso house blend of 40% Arabica and 60% Fine Robusta, dark roasted for strong sweetness and dark chocolate notes. Perfect for milk-based and black coffee menus.",
    description:
      "<strong>Composition</strong><br/>40% Arabica Wethull - (Fullcityplus Roast/Very Early Second Crack/Dark Roast)<br/>60% Fine Robusta Fullwash - (Fullcity Roast/MediumToDark Roast) <br/><br/> Biji kopi grade terbaik dengan profil sangrai yang di sesuaikan dengan kebutuhan harian kedai kopi. <br/><br/> <strong>Recommended for</strong><br/>Kopi susu aren, latte, cappucino, americano, long black dengan karakter manis Dark choco dan Sweetness yang kuat. <br/><br/> <strong>Tasting Notes</strong><br/> <em>Black</em> : Dark Chocolate, Hint of Spice, Bold, Long Aftertaste <br/><em>Milk</em> : Dark Chocolate, Biscuit, Creamy <br/>High Body | Mid High Sweetness | Low Acidity <br/><br/> <strong>Nett Weight</strong><br/>970gr <br/><br/> <strong>Ukuran Lain</strong><br/>200gr - <a href='https://www.tokopedia.com/agroastery/house-blend-espresso-arabica-fine-robusta-200-gram-es46-blend' target='_blank'>Tokopedia Link</a><br/>500gr - <a href='https://www.tokopedia.com/agroastery/biji-kopi-blend-espresso-arabica-fine-robusta-500-gr-es46-blend' target='_blank'>Tokopedia Link</a> <br/><br/> <strong>Grind Options</strong><br/> <strong>BEANS</strong> : Biji kopi utuh <br/><br/> <strong>GRIND FINE</strong> : Tubruk, Mokapot, Vietnam Drip, Espresso Machine <br/><br/> <strong>GRIND MEDIUM</strong> : Semua alat seduh menggunakan paper filter (V60, Kalita wave, Kono, Aeropress, Chemex, dll) <br/><br/> <strong>GRIND COARSE</strong> : French Press, Cold Drip, Cold Brew, Espresso teknik rebus ",
    grindSize: ["Beans", "Grind Fine", "Grind Medium", "Grind Coarse"],
    size: ["1000g", "200g", "500g"],
    coffeType: ["Arabica"],
    category_ids: ["2"],
    priceBySize: { "1000g": 196000, "200g": 58000, "500g": 114000 },
    price: 196000,
    images: [
      {
        image: `${BASE_URL_CDN}/es-46/1.png`,
      },
      {
        image: `${BASE_URL_CDN}/es-46/2.png`,
      },
      {
        image: `${BASE_URL_CDN}/es-46/3.png`,
      },
      {
        image: `${BASE_URL_CDN}/es-46/4.png`,
      },
      {
        image: `${BASE_URL_CDN}/es-46/5.png`,
      },
    ],
  },
  {
    title: "Biji Kopi MANG DEWA roasted for filter by AGROASTERY",
    shortDescription:
      "A natural anaerobic Arabica from East Manglayang, West Java. Handpicked and processed with care, offering grape, dried fruit, and hibiscus notes.",
    description:
      "Tucked away in the cool, pine-shaded hills of Genteng Village, Kelompok Tani Berdikari is a small group of farmers and coffee processors. Reaching their farm is no easy feat—steep, damaged roads make the journey challenging. Coffee trees grow beneath towering pine canopies, creating a natural harmony that contributes to the cup's distinct character. <br/><br/> During a cupping session with the processors, we discovered a standout lot from Mang Dewa—one of the producers whose careful attention is evident in every sip. The cherries for this lot were selectively handpicked at peak ripeness. <br/><br/> <strong>Location</strong><br/>East Manglayang, West Java <br/><br/> <strong>Process</strong><br/>Natural Anaerob 240H <br/><br/> <strong>Species</strong><br/>Arabica <br/><br/> <strong>Varietal</strong><br/>Java, Ateng Super, Sigararutang <br/><br/> <strong>Altitude</strong><br/>1450 - 1500 masl <br/><br/> <strong>Nett Weight</strong><br/>150gr <br/><br/> <strong>Flavor Notes Perception</strong><br/>Grapes - Dried fruit - Hibiscus <br/><br/> <strong>Roast Date</strong><br/>09 AUGUST 2025 ",
    grindSize: ["Beans"],
    size: ["150g"],
    coffeType: ["Arabica"],
    category_ids: ["7"],
    priceBySize: { "150g": 89000 },
    price: 89000,
    images: [
      {
        image: `${BASE_URL_CDN}/mang-dewa/1.png`,
      },
      {
        image: `${BASE_URL_CDN}/mang-dewa/2.png`,
      },
      {
        image: `${BASE_URL_CDN}/mang-dewa/3.png`,
      },
      {
        image: `${BASE_URL_CDN}/mang-dewa/4.png`,
      },
      {
        image: `${BASE_URL_CDN}/mang-dewa/5.png`,
      },
    ],
  },
  {
    title: "Biji Kopi BLACKCURRANTJI roasted for filter by AGROASTERY",
    shortDescription:
      "A bold single-origin Arabica from Mount Kerinci, infused with blackcurrant for a vibrant cup featuring jammy blackcurrant, grape, and red cherry notes.",
    description:
      "Introducing our Blackcurrant-Infused Kerinci Coffee Beans—a truly unique single-origin experience. Grown in the volcanic soils of the Kerinci region, these coffee beans are meticulously infused with the natural essence of ripe blackcurrant, creating a coffee that's both bold and delightfully aromatic. <br/><br/> This is not a blend, but a single-origin coffee transformed through innovation. Perfect for enthusiasts looking to explore new dimensions of flavor, our Blackcurrant-Infused Kerinci Coffee Beans offer a harmonious fusion of tradition and creativity. <br/><br/> <strong>Location</strong><br/>Mount Kerinci, Indonesia <br/><br/> <strong>Process</strong><br/>Blackcurrant Infused Natural Anaerob <br/><br/> <strong>Species</strong><br/>Arabica <br/><br/> <strong>Varietal</strong><br/>Mix <br/><br/> <strong>Altitude</strong><br/>1500 masl <br/><br/> <strong>Nett Weight</strong><br/>150gr <br/><br/> <strong>Flavor Notes Perception</strong><br/>Blackcurrant Jam - Grape - Red Cherry <br/><br/> <strong>Roast Date</strong><br/>19 AGUSTUS 2025 ",
    grindSize: ["Beans", "Grind Fine", "Grind Medium", "Grind Coarse"],
    size: ["150g"],
    coffeType: ["Arabica"],
    category_ids: ["7"],
    priceBySize: { "150g": 119000 },
    price: 119000,
    images: [
      {
        image: `${BASE_URL_CDN}/blackcurrant/1.png`,
      },
      {
        image: `${BASE_URL_CDN}/blackcurrant/2.png`,
      },
      {
        image: `${BASE_URL_CDN}/blackcurrant/3.png`,
      },
    ],
  },
  {
    title: "Biji Kopi ETHIOPIA URAGA WASH roasted for filter by AGROASTERY",
    shortDescription:
      "A washed Grade 1 heirloom Arabica from Uraga, Ethiopia—tea-like with raisin and rose water notes, grown at 1950–2300 masl.",
    description:
      " Reaching Uraga means navigating steep, rugged mountain roads—an experience locals jokingly call an “African Massage.” This remote region is home to smallholder “garden” farms, where cherries are hand-harvested. At the washing station, cherries are depulped, floaters removed, and fermented in water for 12–24 hours. <br/><br/> Following washing in channels, the beans are dried on raised African beds for a period of 10–15 days. On very hot days, beds may be covered to regulate drying. Once dried, beans are stored in parchment, then undergo triple-pass color sorting and hand-sorting before export by Project Origin’s partner, Primrose. <br/><br/> <strong>Location</strong><br/>Uraga, Guji, Ethiopia <br/><br/> <strong>Process</strong><br/>Wash G1 <br/><br/> <strong>Species</strong><br/>Arabica <br/><br/> <strong>Varietal</strong><br/>Heirloom <br/><br/> <strong>Altitude</strong><br/>1950 - 2300 masl <br/><br/> <strong>Nett Weight</strong><br/>150gr <br/><br/> <strong>Flavor Notes Perception</strong><br/>Raisin - Rose Water - Tea Like <br/><br/> <strong>Roast Date</strong><br/>03 AUGUST 2025 ",
    grindSize: ["Beans"],
    size: ["150g"],
    coffeType: ["Arabica"],
    category_ids: ["7"],
    priceBySize: { "150g": 129000 },
    price: 129000,
    images: [
      {
        image: `${BASE_URL_CDN}/uraga/1.png`,
      },
      {
        image: `${BASE_URL_CDN}/uraga/2.png`,
      },
      {
        image: `${BASE_URL_CDN}/uraga/3.png`,
      },
    ],
  },
  {
    title: "(grosir min. 10kg) Biji Kopi Full Arabica Kopi Susu Ekonomis 1 KG",
    shortDescription:
      "An economical 100% Arabica from East Java, washed and dark roasted, delivering chocolaty sweetness—perfect for es kopi susu and daily café use.",
    description:
      "Di rekomendasikan untuk menu es kopi susu aren (atau pemanis lainnya) dengan 100% Arabica dengan budget ekonomis. <br/><br/> <strong>Origin</strong><br/>East Java Grade Commercial <br/><br/> <strong>Roast Level</strong><br/>FullCity+ (very early second crack / early stage dark roast) <br/><br/> <strong>Process</strong><br/>Wash <br/><br/> <strong>Notes on Kopi Susu</strong><br/>Chocolaty and Sweet <br/><br/> <strong>Nett Weight</strong><br/>1000 gram <br/><br/> <strong>Sample</strong><br/>100gr - <a href='https://www.tokopedia.com/agroastery/biji-kopi-full-arabica-kopi-susu-ekonomis-100-gr' target='_blank'>Tokopedia Link</a> <br/><br/> <strong>Grind Options</strong><br/> <strong>GRIND FINE</strong> : Tubruk, Mokapot, Espresso Machine <br/><br/> <strong>GRIND MEDIUM</strong> : Semua alat seduh menggunakan paper filter (V60, Kalita wave, Kono, Aeropress, Chemex, dll) <br/><br/> <strong>GRIND COARSE</strong> : French Press, Cold Drip, Cold Brew, Espresso teknik rebus, Vietnam Drip ",
    grindSize: ["Beans", "Grind Fine", "Grind Medium", "Grind Coarse"],
    size: ["1000g", "100g"],
    coffeType: ["Arabica"],
    category_ids: ["2"],
    priceBySize: { "1000g": 178000, "100g": 29000 },
    price: 178000,
    images: [
      {
        image: `${BASE_URL_CDN}/full-arabica/1.png`,
      },
      {
        image: `${BASE_URL_CDN}/full-arabica/2.png`,
      },
      {
        image: `${BASE_URL_CDN}/full-arabica/3.png`,
      },
      {
        image: `${BASE_URL_CDN}/full-arabica/4.png`,
      },
      {
        image: `${BASE_URL_CDN}/full-arabica/5.png`,
      },
    ],
  },
  {
    title: "(grosir min. 10kg) Biji Kopi Blend 20/80 Kopi Susu Ekonomis 1 KG",
    shortDescription:
      "A budget-friendly East Java blend of 20% Arabica and 80% Robusta, dark roasted for balanced kopi susu—ideal for wholesale purchases starting at 8kg.",
    description:
      "<strong>Grosir</strong><br/>Minimal pembelian 8kg <br/><br/> Setiap produk ditambah 1, maka akan ditambahkan 1kg. <br/><br/> Di rekomendasikan untuk menu es kopi susu aren (atau pemanis lainnya) dengan 20% Arabica dan 80% Robusta dengan rasa yang pas dan budget ekonomis. <br/><br/> <strong>Origin</strong><br/>East Java <br/><br/> <strong>Roast Level</strong><br/>FullCity+ (very early second crack / early stage dark roast) <br/><br/> <strong>Process</strong><br/>Wash (Arabica) & Natural (Robusta) <br/><br/> <strong>Nett Weight</strong><br/>1000 gram <br/><br/> <strong>Grind Options</strong><br/> <strong>GRIND FINE</strong> : Tubruk, Mokapot, Vietnam Drip, Espresso Machine <br/><br/> <strong>GRIND MEDIUM</strong> : Semua alat seduh menggunakan paper filter (V60, Kalita wave, Kono, Aeropress, Chemex, dll) <br/><br/> <strong>GRIND COARSE</strong> : French Press, Cold Drip, Cold Brew, Espresso teknik rebus ",
    grindSize: ["Beans", "Grind Fine", "Grind Medium", "Grind Coarse"],
    size: ["1000g"],
    coffeType: ["Arabica", "Robusta"],
    category_ids: ["2", "1"],
    priceBySize: { "1000g": 171000 },
    price: 171000,
    images: [
      {
        image: `${BASE_URL_CDN}/blend-ekonomis/1.png`,
      },
      {
        image: `${BASE_URL_CDN}/blend-ekonomis/2.png`,
      },
      {
        image: `${BASE_URL_CDN}/blend-ekonomis/3.png`,
      },
      {
        image: `${BASE_URL_CDN}/blend-ekonomis/4.png`,
      },
      {
        image: `${BASE_URL_CDN}/blend-ekonomis/5.png`,
      },
    ],
  },
  {
    title: "(grosir min. 10kg) Biji Kopi Blend 50/50 Kopi Susu Ekonomis 1 KG",
    shortDescription:
      "Balanced 50/50 Arabica–Robusta blend from East Java, dark roasted for chocolaty, sweet, and nutty kopi susu. Economical choice with multiple grind options.",
    description:
      "Di rekomendasikan untuk menu es kopi susu aren (atau pemanis lainnya) dengan 50% Arabica dan 50% Robusta dengan rasa yang pas dan budget ekonomis. <br/><br/> <strong>Origin</strong><br/>East Java <br/><br/> <strong>Roast Level</strong><br/>FullCity+ (very early second crack / early stage dark roast) <br/><br/> <strong>Process</strong><br/>Wash (Arabica) & Natural (Robusta) <br/><br/> <strong>Notes on Kopi Susu</strong><br/>Chocolaty, Sweet, and Nutty <br/><br/> <strong>Nett Weight</strong><br/>1000 gram x 10 <br/><br/> <strong>Grind Options</strong><br/> <strong>GRIND FINE</strong> : Tubruk, Mokapot, Vietnam Drip, Espresso Machine <br/><br/> <strong>GRIND MEDIUM</strong> : Semua alat seduh menggunakan paper filter (V60, Kalita wave, Kono, Aeropress, Chemex, dll) <br/><br/> <strong>GRIND COARSE</strong> : French Press, Cold Drip, Cold Brew, Espresso teknik rebus <br/><br/> <strong>BEANS</strong> : Biji kopi utuh ",
    grindSize: ["Beans", "Grind Fine", "Grind Medium", "Grind Coarse"],
    size: ["1000g"],
    coffeType: ["Arabica", "Robusta"],
    category_ids: ["2", "1"],
    priceBySize: { "1000g": 175000 },
    price: 175000,
    images: [
      {
        image: `${BASE_URL_CDN}/kopi-susu-50-50/1.png`,
      },
      {
        image: `${BASE_URL_CDN}/kopi-susu-50-50/2.png`,
      },
      {
        image: `${BASE_URL_CDN}/kopi-susu-50-50/3.png`,
      },
      {
        image: `${BASE_URL_CDN}/kopi-susu-50-50/4.png`,
      },
      {
        image: `${BASE_URL_CDN}/kopi-susu-50-50/5.png`,
      },
      {
        image: `${BASE_URL_CDN}/kopi-susu-50-50/6.png`,
      },
      {
        image: `${BASE_URL_CDN}/kopi-susu-50-50/7.png`,
      },
      {
        image: `${BASE_URL_CDN}/kopi-susu-50-50/8.png`,
      },
    ],
  },
  {
    title: "(grosir min. 10kg) Biji Kopi Blend 70/30 Kopi Susu Ekonomis 1 KG",
    shortDescription:
      "A 70% Arabica and 30% Robusta blend from East Java, dark roasted for balanced kopi susu with an economical price point and versatile grind options.",
    description:
      " Di rekomendasikan untuk menu es kopi susu aren (atau pemanis lainnya) dengan 70% Arabica dan 30% Robusta dengan rasa yang pas dan budget ekonomis. <br/><br/> <strong>Origin</strong><br/>East Java <br/><br/> <strong>Roast Level</strong><br/>FullCity+ (very early second crack / early stage dark roast) <br/><br/> <strong>Process</strong><br/>Wash (Arabica) & Natural (Robusta) <br/><br/> <strong>Nett Weight</strong><br/>1000 gram <br/><br/> <strong>Grind Options</strong><br/> <strong>GRIND FINE</strong> : Tubruk, Mokapot, Vietnam Drip, Espresso Machine <br/><br/> <strong>GRIND MEDIUM</strong> : Semua alat seduh menggunakan paper filter (V60, Kalita wave, Kono, Aeropress, Chemex, dll) <br/><br/> <strong>GRIND COARSE</strong> : French Press, Cold Drip, Cold Brew, Espresso teknik rebus <br/><br/> <strong>BEANS</strong> : Biji kopi utuh ",
    grindSize: ["Beans", "Grind Fine", "Grind Medium", "Grind Coarse"],
    size: ["1000g"],
    coffeType: ["Arabica", "Robusta"],
    category_ids: ["2", "1"],
    priceBySize: { "1000g": 154850 },
    price: 154850,
    images: [
      {
        image: `${BASE_URL_CDN}/kopi-susu-70-30/1.png`,
      },
      {
        image: `${BASE_URL_CDN}/kopi-susu-70-30/2.png`,
      },
      {
        image: `${BASE_URL_CDN}/kopi-susu-70-30/3.png`,
      },
      {
        image: `${BASE_URL_CDN}/kopi-susu-70-30/4.png`,
      },
      {
        image: `${BASE_URL_CDN}/kopi-susu-70-30/5.png`,
      },
      {
        image: `${BASE_URL_CDN}/kopi-susu-70-30/6.png`,
      },
    ],
  },
  {
    title:
      "House Blend Espresso - Arabica & Fine Robusta 100 gr | PRIME73 100gr ",
    shortDescription:
      "A 70% Arabica and 30% Fine Robusta blend, expertly dark roasted for daily café use. Available in 100g, 500g, and 1kg packs with multiple grind options.",
    description:
      " Di rekomendasikan untuk menu es kopi susu aren (atau pemanis lainnya) dengan 70% Arabica dan 30% Robusta dengan rasa yang pas dan budget ekonomis. <br/><br/> <strong>Origin</strong><br/>East Java <br/><br/> <strong>Roast Level</strong><br/>FullCity+ (very early second crack / early stage dark roast) <br/><br/> <strong>Process</strong><br/>Wash (Arabica) & Natural (Robusta) <br/><br/> <strong>Nett Weight</strong><br/>1000 gram <br/><br/> <strong>Grind Options</strong><br/> <strong>GRIND FINE</strong> : Tubruk, Mokapot, Vietnam Drip, Espresso Machine <br/><br/> <strong>GRIND MEDIUM</strong> : Semua alat seduh menggunakan paper filter (V60, Kalita wave, Kono, Aeropress, Chemex, dll) <br/><br/> <strong>GRIND COARSE</strong> : French Press, Cold Drip, Cold Brew, Espresso teknik rebus <br/><br/> <strong>BEANS</strong> : Biji kopi utuh ",
    grindSize: ["Beans", "Grind Fine", "Grind Medium", "Grind Coarse"],
    size: ["100g"],
    coffeType: ["Arabica", "Robusta"],
    category_ids: ["2", "1"],
    priceBySize: { "100g": 32300 },
    price: 32300,
    images: [
      {
        image: `${BASE_URL_CDN}/prime-73/1.png`,
      },
      {
        image: `${BASE_URL_CDN}/prime-73/2.png`,
      },
      {
        image: `${BASE_URL_CDN}/prime-73/3.png`,
      },
      {
        image: `${BASE_URL_CDN}/prime-73/4.png`,
      },
      {
        image: `${BASE_URL_CDN}/prime-73/5.png`,
      },
      {
        image: `${BASE_URL_CDN}/prime-73/6.png`,
      },
    ],
  },
  {
    title: "Biji Kopi Full Robusta Kopi Susu Ekonomis",
    shortDescription:
      "An economical 100% Robusta from Lampung, naturally processed and dark roasted for chocolaty, nutty, and bold kopi susu, hotel blends, or mixed coffee drinks.",
    description:
      "Di rekomendasikan untuk menu es kopi susu aren (atau pemanis lainnya), Kopi Hotel, atau Campuran Minuman Kopi 100% Robusta dengan budget ekonomis. <br/><br/> <strong>Species</strong><br/>Robusta <br/><br/> <strong>Origin</strong><br/>Lampung <br/><br/> <strong>Roast Level</strong><br/>FullCity (before second crack / medium to dark) <br/><br/> <strong>Process</strong><br/>Natural <br/><br/> <strong>Notes on Kopi Susu</strong><br/>Chocolaty, nutty, and Bold <br/><br/> <strong>Nett Weight</strong><br/>500 gram <br/><br/> <strong>Sample</strong><br/>100gr - <a href='https://www.tokopedia.com/agroastery/biji-kopi-full-robusta-kopi-susu-ekonomis-100-gr' target='_blank'>Tokopedia Link</a> <br/><br/> <strong>Grind Options</strong><br/> <strong>GRIND FINE</strong> : Tubruk, Mokapot, Vietnam Drip, Espresso Machine <br/><br/> <strong>GRIND MEDIUM</strong> : Semua alat seduh menggunakan paper filter (V60, Kalita wave, Kono, Aeropress, Chemex, dll) <br/><br/> <strong>GRIND COARSE</strong> : French Press, Cold Drip, Cold Brew, Espresso teknik rebus ",
    grindSize: ["Beans", "Grind Fine", "Grind Medium", "Grind Coarse"],
    size: ["500g"],
    coffeType: ["Robusta"],
    category_ids: ["2", "1"],
    priceBySize: { "500g": 91200 },
    price: 91200,
    images: [
      {
        image: `${BASE_URL_CDN}/lampung/1.png`,
      },
      {
        image: `${BASE_URL_CDN}/lampung/2.png`,
      },
      {
        image: `${BASE_URL_CDN}/lampung/3.png`,
      },
      {
        image: `${BASE_URL_CDN}/lampung/4.png`,
      },
      {
        image: `${BASE_URL_CDN}/lampung/5.png`,
      },
      {
        image: `${BASE_URL_CDN}/lampung/6.png`,
      },
    ],
  },
  {
    title: "Biji Kopi Full Robusta Kopi Susu Ekonomis 200 gr",
    shortDescription:
      "Affordable 100% Robusta from Lampung, naturally processed and medium–dark roasted for chocolaty, nutty, and bold kopi susu or hotel blends.",
    description:
      "Di rekomendasikan untuk menu es kopi susu aren (atau pemanis lainnya), Kopi Hotel, atau Campuran Minuman Kopi 100% Robusta dengan budget ekonomis. <br/><br/> <strong>Species</strong><br/>Robusta <br/><br/> <strong>Origin</strong><br/>Lampung <br/><br/> <strong>Roast Level</strong><br/>FullCity (before second crack / medium to dark) <br/><br/> <strong>Process</strong><br/>Natural <br/><br/> <strong>Notes on Kopi Susu</strong><br/>Chocolaty, Nutty, and Bold <br/><br/> <strong>Nett Weight</strong><br/>200 gram <br/><br/> <strong>Ukuran Lebih Besar</strong><br/>1kg - <a href='https://www.tokopedia.com/agroastery/biji-kopi-full-robusta-kopi-susu-ekonomis-1-kg-1kg' target='_blank'>Tokopedia Link</a> <br/><br/> <strong>Grind Options</strong><br/> <strong>GRIND FINE</strong> : Tubruk, Mokapot, Vietnam Drip, Espresso Machine <br/><br/> <strong>GRIND MEDIUM</strong> : Semua alat seduh menggunakan paper filter (V60, Kalita wave, Kono, Aeropress, Chemex, dll) <br/><br/> <strong>GRIND COARSE</strong> : French Press, Cold Drip, Cold Brew, Espresso teknik rebus ",
    grindSize: ["Beans", "Grind Fine", "Grind Medium", "Grind Coarse"],
    size: ["200g"],
    coffeType: ["Robusta"],
    category_ids: ["2", "1"],
    priceBySize: { "200g": 41800 },
    price: 41800,
    images: [
      {
        image: `${BASE_URL_CDN}/lampung-robusta/1.png`,
      },
      {
        image: `${BASE_URL_CDN}/lampung-robusta/2.png`,
      },
      {
        image: `${BASE_URL_CDN}/lampung-robusta/3.png`,
      },
      {
        image: `${BASE_URL_CDN}/lampung-robusta/4.png`,
      },
      {
        image: `${BASE_URL_CDN}/lampung-robusta/5.png`,
      },
      {
        image: `${BASE_URL_CDN}/lampungrobusta/6.png`,
      },
      {
        image: `${BASE_URL_CDN}/lampungrobusta/7.png`,
      },
      {
        image: `${BASE_URL_CDN}/lampungrobusta/8.png`,
      },
    ],
  },
];

const derivePriceBySize = (p: TProductBase): Record<string, number> => {
  if (p.priceBySize && Object.keys(p.priceBySize).length) return p.priceBySize;

  const basePer100g = typeof p.price === "number" ? p.price : 0;
  const bySize: Record<string, number> = {};

  for (const sz of p.size ?? []) {
    const m = sz.match(/^(\d+)\s*g$/i);
    const grams = m ? parseInt(m[1], 10) : null;
    bySize[sz] = grams ? Math.round((grams / 100) * basePer100g) : basePer100g;
  }
  return bySize;
};

const minOf = (obj: Record<string, number>) =>
  Math.min(
    ...Object.values(obj).filter(
      (v) => typeof v === "number" && !Number.isNaN(v),
    ),
  );

export const PRODUCT_LIST: TProduct[] = RAW_PRODUCTS.map((p) => {
  const priceBySize = derivePriceBySize(p);
  const minPrice = minOf(priceBySize);

  return {
    ...p,
    slug: slugify(p.title),
    category: p.category_ids.map((id) => CATEGORY_BY_ID[id]).filter(Boolean),
    priceBySize,
    minPrice,
    price: minPrice,
  };
});
