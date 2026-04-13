[Skip to main content](https://biteship.com/id/docs/api/couriers/overview#docusaurus_skipToContent_fallback)

# Overview

# Courier API Introduction

Biteship partners with multiple couriers around the region. You can find a list of available couriers with this Couriers API. This API can help you to choose which courier that suits your needs.

Endpoints

```jsx
GET /v1/couriers
```

* * *

# List of available couriers

| Courier Code | Courier Service Name | Courier Service Code | Description |
| --- | --- | --- | --- |
| gojek | Instant | instant | On Demand Instant (bike) |
| gojek | Same Day | same\_day | On Demand within 8 hours (bike) |
| grab | Instant | instant | On Demand Instant (bike) |
| grab | Same Day | same\_day | On Demand within 8 hours (bike) |
| grab | Instant Car | instant\_car | Grab Car Express |
| deliveree | Tronton Wing Box | tronton\_wing\_box | Tronton Wing Box |
| deliveree | Tronton Box | tronton\_box | Tronton Box |
| deliveree | Fuso Heavy | fuso\_heavy | Fuso Heavy |
| deliveree | Fuso Lite | fuso\_light | Fuso Lite |
| deliveree | CDD Box | cdd\_box | CDD Box |
| deliveree | CDD Pickup | cdd\_pickup | CDD Pickup |
| deliveree | CDE - Frozen | cde\_frozen | CDE - Frozen |
| deliveree | CDE - Flammable | cde\_flammable | CDE - Flammable |
| deliveree | CDE - Chemical | cde\_chemical | CDE - Chemical |
| deliveree | Engkel Box | engkel\_box | Engkel Box |
| deliveree | Engkel Pickup | engkel\_pickup | Engkel Pickup |
| deliveree | Small Box | small\_box | Small Box |
| deliveree | Pickup | pickup | Pickup |
| deliveree | Van | van | Van |
| deliveree | Economy | economy | Economy |
| jne | Reguler | reg | Regular service |
| jne | YES | yes | Express, next day |
| jne | OKE | oke | Economy servive |
| jne | JTR | jtr | Trucking with minimum weight of 10 kg |
| jne | JTR 150 250 | jtr\_150\_250 | Trucking for motorbike with 150cc to 250cc |
| jne | JTR 150 | jtr\_150 | Trucking for motorbike below 150cc |
| jne | JTR 250 | jtr\_250 | Trucking for motorbike above 250cc |
| tiki | EKO | eko | Economic service |
| tiki | SDS | sds | same day service |
| tiki | REG | reg | Layanan reguler |
| tiki | ONS | ons | One night service |
| tiki | T15 | t15 | Motor di bawah 150CC |
| tiki | T25 | t25 | Motor di bawah 250CC |
| tiki | T60 | t60 | Motor di bawah 600CC |
| tiki | Trucking | trc | TIKI Trucking |
| ninja | Standard | standard | Layanan standard |
| lion | Reg Pack | reg\_pack | Layanan standard |
| lion | Land Pack | land\_pack | Pengiriman menggunakan kereta api |
| lion | One Pack | one\_pack | Layanan besok sampai |
| lion | Jago Pack | jago\_pack | Pengiriman standard |
| lion | Docu Pack | docu\_pack | Pengiriman dokumen |
| lion | Big Pack | big\_pack | Layanan trucking Lion Parcel |
| rara | Instant | instant | Instant delivery service |
| sicepat | Reguler | reg | Layanan reguler |
| sicepat | Best | best | Besok sampai tujuan |
| sicepat | SDS | sds | Same day service |
| sicepat | GOKIL | gokil | Layanan kargo |
| jnt | EZ | ez | Layanan reguler |
| idexpress | Reguler | reg | Layanan reguler |
| idexpress | Same Day | smd | Layanan Same Day |
| idexpress | ID Truck | idtruck | Layanan Trucking |
| rpx | Same Day Package | sdp | Layanan sampai di hari yang sama. |
| rpx | Mid Day Package | mdp | Layanan tiba sebelum jam 12 siang esoknya |
| rpx | Next Day Package | ndp | Layanan sampai 1 hari kerja. |
| rpx | Reguler Package | rgp | Pengiriman standard |
| rpx | Paket Ambil Suka-suka | pas | Pengambilan barang mandiri di lokasi mitra RPX |
| rpx | Economy Delivery | ecp | Kirim paket >10 kg dengan biaya hemat |
| rpx | Heavy Weight Delivery | hwp | Kirim paket >20 kg dengan biaya hemat |
| jdl | Reguler | reg | Regular shipment |
| wahana | Normal | normal | Layanan standard |
| pos | Kilat Khusus | kilat\_khusus | Layanan kilat khusus |
| pos | Q9 Same Day | q9\_same\_day | Layanan max 9 jam sampai. Cut off pukul 16:00 |
| pos | Same Day | same\_day | Layanan sampai di hari yang sama |
| pos | Next Day | next\_day | Layanan paket besok sampai |
| pos | Jumbo Ekonomi | jumbo\_ekonomi | Layanan dengan tarif tingkat berat pertama mulai dari 3kg - 30kg |
| anteraja | Reguler | reg | Regular shipment |
| anteraja | Same Day | same\_day | Same day service for Jakarta Area |
| anteraja | Next Day | next\_day | Next day service delivery |
| sap | REG | reg | Regular service |
| sap | ODS | ods | One Day Service |
| sap | SDS | sds | Same Day Service |
| sap | Cargo | cargo | Cargo Land Service |
| paxel | Small Package | small | Layanan paket small |
| paxel | Medium Package | medium | Layanan paket medium |
| paxel | Large Package | large | Layanan paket large |
| paxel | Paxel Big | paxel\_big | Layanan kargo paxel big |
| borzo | Instant Bike | instant\_bike | Delivery using bike |
| borzo | Instant Car | instant\_car | Delivery using car |
| lalamove | Motorcycle | motorcycle | Layanan dapat digunakan dengan berat mulai dari 0 kg sampai 20 kg |
| lalamove | MPV | mpv | Layanan dapat digunakan dengan berat mulai dari 0 kg sampai 200 kg |
| lalamove | Van | van | Layanan dapat digunakan dengan berat mulai dari 200 kg sampai 600 kg |
| lalamove | Truck | truck | Layanan dapat digunakan dengan berat mulai dari 600 kg sampai 800 kg |
| lalamove | Cdd Bak | cdd\_bak | Layanan dapat digunakan dengan berat mulai dari 2500 kg sampai 5000 kg |
| lalamove | Cdd Box | cdd\_box | Layanan dapat digunakan dengan berat mulai dari 2500 kg sampai 5000 kg |
| lalamove | Engkel Box | engkel\_box | Layanan dapat digunakan dengan berat mulai dari 1000 kg sampai 2000 kg |
| lalamove | Engkel Bak | engkel\_bak | Layanan dapat digunakan dengan berat mulai dari 2000 kg sampai 2500 kg |
| sentralcargo | Land Electronic | land\_electronic | Layanan Elektronik via Darat |
| sentralcargo | Lan Non Electronic | land\_non\_electronic | Layanan Non-Elektronik via Darat |
| sentralcargo | Air Electronic | air\_electronic | Layanan Elektronik via Udara |
| sentralcargo | Air Non Electronic | air\_non\_electronic | Layanan Non-Elektronik via Udara |
| dash\_express | Same Day | SAME\_DAY | On Demand within 8 hours (EV bike) |