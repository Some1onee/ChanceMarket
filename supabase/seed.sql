-- ============================================================================
-- ChanceMarket · Demo seed
-- Demo accounts (password for ALL: Demo1234!pass):
--   admin@demo.test · moderator@demo.test · finance@demo.test
--   seller.one@demo.test · seller.two@demo.test
--   alice@demo.test · ben@demo.test · chloe@demo.test
-- All jurisdiction rules are seeded with requires_legal_approval = true —
-- they are conservative placeholders, NOT legal determinations.
-- ============================================================================

-- ── auth users ──────────────────────────────────────────────────────────────
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current
)
values
  ('00000000-0000-0000-0000-000000000000','10000000-0000-4000-8000-000000000001','authenticated','authenticated','admin@demo.test', extensions.crypt('Demo1234!pass', extensions.gen_salt('bf')), now(),'{"provider":"email","providers":["email"]}','{"display_name":"Avery Admin"}', now(), now(), '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000','10000000-0000-4000-8000-000000000002','authenticated','authenticated','moderator@demo.test', extensions.crypt('Demo1234!pass', extensions.gen_salt('bf')), now(),'{"provider":"email","providers":["email"]}','{"display_name":"Morgan Moderator"}', now(), now(), '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000','10000000-0000-4000-8000-000000000003','authenticated','authenticated','finance@demo.test', extensions.crypt('Demo1234!pass', extensions.gen_salt('bf')), now(),'{"provider":"email","providers":["email"]}','{"display_name":"Finley Finance"}', now(), now(), '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000','20000000-0000-4000-8000-000000000001','authenticated','authenticated','seller.one@demo.test', extensions.crypt('Demo1234!pass', extensions.gen_salt('bf')), now(),'{"provider":"email","providers":["email"]}','{"display_name":"Northway Cycles"}', now(), now(), '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000','20000000-0000-4000-8000-000000000002','authenticated','authenticated','seller.two@demo.test', extensions.crypt('Demo1234!pass', extensions.gen_salt('bf')), now(),'{"provider":"email","providers":["email"]}','{"display_name":"Meridian Watches"}', now(), now(), '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000','30000000-0000-4000-8000-000000000001','authenticated','authenticated','alice@demo.test', extensions.crypt('Demo1234!pass', extensions.gen_salt('bf')), now(),'{"provider":"email","providers":["email"]}','{"display_name":"Alice"}', now(), now(), '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000','30000000-0000-4000-8000-000000000002','authenticated','authenticated','ben@demo.test', extensions.crypt('Demo1234!pass', extensions.gen_salt('bf')), now(),'{"provider":"email","providers":["email"]}','{"display_name":"Ben"}', now(), now(), '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000','30000000-0000-4000-8000-000000000003','authenticated','authenticated','chloe@demo.test', extensions.crypt('Demo1234!pass', extensions.gen_salt('bf')), now(),'{"provider":"email","providers":["email"]}','{"display_name":"Chloe"}', now(), now(), '', '', '', '', '');

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, 'email',
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       now(), now(), now()
from auth.users u where u.email like '%@demo.test';

-- ── roles (beyond the default 'user' granted by the signup trigger) ─────────
insert into public.user_roles (user_id, role) values
  ('10000000-0000-4000-8000-000000000001','admin'),
  ('10000000-0000-4000-8000-000000000001','super_admin'),
  ('10000000-0000-4000-8000-000000000002','moderator'),
  ('10000000-0000-4000-8000-000000000003','finance'),
  ('20000000-0000-4000-8000-000000000001','seller'),
  ('20000000-0000-4000-8000-000000000002','seller')
on conflict do nothing;

-- ── profile details ─────────────────────────────────────────────────────────
update public.profiles set country_code = 'GB', subdivision_code = null, city = 'London'
where id in ('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000002');
update public.profiles set country_code = 'GB', city = 'Manchester'
where id = '20000000-0000-4000-8000-000000000002';
update public.profiles set country_code = 'US', subdivision_code = 'CA', city = 'San Diego', currency = 'USD', locale = 'en-US'
where id = '30000000-0000-4000-8000-000000000003';

insert into public.user_private_details (user_id, legal_name, date_of_birth) values
  ('30000000-0000-4000-8000-000000000001','Alice Hartley','1992-04-11'),
  ('30000000-0000-4000-8000-000000000002','Ben Okafor','1988-09-30'),
  ('30000000-0000-4000-8000-000000000003','Chloe Ramirez','1999-01-22'),
  ('20000000-0000-4000-8000-000000000001','Nora Whitfield','1985-06-02'),
  ('20000000-0000-4000-8000-000000000002','Marcus Leigh','1979-12-14')
on conflict (user_id) do update set date_of_birth = excluded.date_of_birth;

-- ── seller profiles ─────────────────────────────────────────────────────────
insert into public.seller_profiles (id, user_id, business_name, entity_type, country_code, status, kyb_status, payout_details_set, terms_accepted_at, public_name, public_bio)
values
  ('40000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Northway Cycles Ltd','company','GB','approved','verified', true, now() - interval '90 days','Northway Cycles','Independent UK bike shop listing premium road and gravel bikes since 2015.'),
  ('40000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','Meridian Watches','individual','GB','approved','verified', true, now() - interval '60 days','Meridian Watches','Curated pre-owned luxury watches, every piece authenticated twice.');

insert into public.identity_verifications (user_id, provider, kind, status) values
  ('20000000-0000-4000-8000-000000000001','mock','kyb','verified'),
  ('20000000-0000-4000-8000-000000000002','mock','identity','verified'),
  ('30000000-0000-4000-8000-000000000001','mock','age','verified');

-- ── jurisdictions (conservative placeholders; ALL require legal approval) ───
insert into public.jurisdictions (id, country_code, subdivision_code, name, is_active, requires_legal_approval, notes) values
  ('50000000-0000-4000-8000-000000000000','GLOBAL', null, 'Global default (deny everything)', false, true, 'Deny-by-default root. Never activate.'),
  ('50000000-0000-4000-8000-000000000001','GB', null, 'United Kingdom', true, true, 'PLACEHOLDER: prize competition / free draw distinctions under Gambling Act 2005 require counsel sign-off.'),
  ('50000000-0000-4000-8000-000000000002','US', null, 'United States (federal baseline)', true, true, 'PLACEHOLDER: sweepstakes only; state rules vary and several states require registration/bonding.'),
  ('50000000-0000-4000-8000-000000000003','US','NY','New York', false, true, 'PLACEHOLDER: excluded pending registration & bonding review.'),
  ('50000000-0000-4000-8000-000000000004','US','FL','Florida', false, true, 'PLACEHOLDER: excluded pending registration & bonding review.');

-- GB: paid competitions with skill + free route; free draws; hybrids
insert into public.jurisdiction_campaign_types
  (jurisdiction_id, campaign_type, is_allowed, free_route_mandatory, skill_required, min_age, max_entry_price_minor, requires_legal_approval)
values
  ('50000000-0000-4000-8000-000000000001','paid_prize_competition', true, false, true, 18, 10000, true),
  ('50000000-0000-4000-8000-000000000001','skill_based_competition', true, false, true, 18, 10000, true),
  ('50000000-0000-4000-8000-000000000001','hybrid_paid_with_free_route', true, true, true, 18, 10000, true),
  ('50000000-0000-4000-8000-000000000001','free_draw', true, false, false, 18, 0, true),
  ('50000000-0000-4000-8000-000000000001','sweepstakes', false, true, false, 18, 0, true);

-- US federal baseline: sweepstakes (no purchase) + free draws only
insert into public.jurisdiction_campaign_types
  (jurisdiction_id, campaign_type, is_allowed, free_route_mandatory, skill_required, min_age, max_entry_price_minor, requires_legal_approval)
values
  ('50000000-0000-4000-8000-000000000002','sweepstakes', true, true, false, 18, 0, true),
  ('50000000-0000-4000-8000-000000000002','free_draw', true, false, false, 18, 0, true),
  ('50000000-0000-4000-8000-000000000002','paid_prize_competition', false, true, false, 18, null, true),
  ('50000000-0000-4000-8000-000000000002','hybrid_paid_with_free_route', true, true, false, 18, 5000, true),
  ('50000000-0000-4000-8000-000000000002','skill_based_competition', false, true, true, 18, null, true);

-- ── categories ──────────────────────────────────────────────────────────────
insert into public.categories (id, slug, name, description, icon, sort_order, requires_extra_review) values
  ('60000000-0000-4000-8000-000000000001','bikes','Bikes','Road, gravel, mountain and e-bikes','bike',10,false),
  ('60000000-0000-4000-8000-000000000002','smartphones','Smartphones','Flagship phones, sealed and warrantied','smartphone',20,false),
  ('60000000-0000-4000-8000-000000000003','computers','Computers','Laptops, desktops and workstations','laptop',30,false),
  ('60000000-0000-4000-8000-000000000004','consoles','Consoles & gaming','Consoles, handhelds and bundles','gamepad-2',40,false),
  ('60000000-0000-4000-8000-000000000005','watches','Watches','Authenticated luxury and micro-brand watches','watch',50,false),
  ('60000000-0000-4000-8000-000000000006','collectibles','Collectibles','Graded cards, art prints and memorabilia','gem',60,true),
  ('60000000-0000-4000-8000-000000000007','furniture','Furniture & design','Design classics and statement pieces','armchair',70,false),
  ('60000000-0000-4000-8000-000000000008','vehicles','Vehicles','Cars and motorbikes (documented transfer workflow)','car',80,true),
  ('60000000-0000-4000-8000-000000000009','property','Property','Real estate — only where jurisdiction + provider allow','home',90,true);

-- GB: everything allowed except property (extra review on vehicles/collectibles)
insert into public.jurisdiction_categories (jurisdiction_id, category_id, is_allowed, requires_extra_review)
select '50000000-0000-4000-8000-000000000001', id, slug <> 'property', requires_extra_review
from public.categories;

-- US baseline: no vehicles/property
insert into public.jurisdiction_categories (jurisdiction_id, category_id, is_allowed, requires_extra_review)
select '50000000-0000-4000-8000-000000000002', id, slug not in ('property','vehicles'), requires_extra_review
from public.categories;

-- ── feature flags ───────────────────────────────────────────────────────────
insert into public.feature_flags (key, enabled, description) values
  ('paid_entries', true, 'Paid entry checkout (mock provider in dev)'),
  ('free_entries', true, 'Free-route entry requests'),
  ('skill_competitions', true, 'Skill question gating'),
  ('seller_onboarding', true, 'New seller applications'),
  ('real_payments', false, 'Live payment provider — NEVER enable without contractual approval');

-- ── campaigns ───────────────────────────────────────────────────────────────
-- C1: GB hybrid paid+free (bike), active, skill required
insert into public.campaigns (id, seller_id, category_id, slug, title, summary, description, campaign_type, status,
  prize_value_minor, currency, entry_price_minor, min_entries_per_order, max_entries_per_order, max_entries_per_user,
  max_entries_total, free_route_enabled, free_route_instructions, skill_question_required, min_age,
  starts_at, ends_at, location_country, location_region, delivery_policy, published_at, attributes)
values (
  '70000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001',
  'aurora-carbon-gravel-bike','Aurora carbon gravel bike — full Ultegra build',
  'A brand-new carbon gravel bike with Shimano Ultegra, carbon wheels and a professional fit session.',
  E'## The prize\n\nA brand-new Aurora carbon gravel frameset built with Shimano Ultegra Di2, carbon wheels, tubeless tyres and a professional bike fit at handover.\n\n- Frame sizes 49–61 available\n- Includes 2-year mechanical warranty\n- Collected from our Manchester workshop or couriered fully insured\n\nProof of ownership and valuation documents were reviewed during moderation.',
  'hybrid_paid_with_free_route','active',
  450000,'GBP',250,1,50,200,4000,
  true, E'Enter for free by first-class post: send an unenclosed postcard with your name, email used on your account and the campaign reference AURORA-GRAVEL to the address on the Free Entry Route page. One request per postcard. Free entries receive identical chances.',
  true, 18,
  now() - interval '10 days', now() + interval '9 days',
  'GB','Greater Manchester',
  'Free insured delivery within the UK within 14 days of winner verification, or collect from the workshop.',
  now() - interval '10 days',
  '{"Frame":"Aurora GX Carbon","Groupset":"Shimano Ultegra Di2","Wheels":"Carbon 45mm","Warranty":"2 years"}'
);

-- C2: GB paid competition (watch), active
insert into public.campaigns (id, seller_id, category_id, slug, title, summary, description, campaign_type, status,
  prize_value_minor, currency, entry_price_minor, min_entries_per_order, max_entries_per_order, max_entries_per_user,
  max_entries_total, free_route_enabled, free_route_instructions, skill_question_required, min_age,
  starts_at, ends_at, location_country, location_region, delivery_policy, published_at, attributes)
values (
  '70000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000002','60000000-0000-4000-8000-000000000005',
  'heritage-chronograph-1968','Heritage chronograph 1968 — fully serviced',
  'A collector-grade 1968 manual-wind chronograph, serviced this year with 12 months warranty.',
  E'## The prize\n\nA 1968 manual-wind chronograph in exceptional condition. Serviced in 2026 by our certified watchmaker; timing sheet included.\n\n- Box and archive extract included\n- 12-month mechanical warranty\n- Insured shipping worldwide where permitted',
  'paid_prize_competition','active',
  680000,'GBP',500,1,25,100,3000,
  true, E'Postal free entry available — see the Free Entry Route page for the address and required details. Reference: HERITAGE-1968.',
  true, 18,
  now() - interval '6 days', now() + interval '2 days',
  'GB','London',
  'Insured tracked shipping within 7 days of winner verification.',
  now() - interval '6 days',
  '{"Year":"1968","Movement":"Manual chronograph","Service":"2026, certified","Warranty":"12 months"}'
);

-- C3: GB free draw (console), active
insert into public.campaigns (id, seller_id, category_id, slug, title, summary, description, campaign_type, status,
  prize_value_minor, currency, entry_price_minor, min_entries_per_order, max_entries_per_order, max_entries_per_user,
  max_entries_total, free_route_enabled, skill_question_required, min_age,
  starts_at, ends_at, location_country, delivery_policy, published_at, attributes)
values (
  '70000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000004',
  'launch-week-console-bundle','Launch-week console bundle — free draw',
  'A current-gen console with two controllers and three games. Completely free to enter.',
  E'## The prize\n\nA current-generation console bundle: two controllers, charging dock and three first-party games, sealed.\n\nThis is a free promotional draw — one entry per member, no purchase of any kind.',
  'free_draw','active',
  55000,'GBP',0,1,1,1,10000,
  false, false, 18,
  now() - interval '3 days', now() + interval '18 days',
  'GB','Free tracked delivery within 10 days of winner verification.',
  now() - interval '3 days',
  '{"Bundle":"Console + 2 controllers + 3 games","Condition":"Sealed"}'
);

-- C4: US sweepstakes (smartphone), active
insert into public.campaigns (id, seller_id, category_id, slug, title, summary, description, campaign_type, status,
  prize_value_minor, currency, entry_price_minor, min_entries_per_order, max_entries_per_order, max_entries_per_user,
  max_entries_total, free_route_enabled, free_route_instructions, skill_question_required, min_age,
  starts_at, ends_at, location_country, delivery_policy, published_at, attributes)
values (
  '70000000-0000-4000-8000-000000000004','40000000-0000-4000-8000-000000000002','60000000-0000-4000-8000-000000000002',
  'flagship-phone-sweepstakes','Flagship smartphone sweepstakes (US)',
  'Win this year''s flagship, sealed with full US warranty. No purchase necessary.',
  E'## The prize\n\nThis year''s flagship smartphone, 512 GB, sealed, with full US warranty.\n\nNO PURCHASE NECESSARY. Open to eligible US residents where permitted; excluded states are listed in the official rules.',
  'sweepstakes','active',
  120000,'USD',0,1,1,1,20000,
  true, 'Enter online at no cost from the campaign page, or by mail as set out in the official rules. Reference: FLAGSHIP-US.',
  false, 18,
  now() - interval '2 days', now() + interval '25 days',
  'US','Free shipping to the 50 US states where eligible.',
  now() - interval '2 days',
  '{"Storage":"512 GB","Condition":"Sealed","Warranty":"US manufacturer"}'
);

-- C4 region exclusions (NY, FL pending registration review)
insert into public.campaign_eligibility_regions (campaign_id, country_code, subdivision_code, mode) values
  ('70000000-0000-4000-8000-000000000004','US','NY','deny'),
  ('70000000-0000-4000-8000-000000000004','US','FL','deny');

-- C5: under review (workstation)
insert into public.campaigns (id, seller_id, category_id, slug, title, summary, campaign_type, status,
  prize_value_minor, currency, entry_price_minor, max_entries_total, free_route_enabled, skill_question_required, min_age,
  starts_at, ends_at, location_country)
values (
  '70000000-0000-4000-8000-000000000005','40000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000003',
  'creator-workstation-build','Creator workstation build — 64GB / RTX',
  'A silent creator workstation: 16-core CPU, 64 GB RAM, RTX GPU, 4 TB NVMe.',
  'hybrid_paid_with_free_route','under_review',
  320000,'GBP',300,2500,true,true,18,
  now() + interval '3 days', now() + interval '33 days','GB'
);

insert into public.moderation_cases (campaign_id, status, risk_score) values
  ('70000000-0000-4000-8000-000000000005','pending', 22);

-- C6: draft (e-bike)
insert into public.campaigns (id, seller_id, category_id, slug, title, summary, campaign_type, status,
  prize_value_minor, currency, entry_price_minor, max_entries_total, free_route_enabled, skill_question_required, min_age, location_country)
values (
  '70000000-0000-4000-8000-000000000006','40000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001',
  'city-ebike-draft','City e-bike — belt drive commuter',
  'Draft listing for a belt-drive commuter e-bike.',
  'hybrid_paid_with_free_route','draft',
  280000,'GBP',200,2000,true,true,18,'GB'
);

-- C7: COMPLETED campaign with a full auditable draw (design chair)
insert into public.campaigns (id, seller_id, category_id, slug, title, summary, description, campaign_type, status,
  prize_value_minor, currency, entry_price_minor, min_entries_per_order, max_entries_per_order, max_entries_per_user,
  max_entries_total, entries_confirmed, free_route_enabled, free_route_instructions, skill_question_required, min_age,
  starts_at, ends_at, closed_at, location_country, delivery_policy, published_at)
values (
  '70000000-0000-4000-8000-000000000007','40000000-0000-4000-8000-000000000002','60000000-0000-4000-8000-000000000007',
  'iconic-lounge-chair-1956','Iconic 1956 lounge chair & ottoman',
  'An authenticated mid-century lounge chair with ottoman, rosewood and leather.',
  'A documented, authenticated mid-century lounge chair and ottoman. Completed campaign kept as a public draw-verification example.',
  'hybrid_paid_with_free_route','completed',
  520000,'GBP',400,1,5,5,5,5,
  true,'Postal route was available during this campaign. Reference: LOUNGE-1956.',true,18,
  now() - interval '40 days', now() - interval '10 days', now() - interval '10 days',
  'GB','White-glove delivery within 21 days of verification.', now() - interval '40 days'
);

-- Official rules for active campaigns
insert into public.campaign_rules_versions (campaign_id, version, language, content_md, is_current)
select id, 1, 'en-GB',
E'# Official rules (TEMPLATE — requires legal review)\n\n1. The promoter is the seller named on the campaign page, trading on the ' ||
'platform.\n2. Entry routes, pricing and the closing date are shown on the campaign page.\n3. Where a free entry route applies, free entries carry identical winning chances.\n4. Entrants must meet the minimum age and residency requirements.\n5. The winner is selected after close by an auditable server-side draw; the draw record is public.\n6. If the provisional winner is ineligible or unreachable for 14 days, a replacement draw from the same snapshot may occur.\n7. Cancellation before the draw refunds all paid entries in full.\n\n*This document is a template pending review by qualified local counsel.*',
true
from public.campaigns
where id in ('70000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000002','70000000-0000-4000-8000-000000000003','70000000-0000-4000-8000-000000000004','70000000-0000-4000-8000-000000000007');

-- Skill questions (C1, C2) — answers live ONLY in skill_question_answers
insert into public.skill_questions (id, campaign_id, version, question, is_current) values
  ('80000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000001',1,'Which component family is fitted to the prize bike''s drivetrain?',true),
  ('80000000-0000-4000-8000-000000000002','70000000-0000-4000-8000-000000000002',1,'A manual-wind chronograph measures elapsed time using which control?',true);

insert into public.skill_question_options (id, question_id, label, sort_order) values
  ('81000000-0000-4000-8000-000000000001','80000000-0000-4000-8000-000000000001','Shimano Ultegra',1),
  ('81000000-0000-4000-8000-000000000002','80000000-0000-4000-8000-000000000001','SRAM Apex',2),
  ('81000000-0000-4000-8000-000000000003','80000000-0000-4000-8000-000000000001','Campagnolo Record',3),
  ('81000000-0000-4000-8000-000000000011','80000000-0000-4000-8000-000000000002','The pushers and central chronograph hand',1),
  ('81000000-0000-4000-8000-000000000012','80000000-0000-4000-8000-000000000002','The date wheel',2),
  ('81000000-0000-4000-8000-000000000013','80000000-0000-4000-8000-000000000002','The rotating bezel only',3);

insert into public.skill_question_answers (question_id, correct_option_id) values
  ('80000000-0000-4000-8000-000000000001','81000000-0000-4000-8000-000000000001'),
  ('80000000-0000-4000-8000-000000000002','81000000-0000-4000-8000-000000000011');

-- Platform fees
insert into public.platform_fees (campaign_id, basis_points, fixed_minor, currency)
select id, 1000, 0, currency from public.campaigns;

-- ── Completed campaign C7: orders, entries, payment, ledger, draw ───────────
insert into public.entry_orders (id, user_id, campaign_id, quantity, unit_price_minor, total_minor, currency, status, source, idempotency_key)
values
  ('90000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000007',2,400,800,'GBP','confirmed','paid','seed-c7-alice'),
  ('90000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000002','70000000-0000-4000-8000-000000000007',2,400,800,'GBP','confirmed','paid','seed-c7-ben'),
  ('90000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000007',1,0,0,'GBP','confirmed','free_route','seed-c7-alice-free');

insert into public.entries (id, campaign_id, user_id, order_id, entry_number, source, status) values
  ('91000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000007','30000000-0000-4000-8000-000000000001','90000000-0000-4000-8000-000000000001',1,'paid','confirmed'),
  ('91000000-0000-4000-8000-000000000002','70000000-0000-4000-8000-000000000007','30000000-0000-4000-8000-000000000001','90000000-0000-4000-8000-000000000001',2,'paid','confirmed'),
  ('91000000-0000-4000-8000-000000000003','70000000-0000-4000-8000-000000000007','30000000-0000-4000-8000-000000000002','90000000-0000-4000-8000-000000000002',3,'paid','confirmed'),
  ('91000000-0000-4000-8000-000000000004','70000000-0000-4000-8000-000000000007','30000000-0000-4000-8000-000000000002','90000000-0000-4000-8000-000000000002',4,'paid','confirmed'),
  ('91000000-0000-4000-8000-000000000005','70000000-0000-4000-8000-000000000007','30000000-0000-4000-8000-000000000001','90000000-0000-4000-8000-000000000003',5,'free_route','confirmed');

insert into public.free_entry_requests (campaign_id, user_id, method, status, processed_at, order_id, details) values
  ('70000000-0000-4000-8000-000000000007','30000000-0000-4000-8000-000000000001','postal','accepted', now() - interval '15 days','90000000-0000-4000-8000-000000000003','{"reference":"LOUNGE-1956"}');

insert into public.payment_transactions (id, user_id, order_id, provider, provider_intent_id, amount_minor, currency, status, idempotency_key)
values
  ('92000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','90000000-0000-4000-8000-000000000001','mock','mock_pi_seed_1',800,'GBP','succeeded','seed-pt-1'),
  ('92000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000002','90000000-0000-4000-8000-000000000002','mock','mock_pi_seed_2',800,'GBP','succeeded','seed-pt-2');

update public.entry_orders set payment_transaction_id = '92000000-0000-4000-8000-000000000001' where id = '90000000-0000-4000-8000-000000000001';
update public.entry_orders set payment_transaction_id = '92000000-0000-4000-8000-000000000002' where id = '90000000-0000-4000-8000-000000000002';

insert into public.financial_ledger (entry_type, account, account_ref, campaign_id, payment_transaction_id, amount_minor, currency, memo, idempotency_key) values
  ('entry_payment','seller','40000000-0000-4000-8000-000000000002','70000000-0000-4000-8000-000000000007','92000000-0000-4000-8000-000000000001', 800,'GBP','2 paid entries (Alice)','seed-fl-1'),
  ('platform_fee','seller','40000000-0000-4000-8000-000000000002','70000000-0000-4000-8000-000000000007','92000000-0000-4000-8000-000000000001', -80,'GBP','10% platform fee','seed-fl-2'),
  ('platform_fee','platform', null,'70000000-0000-4000-8000-000000000007','92000000-0000-4000-8000-000000000001', 80,'GBP','10% platform fee','seed-fl-3'),
  ('entry_payment','seller','40000000-0000-4000-8000-000000000002','70000000-0000-4000-8000-000000000007','92000000-0000-4000-8000-000000000002', 800,'GBP','2 paid entries (Ben)','seed-fl-4'),
  ('platform_fee','seller','40000000-0000-4000-8000-000000000002','70000000-0000-4000-8000-000000000007','92000000-0000-4000-8000-000000000002', -80,'GBP','10% platform fee','seed-fl-5'),
  ('platform_fee','platform', null,'70000000-0000-4000-8000-000000000007','92000000-0000-4000-8000-000000000002', 80,'GBP','10% platform fee','seed-fl-6');

select public.refresh_seller_balance('40000000-0000-4000-8000-000000000002','GBP');

-- The auditable draw for C7. Snapshot hash computed with the SAME canonical
-- formula used by create_draw_snapshot(); winner index derived from the
-- recorded seed with the SAME formula as select_draw_winner().
insert into public.draws (id, campaign_id, public_id, status, selection_method, random_seed, random_seed_hash, selected_at, winner_entry_id)
values (
  '93000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000007','DRW-2026-000042','winner_verified','csprng',
  '5f8a3d2c9b1e4f6a8c0d2e4f6a8b0c1d',
  encode(extensions.digest(decode('5f8a3d2c9b1e4f6a8c0d2e4f6a8b0c1d','hex'),'sha256'),'hex'),
  now() - interval '9 days',
  -- index = (0x5f8a3d2c9b1e4f6a mod 5) + 1 = 4 → entry_number 4 (Ben)
  '91000000-0000-4000-8000-000000000004'
);

insert into public.draw_snapshots (id, draw_id, campaign_id, entries_count, snapshot_hash, rules_version_id)
select
  '94000000-0000-4000-8000-000000000001','93000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000007',5,
  encode(extensions.digest((
    select string_agg(t.pos || ':' || t.id, E'\n' order by t.pos)
    from (
      select row_number() over (order by e.entry_number) as pos, e.id
      from public.entries e
      where e.campaign_id = '70000000-0000-4000-8000-000000000007' and e.status = 'confirmed'
    ) t
  ), 'sha256'), 'hex'),
  (select id from public.campaign_rules_versions where campaign_id = '70000000-0000-4000-8000-000000000007' and is_current limit 1);

update public.draws set snapshot_id = '94000000-0000-4000-8000-000000000001' where id = '93000000-0000-4000-8000-000000000001';

insert into public.draw_entries (snapshot_id, entry_id, position)
select '94000000-0000-4000-8000-000000000001', e.id, row_number() over (order by e.entry_number)
from public.entries e
where e.campaign_id = '70000000-0000-4000-8000-000000000007' and e.status = 'confirmed';

insert into public.winner_verifications (draw_id, entry_id, user_id, status, verified_by, notes)
values ('93000000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000002','verified','10000000-0000-4000-8000-000000000001','Demo verification.');

insert into public.prize_fulfilments (draw_id, campaign_id, winner_user_id, status, notes)
values ('93000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000007','30000000-0000-4000-8000-000000000002','received_confirmed','Delivered and confirmed. Demo data.');

insert into public.audit_logs (actor_id, event, subject_type, subject_id, data) values
  (null,'draw_snapshot_created','draw','93000000-0000-4000-8000-000000000001','{"seed_note":"demo"}'),
  (null,'draw_winner_selected','draw','93000000-0000-4000-8000-000000000001','{"index":4,"seed":"5f8a3d2c9b1e4f6a8c0d2e4f6a8b0c1d"}'),
  (null,'draw_winner_confirmed','draw','93000000-0000-4000-8000-000000000001','{}');

-- ── live activity on active campaigns ───────────────────────────────────────
insert into public.entry_orders (id, user_id, campaign_id, quantity, unit_price_minor, total_minor, currency, status, source, idempotency_key)
values
  ('90000000-0000-4000-8000-000000000011','30000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000001',10,250,2500,'GBP','confirmed','paid','seed-c1-alice'),
  ('90000000-0000-4000-8000-000000000012','30000000-0000-4000-8000-000000000002','70000000-0000-4000-8000-000000000001',6,250,1500,'GBP','confirmed','paid','seed-c1-ben'),
  ('90000000-0000-4000-8000-000000000013','30000000-0000-4000-8000-000000000002','70000000-0000-4000-8000-000000000003',1,0,0,'GBP','confirmed','free_route','seed-c3-ben');

insert into public.entries (campaign_id, user_id, order_id, entry_number, source, status)
select '70000000-0000-4000-8000-000000000001'::uuid,'30000000-0000-4000-8000-000000000001'::uuid,'90000000-0000-4000-8000-000000000011'::uuid, g, 'paid'::public.entry_source,'confirmed'::public.entry_status from generate_series(1,10) g
union all
select '70000000-0000-4000-8000-000000000001'::uuid,'30000000-0000-4000-8000-000000000002'::uuid,'90000000-0000-4000-8000-000000000012'::uuid, 10+g, 'paid'::public.entry_source,'confirmed'::public.entry_status from generate_series(1,6) g
union all
select '70000000-0000-4000-8000-000000000003'::uuid,'30000000-0000-4000-8000-000000000002'::uuid,'90000000-0000-4000-8000-000000000013'::uuid, 1, 'free_route'::public.entry_source,'confirmed'::public.entry_status;

update public.campaigns set entries_confirmed = 16 where id = '70000000-0000-4000-8000-000000000001';
update public.campaigns set entries_confirmed = 1 where id = '70000000-0000-4000-8000-000000000003';

insert into public.favorites (user_id, campaign_id) values
  ('30000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000002'),
  ('30000000-0000-4000-8000-000000000002','70000000-0000-4000-8000-000000000001');

insert into public.campaign_questions (campaign_id, user_id, question, answer, answered_at, is_public) values
  ('70000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000002','Can the bike be shipped to Northern Ireland?','Yes — fully insured courier to all of the UK including NI.', now() - interval '2 days', true),
  ('70000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','Does the watch come with its original bracelet?','It comes on a period-correct leather strap; the original bracelet is included in the box.', now() - interval '1 day', true);

insert into public.notifications (user_id, kind, title, body, href) values
  ('30000000-0000-4000-8000-000000000001','entry_confirmed','Entry confirmed','Your 10 entries for the Aurora gravel bike are confirmed.','/account/entries'),
  ('30000000-0000-4000-8000-000000000002','winner_confirmed','You won!','You are the verified winner of the 1956 lounge chair.','/account/entries'),
  ('20000000-0000-4000-8000-000000000001','campaign_approved','Campaign approved','Aurora carbon gravel bike is now live.','/seller');
