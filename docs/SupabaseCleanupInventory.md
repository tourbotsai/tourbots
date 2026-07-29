# Supabase account & venue inventory

_Generated: 28/07/2026 20:40 (read-only from production Supabase)._

Use this to mark what to keep vs delete. After you annotate, I will write safe delete SQL.

## Keep candidates (from your notes)

- `tourbotsai@gmail.com`
- `website@tourbots.ai`
- `agency@tourbots.ai` (if present)
- Apex VR Tours agency client (`agencyclient@…` / unique client under agency)
- Apollo Mark — **live customer, leave alone**

## Summary counts

| Table | Rows |
|---|---:|
| users | 37 |
| venues | 37 |
| venue_billing_records | 28 |
| subscriptions | 16 |
| user_venue_access | 37 |
| chatbot_configs | 12 |
| tours | 19 |
| agency_portal_settings | 10 |
| agency_portal_users | 89 |
| agency_portal_shares | 4 |

## Decision column

Fill `Decision` with: `KEEP` / `DELETE` / `UNSURE`.

## Users + owned venues

| Decision | Suggest | Email | User name | Role | Active | User created | Venue | Slug | Venue active | Plan (billing) | Billing status | Bots | Tours | Agency portal | Agency users | Shares | cancel_at_period_end | Sub status | Venue ID | User ID |
|---|---|---|---|---|---|---|---|---|---|---|---|---:|---:|---|---:|---:|---|---|---|---|
| | KEEP? (match: agency@tourbots.ai) | `agency@tourbots.ai` | — | — | None | — | Agency | `agency` | True | agency | active | 0 | 0 | no | 0 | 0 | None | — | `b4b3f95b-23eb-47bc-85cb-2b6b90d4e6dd` | `—` |
| | REVIEW | `agency2@tourbots.ai` | agency tb | admin | True | 2026-05-30 13:43:16 | agency2 | `agency2` | True | agency | active | 0 | 0 | no | 0 | 0 | None | — | `f6bfec2b-15aa-4e6b-87ba-b8ebaa1cd827` | `2c523c81-a5d5-413f-b4ff-b05cc9313ba2` |
| | REVIEW | `agency3@tourbots.ai` | agency3 tb | admin | True | 2026-05-30 13:49:24 | agency3 | `agency3` | True | agency | active | 0 | 0 | yes | 0 | 0 | False | active | `c3db32f8-d63c-4094-a898-b5f9f6cb6998` | `d9ec197e-384a-4399-8e74-78d27342ab12` |
| | LIKELY DELETE (test) | `agencybillingtest@test.com` | Agency Billing | admin | True | 2026-05-31 11:37:13 | agencybillingtest | `agencybillingtest` | True | agency | active | 0 | 0 | no | 0 | 0 | True | active | `91db03f4-6966-4662-9f11-7c03630daab9` | `ecd3085f-c7d1-4063-a38c-c4539c249c46` |
| | LIKELY DELETE (test) | `agencyplanswitch@test.com` | agencyplan switch | admin | True | 2026-05-31 11:55:49 | agencyplanswitch | `agencyplanswitch` | True | pro | active | 0 | 0 | no | 0 | 0 | False | active | `606dedbb-da2e-4fda-a12e-0e3bc59850ef` | `f66e0b8d-a459-4bc2-89de-ca0022a92cbe` |
| | LIKELY DELETE (test) | `agencytoproaddons@test.com` | Agencytopro addons | admin | True | 2026-05-31 12:30:39 | agencytoproaddons | `agencytoproaddons` | True | pro | active | 0 | 0 | no | 0 | 0 | False | active | `40dcdaae-1c51-4339-97d7-1ebab96c6df9` | `ea5fde2e-1d80-444d-8355-47cbe348a910` |
| | KEEP? (match: apex) | `apex@tourbots.ai` | apex test | admin | True | 2026-05-30 12:57:20 | apex | `apex` | True | agency | active | 0 | 0 | settings | 0 | 0 | None | — | `85ee584b-4d1e-44bd-9658-b906f8c4573c` | `bf12909d-4256-4866-82fb-53372b6fcedc` |
| | KEEP? (match: apex) | `apex3d@tourbots.ai` | Mark Smith | admin | True | 2026-05-30 09:22:38 | Apex 3d | `apex-3d` | True | free | free | 0 | 0 | settings | 0 | 0 | None | — | `37ff2c76-f6e3-495e-be61-8d578cfed5ea` | `75e4985c-d48a-45e6-811d-67f44eed7bc4` |
| | KEEP? (match: apex) | `apexfacilitiespricing@gmail.com` | Apex Test | admin | True | 2026-04-14 21:35:55 | Apex Test | `apex-test` | True | free | free | 0 | 2 | settings | 0 | 0 | None | — | `dc7b5f62-e011-41ee-b64a-9660098658da` | `7a294892-15f8-4ffb-b14a-e8da52811cd5` |
| | KEEP? (match: apollo) | `mark@apollo3d.co.uk` | Mark Shepherd | admin | True | 2026-06-06 12:20:24 | Apollo 3D | `apollo-3d` | True | agency | active | 1 | 1 | yes | 0 | 0 | False | active | `1c0f36ef-4ca0-4754-a381-094bb1db5f60` | `1d064f1c-a0bf-4f68-a3aa-8d8c34f9cde4` |
| | LIKELY DELETE (test) | `billingprod@tourbots.ai` | Billing Prod | admin | True | 2026-07-18 12:34:42 | Billing Test Prod | `billing-test-prod` | True | free | free | 0 | 0 | no | 0 | 0 | None | — | `59592a2e-52d1-4d99-8212-2ce28f881edd` | `db7c4418-fe44-4c80-9534-edb3116ec901` |
| | LIKELY DELETE (test) | `billingtest2@test.com` | Billing Test2 | admin | True | 2026-05-31 11:32:49 | Billing Test2 | `billing-test2` | True | pro | active | 0 | 1 | no | 0 | 0 | True | active | `4f089a09-a3cf-4444-87d0-3cfb0ee4db08` | `4e4affd8-b736-4067-894c-1cb8861e9583` |
| | LIKELY DELETE (test) | `billingplancanceladdoncascade@test.com` | BillingPlan AddonCascade | admin | True | 2026-05-31 11:43:30 | billingplancanceladdoncascade | `billingplancanceladdoncascade` | True | pro | active | 0 | 0 | no | 0 | 0 | True | active | `ee53f985-a608-4143-9dd3-a7c7c00adbd9` | `be16b2cf-e203-412a-9802-1978f44018df` |
| | LIKELY DELETE (test) | `billingreactivate@test.com` | billing reactivate | admin | True | 2026-05-31 11:52:09 | billingreactivate | `billingreactivate` | True | pro | active | 0 | 0 | no | 0 | 0 | False | active | `0f19d444-b69d-4dad-8ccb-a611c0a7381c` | `4097084f-d9e0-430d-8f18-920bc8ba49dd` |
| | LIKELY DELETE (test) | `freetest@test.com` | Free Test | admin | True | 2026-05-31 15:53:11 | freetest | `freetest` | True | free | free | 0 | 1 | no | 0 | 0 | None | — | `e80b74ab-58fe-4e38-aab4-925a6892d8a3` | `c0006134-5269-45c7-9601-de1fd1d4d5c3` |
| | REVIEW | `hoteltoursai@gmail.com` | Jack Melluish | admin | True | 2026-05-31 18:05:52 | HotelTours | `hoteltours` | True | free | free | 0 | 0 | no | 0 | 0 | None | — | `292ae77d-30cc-482f-804a-5eb4ef9a3fd2` | `b553b742-b3d8-42ae-aaf0-cdadfe6bb34a` |
| | REVIEW | `live.signup.1774806522481-bsg5bk@example.com` | Live Signup | admin | True | 2026-03-29 17:48:48 | Live Signup Venue 1774806522481-bsg5bk | `live-signup-venue-1774806522481-bsg5bk` | True | — | — | 0 | 0 | no | 0 | 0 | None | — | `8dff80dd-4f2f-4b9d-8ee4-090dce6c4326` | `72d6b1c9-16b5-415e-ad0b-274f76ca51e3` |
| | REVIEW | `live.signup.1774807712505-yf8e2f@example.com` | Live Signup | admin | True | 2026-03-29 18:08:36 | Live Signup Venue 1774807712505-yf8e2f | `live-signup-venue-1774807712505-yf8e2f` | True | — | — | 0 | 0 | no | 0 | 0 | None | — | `1a36d5d9-824c-42d5-b903-c729d1ea7889` | `2bf4d9f8-5a1e-4a36-ae78-51e6cbcc49ed` |
| | REVIEW | `live.signup.1784816389284-slxi3a@example.com` | Live Signup | admin | True | 2026-07-23 14:19:55 | Live Signup Venue 1784816389284-slxi3a | `live-signup-venue-1784816389284-slxi3a` | True | — | — | 0 | 0 | no | 0 | 0 | None | — | `9f466093-c38d-43bf-b2c5-ce74bb473795` | `1a6596a6-346f-4ded-a454-74e88e6a4a55` |
| | REVIEW | `live.signup.1784816536086-x99q9j@example.com` | Live Signup | admin | True | 2026-07-23 14:22:19 | Live Signup Venue 1784816536086-x99q9j | `live-signup-venue-1784816536086-x99q9j` | True | — | — | 0 | 0 | no | 0 | 0 | None | — | `b279f823-2212-4cd2-80e1-a8df1176ba08` | `cea5a8fd-f5bc-4dc5-9a7f-46439e35a599` |
| | REVIEW | `live.signup.1784831301674-4dz2i4@example.com` | Live Signup | admin | True | 2026-07-23 18:28:29 | Live Signup Venue 1784831301674-4dz2i4 | `live-signup-venue-1784831301674-4dz2i4` | True | — | — | 0 | 0 | no | 0 | 0 | None | — | `f45e3e4a-2fcc-4725-b6bd-6b8d176d6b4b` | `3dec8af4-902c-43fc-b83e-e03068285ac1` |
| | REVIEW | `live.signup.1784834227408-8z62lk@example.com` | Live Signup | admin | True | 2026-07-23 19:17:11 | Live Signup Venue 1784834227408-8z62lk | `live-signup-venue-1784834227408-8z62lk` | True | — | — | 0 | 0 | no | 0 | 0 | None | — | `6f0313e2-8438-4041-adbd-a4fbb9cd1392` | `d6c9c20c-1482-4f1b-ac0e-785180860211` |
| | REVIEW | `live.signup.1784834725484-ju18sy@example.com` | Live Signup | admin | True | 2026-07-23 19:25:33 | Live Signup Venue 1784834725484-ju18sy | `live-signup-venue-1784834725484-ju18sy` | True | — | — | 0 | 0 | no | 0 | 0 | None | — | `1968695c-8c91-4c3a-832f-b0ea5979c29d` | `75138b1b-8f6b-4530-9f28-eb8e0b8fb5fc` |
| | REVIEW | `mpskin@tourbots.ai` | MP Skin | admin | True | 2026-06-09 21:32:41 | MP Skin | `mp-skin` | True | agency | active | 1 | 1 | no | 0 | 0 | False | active | `9a57f2ed-d30a-4354-8c6c-2fd8bd161000` | `684e147f-8b30-41ac-a080-9703fd2f95ac` |
| | LIKELY DELETE (test) | `proplanswitch@test.com` | proplan switch | admin | True | 2026-05-31 11:50:19 | proplanswitch | `proplanswitch` | True | agency | active | 0 | 0 | no | 0 | 0 | False | active | `4cd468a3-02e2-455d-9e5b-c197e62acf32` | `cf009e50-1adf-41b9-8557-a3550c40ecc5` |
| | LIKELY DELETE (test) | `protoagencyaddons@test.com` | Proagency addons | admin | True | 2026-05-31 12:24:07 | protoagencyaddons | `protoagencyaddons` | True | agency | active | 0 | 0 | no | 0 | 0 | False | active | `93af844a-a4ac-45c8-9dd5-d188f8c5b66d` | `09c72466-4b74-4dc8-a532-0d99d0fe2f3f` |
| | LIKELY DELETE (test) | `test@tourbots.ai` | Test Account | admin | True | 2026-03-29 14:17:07 | Test Account | `test-account` | True | pro | active | 1 | 1 | yes | 86 | 1 | None | — | `7ebd34e5-4b98-45a1-a752-5292b31732b8` | `5a1a7722-e93b-4ed0-a4b3-ecba3adbe65b` |
| | LIKELY DELETE (test) | `testbilling@test.com` | Test Billing | admin | True | 2026-05-31 10:38:42 | Test Billing | `test-billing` | True | pro | active | 1 | 2 | no | 0 | 0 | False | active | `96550657-282d-4e01-b746-98194d0ea392` | `83d60685-afec-4936-a1d9-4d85e6a7f6dd` |
| | LIKELY DELETE (test) | `testnine@test.com` | test nine | admin | True | 2026-05-30 09:34:55 | test nine | `test-nine` | True | — | — | 0 | 0 | no | 0 | 0 | None | — | `97d39be1-64f8-4ed8-a1ff-62c41998f3b8` | `07568991-b544-4c20-a916-b58f6ec38e3d` |
| | LIKELY DELETE (test) | `testten@test.com` | test ten | admin | True | 2026-05-30 09:36:51 | test ten | `test-ten` | True | — | — | 0 | 0 | no | 0 | 0 | None | — | `1f513c84-714a-4dcc-b971-7e096ca34d3d` | `171e9d41-f4ea-49c7-a527-91a6dbff9af4` |
| | LIKELY DELETE (test) | `testone@test.com` | test one | admin | True | 2026-04-14 21:40:11 | testone | `testone` | True | free | free | 1 | 2 | settings | 0 | 0 | None | — | `8ba11f8b-4db1-40bc-a3db-4b04e6405e02` | `a6580fd8-8091-4d70-8f46-4b028543fe6b` |
| | LIKELY DELETE (test) | `touragency@test.com` | Tour Agency | admin | True | 2026-05-30 15:13:16 | Tour Agency | `tour-agency` | True | agency | active | 1 | 1 | yes | 1 | 1 | False | active | `f415692a-cea6-4aad-ac0f-405f6a056395` | `ce710faf-d48d-45f3-8c47-36c4d5616339` |
| | KEEP? (match: tourbotsai@gmail.com) | `tourbotsai@gmail.com` | Tour Bots | platform_admin | True | 2026-03-26 11:13:32 | Tour Bots | `tour-bots` | True | pro | active | 2 | 3 | yes | 1 | 1 | True | active | `b1afe3a3-303f-463c-bbd3-6673be4833b6` | `5de6793d-1b0e-4036-9d04-759f4be9dbae` |
| | KEEP? (match: agency@tourbots.ai) | `agency@tourbots.ai` | TourBots Agency | admin | True | 2026-05-31 16:57:42 | TourBots Agency | `tourbots-agency` | True | agency | active | 2 | 2 | yes | 1 | 1 | False | active | `952399d7-54d5-4b3e-a7b5-3b4cd925b1b8` | `d35a1e4c-9d30-42a7-a69b-4302fbb3d9af` |
| | LIKELY DELETE (test) | `tourbotstest@gmail.com` | TourBots Test | admin | True | 2026-03-26 22:14:13 | TourBots Test | `tourbots-test` | True | free | free | 1 | 1 | no | 0 | 0 | None | — | `703873fc-2340-4cc8-9b19-0d145d790ec5` | `38a27e4a-79bf-4efb-bd68-08da111812d8` |
| | KEEP? (match: website@tourbots.ai) | `website@tourbots.ai` | TourBots Website | admin | True | 2026-05-31 16:53:40 | TourBots Website | `tourbots-website` | True | pro | active | 1 | 1 | no | 0 | 0 | False | active | `aed89398-bb6d-44e7-8ff6-de45ffcbfcd0` | `b68e681e-7270-4821-af4e-bb3a36f8a37f` |
| | REVIEW | `venuetoursai@gmail.com` | Jack Melluish | admin | True | 2026-05-31 17:40:58 | Venue Tours | `venue-tours` | True | free | free | 0 | 0 | no | 0 | 0 | None | — | `4586773e-a63f-4d92-9a60-b51dbbf00bb1` | `7dda11e1-4054-4e78-8647-a1e2eea7dba0` |

## Users with no owned venue

| Decision | Suggest | Email | Name | Role | venue_id on user | Active | Created | User ID |
|---|---|---|---|---|---|---|---|---|
| | REVIEW | `tourbots2@gmail.com` | tour bots2 | admin | `b1afe3a3-303f-463c-bbd3-6673be4833b6` | True | 2026-03-28 14:29:24 | `4c1cb3f7-b2a5-4d5e-934b-3dff197a16b9` |

## Agency portal detail

| Agency venue | Agency name | Enabled | Client portal users | Shares | Venue ID |
|---|---|---|---:|---:|---|
| Apollo 3D | — | True | 0 | 0 | `1c0f36ef-4ca0-4754-a381-094bb1db5f60` |
| TourBots Agency | — | True | 1 | 1 | `952399d7-54d5-4b3e-a7b5-3b4cd925b1b8` |
| testone | — | False | 0 | 0 | `8ba11f8b-4db1-40bc-a3db-4b04e6405e02` |
| Apex Test | — | False | 0 | 0 | `dc7b5f62-e011-41ee-b64a-9660098658da` |
| Apex 3d | — | False | 0 | 0 | `37ff2c76-f6e3-495e-be61-8d578cfed5ea` |
| apex | — | False | 0 | 0 | `85ee584b-4d1e-44bd-9658-b906f8c4573c` |
| agency3 | — | True | 0 | 0 | `c3db32f8-d63c-4094-a898-b5f9f6cb6998` |
| Tour Agency | Apex VR Tours | True | 1 | 1 | `f415692a-cea6-4aad-ac0f-405f6a056395` |
| Test Account | Test Agency | True | 86 | 1 | `7ebd34e5-4b98-45a1-a752-5292b31732b8` |
| Tour Bots | VR Tour 360 | True | 1 | 1 | `b1afe3a3-303f-463c-bbd3-6673be4833b6` |

## Agency portal users (emails)

| Decision | Agency venue | Portal email | Display name | Active | Last login |
|---|---|---|---|---|---|
| | Test Account | `agency-live-mnbw5jgs-godi8y6d@tourbots.ai` | — | True | 2026-03-29 15:05:46 |
| | Test Account | `agency-live-mnbw5ji6-5gvu6lpi@tourbots.ai` | — | True | 2026-03-29 15:05:46 |
| | Test Account | `agency-live-mnbw5jiv-15gr5kpp@tourbots.ai` | — | True | 2026-03-29 15:05:46 |
| | Test Account | `agency-live-mnbw5jj6-xrwuwifq@tourbots.ai` | — | True | 2026-03-29 15:05:46 |
| | Test Account | `agency-live-mnbw5jl8-fqloe9ly@tourbots.ai` | — | True | 2026-03-29 15:05:46 |
| | Test Account | `agency-live-mnbw5jla-ccj6ov60@tourbots.ai` | — | True | 2026-03-29 15:05:49 |
| | Test Account | `agency-live-mnbw5jli-hsnp6pii@tourbots.ai` | — | True | 2026-03-29 15:05:46 |
| | Test Account | `agency-live-mnbw7dq5-po6spp5b@tourbots.ai` | — | True | 2026-03-29 15:07:05 |
| | Test Account | `agency-live-mnbwb9rs-43rsdi8q@tourbots.ai` | — | True | 2026-03-29 15:10:07 |
| | Test Account | `agency-live-mnbwgbqi-4370xxn8@tourbots.ai` | — | True | 2026-03-29 15:14:06 |
| | Test Account | `agency-live-mnbwgzem-xtk9t4oj@tourbots.ai` | — | True | 2026-03-29 15:14:33 |
| | Test Account | `agency-live-mnbwhgky-ehdd1wc8@tourbots.ai` | — | True | 2026-03-29 15:14:55 |
| | Test Account | `agency-live-mnbwhl8f-9hedq0i5@tourbots.ai` | — | True | 2026-03-29 15:15:01 |
| | Test Account | `agency-live-mnbwhp35-e3pc4664@tourbots.ai` | — | True | 2026-03-29 15:15:06 |
| | Test Account | `agency-live-mnbwhrsd-cdhg0x6l@tourbots.ai` | — | True | 2026-03-29 15:15:11 |
| | Test Account | `agency-live-mnbwhva4-f95qdq6v@tourbots.ai` | — | True | 2026-03-29 15:15:14 |
| | Test Account | `agency-live-mnbwjjlq-dg5k1wh5@tourbots.ai` | — | True | 2026-03-29 15:16:33 |
| | Test Account | `agency-live-mnbwl9ph-ixzr3en1@tourbots.ai` | — | True | 2026-03-29 15:17:53 |
| | Test Account | `agency-live-mnbwrc82-jfrlesrr@tourbots.ai` | — | True | 2026-03-29 15:22:39 |
| | Test Account | `agency-live-mnbwtkz1-fcge0s8d@tourbots.ai` | — | True | 2026-03-29 15:24:21 |
| | Test Account | `agency-live-mnbwwjbg-2plejge6@tourbots.ai` | — | True | 2026-03-29 15:26:43 |
| | Test Account | `agency-live-mnbwx8uh-18crxumo@tourbots.ai` | — | True | 2026-03-29 15:27:12 |
| | Test Account | `agency-live-mnbwxcn6-ttdcc7al@tourbots.ai` | — | True | 2026-03-29 15:27:18 |
| | Test Account | `agency-live-mnbwxty2-c1b3wrks@tourbots.ai` | — | True | 2026-03-29 15:27:39 |
| | Test Account | `agency-live-mnbwy0m5-z6fm1kvl@tourbots.ai` | — | True | 2026-03-29 15:27:48 |
| | Test Account | `agency-live-mnbwy6h4-625tifai@tourbots.ai` | — | True | 2026-03-29 15:27:55 |
| | Test Account | `agency-live-mnbwy9aq-3zs2uuh2@tourbots.ai` | — | True | 2026-03-29 15:27:59 |
| | Test Account | `agency-live-mnbwycon-tqx95zl1@tourbots.ai` | — | True | 2026-03-29 15:28:03 |
| | Test Account | `agency-live-mnbyphir-albve143@tourbots.ai` | — | True | 2026-03-29 16:17:31 |
| | Test Account | `agency-live-mnbypu94-ihtk6s9n@tourbots.ai` | — | True | 2026-03-29 16:17:39 |
| | Test Account | `agency-live-mnbypuk0-ej4pozmu@tourbots.ai` | — | True | 2026-03-29 16:17:39 |
| | Test Account | `agency-live-mnbypuk1-jc88gbz3@tourbots.ai` | — | True | 2026-03-29 16:17:39 |
| | Test Account | `agency-live-mnbyq09v-6ohk8fxv@tourbots.ai` | — | True | 2026-03-29 16:17:39 |
| | Test Account | `agency-live-mnbyq2c6-tca08kin@tourbots.ai` | — | True | 2026-03-29 16:17:43 |
| | Test Account | `agency-live-mnbyq2d0-rc3eulxi@tourbots.ai` | — | True | 2026-03-29 16:17:40 |
| | Test Account | `agency-live-mnbz7vlv-nwnb8suz@tourbots.ai` | — | True | 2026-03-29 16:31:45 |
| | Test Account | `agency-live-mnbz7vm8-hdkvcg9i@tourbots.ai` | — | True | 2026-03-29 16:31:45 |
| | Test Account | `agency-live-mnbz7znx-8eua862w@tourbots.ai` | — | True | 2026-03-29 16:31:45 |
| | Test Account | `agency-live-mnbz7zza-nffwkjw1@tourbots.ai` | — | True | 2026-03-29 16:31:45 |
| | Test Account | `agency-live-mnbz7zzc-to9aqc6x@tourbots.ai` | — | True | 2026-03-29 16:31:45 |
| | Test Account | `agency-live-mnbz7zzm-qss3vm5n@tourbots.ai` | — | True | 2026-03-29 16:31:47 |
| | Test Account | `agency-live-mnbz800h-akw8b9y7@tourbots.ai` | — | True | 2026-03-29 16:31:53 |
| | Test Account | `agency-live-mnc0pthg-5nojaisx@tourbots.ai` | — | True | 2026-03-29 17:13:25 |
| | Test Account | `agency-live-mnc0qpq1-5shpekw5@tourbots.ai` | — | True | 2026-03-29 17:14:06 |
| | Test Account | `agency-live-mnc0qxfq-gt33e03k@tourbots.ai` | — | True | 2026-03-29 17:14:16 |
| | Test Account | `agency-live-mnc0r3i7-7jcmblbh@tourbots.ai` | — | True | 2026-03-29 17:14:24 |
| | Test Account | `agency-live-mnc0r7nw-aiihwlu6@tourbots.ai` | — | True | 2026-03-29 17:14:29 |
| | Test Account | `agency-live-mnc0riax-67on2i53@tourbots.ai` | — | True | 2026-03-29 17:14:45 |
| | Test Account | `agency-live-mnc0rnlq-9uvkujtp@tourbots.ai` | — | True | 2026-03-29 17:14:50 |
| | Test Account | `agency-live-mnc0yvji-8au351r5@tourbots.ai` | — | True | 2026-03-29 17:20:30 |
| | Test Account | `agency-live-mnc105cl-ak09k7wp@tourbots.ai` | — | True | 2026-03-29 17:21:26 |
| | Test Account | `agency-live-mnc10mhc-fs04vfn9@tourbots.ai` | — | True | 2026-03-29 17:21:48 |
| | Test Account | `agency-live-mnc1140c-km8b8uhb@tourbots.ai` | — | True | 2026-03-29 17:22:11 |
| | Test Account | `agency-live-mnc11i49-iqmcme2r@tourbots.ai` | — | True | 2026-03-29 17:22:29 |
| | Test Account | `agency-live-mnc11odq-zuc9raxi@tourbots.ai` | — | True | 2026-03-29 17:22:37 |
| | Test Account | `agency-live-mnc122b3-wg1795s4@tourbots.ai` | — | True | 2026-03-29 17:22:55 |
| | Test Account | `agency-live-mnc1d0sj-dvj6p3vq@tourbots.ai` | — | True | 2026-03-29 17:31:28 |
| | Test Account | `agency-live-mnc1denv-d5tgsjs7@tourbots.ai` | — | True | 2026-03-29 17:31:44 |
| | Test Account | `agency-live-mnc1dw7e-ab0wg1bb@tourbots.ai` | — | True | 2026-03-29 17:32:07 |
| | Test Account | `agency-live-mnc1dzmk-osn88ubr@tourbots.ai` | — | True | 2026-03-29 17:32:11 |
| | Test Account | `agency-live-mnc1e2gc-5as5y974@tourbots.ai` | — | True | 2026-03-29 17:32:15 |
| | Test Account | `agency-live-mnc1e55b-os0rpuoy@tourbots.ai` | — | True | 2026-03-29 17:32:19 |
| | Test Account | `agency-live-mnc1eb2u-b0tth6bc@tourbots.ai` | — | True | 2026-03-29 17:32:26 |
| | Test Account | `agency-live-mnc1nrgc-y6wooa40@tourbots.ai` | — | True | 2026-03-29 17:39:49 |
| | Test Account | `agency-live-mnc1o1ha-60jhdsck@tourbots.ai` | — | True | 2026-03-29 17:40:00 |
| | Test Account | `agency-live-mnc1oaop-0zsg6inx@tourbots.ai` | — | True | 2026-03-29 17:40:12 |
| | Test Account | `agency-live-mnc1ougx-s4ttkx12@tourbots.ai` | — | True | 2026-03-29 17:40:38 |
| | Test Account | `agency-live-mnc1ozmr-9zg17f1b@tourbots.ai` | — | True | 2026-03-29 17:40:46 |
| | Test Account | `agency-live-mnc1pfwn-vmqdgnd9@tourbots.ai` | — | True | 2026-03-29 17:41:06 |
| | Test Account | `agency-live-mnc1pnh8-fzmyac8q@tourbots.ai` | — | True | 2026-03-29 17:41:15 |
| | Test Account | `agency-live-mnc26fbi-ugkjz3mu@tourbots.ai` | — | True | 2026-03-29 17:54:20 |
| | Test Account | `agency-live-mrxweqo6-wahx5xou@tourbots.ai` | — | True | 2026-07-23 19:22:38 |
| | Test Account | `agency-live-mrxwez31-v65pmkzc@tourbots.ai` | — | True | 2026-07-23 19:22:45 |
| | Test Account | `agency-live-mrxwf65f-ont7u1uu@tourbots.ai` | — | True | 2026-07-23 19:22:57 |
| | Test Account | `agency-live-mrxwfc6h-5bz5isvq@tourbots.ai` | — | True | 2026-07-23 19:23:02 |
| | Test Account | `agency-live-mrxwfgzm-pgqs1tgb@tourbots.ai` | — | True | 2026-07-23 19:23:08 |
| | Test Account | `agency-live-mrxwfwxs-n9ou8pkj@tourbots.ai` | — | True | 2026-07-23 19:23:28 |
| | Test Account | `agency-live-mrxwg8mt-kdkv9h6e@tourbots.ai` | — | True | 2026-07-23 19:23:45 |
| | Test Account | `agency-live-mrxwiouy-fpocyssf@tourbots.ai` | — | True | 2026-07-23 19:25:40 |
| | Test Account | `agency-live-mrxwjlbf-nulv0txp@tourbots.ai` | — | True | 2026-07-23 19:26:20 |
| | Test Account | `agency-live-mrxwke0a-46pqkv3z@tourbots.ai` | — | True | 2026-07-23 19:26:57 |
| | Test Account | `agency-live-mrxwktqy-b6c2pexg@tourbots.ai` | — | True | 2026-07-23 19:27:18 |
| | Test Account | `agency-live-mrxwkxjj-9o8mhwsk@tourbots.ai` | — | True | 2026-07-23 19:27:22 |
| | Test Account | `agency-live-mrxwlcpu-ey15mqol@tourbots.ai` | — | True | 2026-07-23 19:27:43 |
| | Test Account | `agency-live-mrxwliz7-qiux7wsz@tourbots.ai` | — | True | 2026-07-23 19:27:50 |
| | Test Account | `test@tourbots.ai` | — | True | 2026-03-29 14:42:37 |
| | Tour Agency | `uniqueclient@test.com` | — | True | 2026-07-02 09:30:33 |
| | Tour Bots | `tourbotsai@gmail.com` | — | True | 2026-03-27 22:32:28 |
| | TourBots Agency | `agencyclient@tourbots.ai` | — | True | 2026-06-09 21:02:13 |

## Notes

- `Suggest` is heuristic only — trust your `Decision` column.
- Deleting a venue usually needs cascading cleanup across billing, subscriptions, tours, chatbots, agency portal rows, and Firebase Auth (not just Supabase `users`).
- Do **not** delete Apollo / Apex / core TourBots accounts until explicitly confirmed.

