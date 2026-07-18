-- 69_crm_seed.sql
-- Seed crm_companies with the UK VR/360 tour agency prospect list.
-- Source: UK VR Tour Prospect List spreadsheet (company name, phone/contact, region, notes, outreach status).
--
-- Mapping notes:
-- - The spreadsheet's "Contact" column is a phone number (or "Enquire via website"), not a
--   personal name — no first_name/last_name is available for this list, so both are left null
--   and company_name is relied on, per the original build spec.
-- - Where "Contact" was "Enquire via website" (no phone number), phone is left null and that
--   fact is folded into notes_summary instead.
-- - "Outreach Status" of "Not Started" maps to status 'not_started'. Apollo 3D is flagged as an
--   existing partner to exclude from cold outreach, so it is seeded as 'dormant' rather than
--   'not_started' — adjust if a different status is preferred.
--
-- Idempotent: safe to re-run, skips any company_name that already exists (case-insensitive).

insert into public.crm_companies (company_name, phone, region, notes_summary, source, status)
select v.company_name, v.phone, v.region, v.notes_summary, 'UK VR Tour Prospect List', v.status
from (
  values
    ('360 View Spatial Data and Virtual Tours', '+44 20 3103 9980', 'Greater London', 'Matterport, London E1W', 'not_started'),
    ('Biztour 360 Virtual Tours', '+44 330 122 2334', 'Greater London', 'Matterport, commercial/venue focus', 'not_started'),
    ('360 Business Photographer (Simon)', '+44 20 7123 7960', 'Greater London', 'Also trades as 360 Virtual Tour Co, Woking', 'not_started'),
    ('Future Virtual Tours', '+44 7736 938267', 'Greater London', 'London W1K', 'not_started'),
    ('Eye Revolution', '+44 20 3603 0231', 'Greater London', 'Virtual showroom/gallery specialist', 'not_started'),
    ('Images for Industry', '+44 20 8123 9360', 'Greater London', 'Matterport specialist, Kingston upon Thames', 'not_started'),
    ('Virtual Tours Online', '+44 20 3951 8522', 'Greater London', 'London W1J', 'not_started'),
    ('360 Provision Media', '+44 7305 038825', 'Greater London', 'Commercial/automotive/hospitality 360 tours', 'not_started'),
    ('Look In 360 Virtual Tours', '+44 7766 664766', 'South East', 'East Grinstead, with video chat feature', 'not_started'),
    ('Three6tee Virtual Tours', '+44 7760 379673', 'South East', 'Dartford, Kent', 'not_started'),
    ('360Tour Guide', '+44 7427 264537', 'South East', 'Guildford, Surrey', 'not_started'),
    ('Future World 3D', '+44 7747 690802', 'South East', 'Petersfield, Matterport, larger properties', 'not_started'),
    ('Perception Studios UK', '+44 7976 625746', 'South East', 'Andover, video + virtual content', 'not_started'),
    ('SVV Media', '+44 7709 546244', 'South East', 'Southampton, property + virtual tours', 'not_started'),
    ('Virtronix', null, 'South East', 'Enquire via website. Hatfield, Herts, University Enterprise Hub', 'not_started'),
    ('360 Visual Media', '+44 7961 822336', 'South East', 'Buckingham, property + Google Business specialist', 'not_started'),
    ('Future Virtual Ltd', '+44 7736 938267', 'South East', 'Brighton, venue/retail Matterport specialist', 'not_started'),
    ('StreetVisit', '+44 1273 900056', 'South East', 'Brighton, Google Street View + 360 specialist', 'not_started'),
    ('Property Photographers UK', '+44 7871 280347', 'South East', 'Peacehaven, property photography + 3D tours', 'not_started'),
    ('360image Photography and Virtual Tours', '+44 7952 809043', 'South East', 'Warminster, schools/venues, excellent reviews', 'not_started'),
    ('Immersive Walkthroughs Ltd', '+44 1727 537197', 'South East', 'Harpenden, commercial spaces specialist', 'not_started'),
    ('Oxford Virtual Tours', '+44 1865 570710', 'South East', 'Kidlington, letting agency/property specialist', 'not_started'),
    ('The Virtual Tour Company (Virtual Devon)', '+44 1392 348181', 'South West', 'Sidmouth, strong university/venue client base', 'not_started'),
    ('360 Virtual Tours (Bristol)', '+44 117 911 0430', 'South West', 'Hanham, Bristol', 'not_started'),
    ('Vu360 Virtual Tours', '+44 117 230 3330', 'South West', 'Bristol, arts/museum focus', 'not_started'),
    ('PointView 3D Ltd', '+44 7825 711650', 'South West', 'Thornbury, Bristol, digital twin/commercial', 'not_started'),
    ('OWL VR', '+44 117 973 2121', 'South West', 'Bristol, immersive video + 360', 'not_started'),
    ('Immersive 360', '+44 7909 448071', 'South West', 'Taunton, Matterport, CAD export capability', 'not_started'),
    ('Virtual 360 Tours Glos Ltd', '+44 7973 419933', 'South West', 'Gloucester, showroom focus', 'not_started'),
    ('360 South West Ltd', '+44 7834 237841', 'South West', 'Taunton, events + property', 'not_started'),
    ('Essex Virtual Tours', '+44 7523 632125', 'East of England', 'Southend-on-Sea', 'not_started'),
    ('360 Essex', '+44 1268 510797', 'East of England', 'Leigh-on-Sea, Southend area', 'not_started'),
    ('Virtual Venue Tours', '+44 1727 400443', 'East of England', 'St Albans, Herts', 'not_started'),
    ('The 360 View Service Ltd', '+44 7737 991759', 'East of England', 'Bedford, 3D video tours, 4+ years trading', 'not_started'),
    ('Venue View', '+44 1442 767877', 'East of England', 'Tring, strong venue/showroom/marine client base', 'not_started'),
    ('Glimpse Agency', '+44 121 405 9050', 'West Midlands', 'Birmingham, healthcare/real estate Matterport', 'not_started'),
    ('Matt Madden Visuals', '+44 7876 022498', 'West Midlands', 'Leamington Spa', 'not_started'),
    ('Visually Virtual', '+44 7977 110715', 'West Midlands', 'Coventry, property/new-build specialist', 'not_started'),
    ('The Virtually There Company', '+44 20 3337 3360', 'West Midlands', 'Telford, Google 360 + headshots', 'not_started'),
    ('Virtual Media Pro', '+44 7521 001965', 'West Midlands', 'Worcester, holiday let specialist', 'not_started'),
    ('Virtual 2 Reality', '+44 7787 160114', 'East Midlands', 'Nottingham (also broader business support)', 'not_started'),
    ('Chris Gothorp Photography', '+44 7498 728439', 'East Midlands', 'Lincoln, property photography + virtual staging', 'not_started'),
    ('Peter Alvey Photographer', '+44 7973 747957', 'East Midlands', 'Market Harborough, 360 virtual tour + photography', 'not_started'),
    ('360 Imagery', '+44 7816 839750', 'East Midlands', 'Burton-on-Trent', 'not_started'),
    ('360 Virtual View (Photography, Tours & Drone)', '+44 114 383 0711', 'Yorkshire & Humber', 'Sheffield, B&B/holiday accommodation focus', 'not_started'),
    ('Apollo 3D', '+44 113 418 2581', 'Yorkshire & Humber', 'Otley - existing partner, exclude from cold outreach', 'dormant'),
    ('Peeper - Virtual Property', null, 'Yorkshire & Humber', 'Enquire via website. Otley, commercial premises specialist', 'not_started'),
    ('Zeus 360 Virtual Tours', '+44 7977 502952', 'North West', 'Manchester (Atherton), web design + virtual tours', 'not_started'),
    ('I See You Online Ltd', '+44 1704 553723', 'North West', 'Southport, multi-site UK coverage, overlay content', 'not_started'),
    ('360 Virtual Tours Manchester', '+44 7740 181493', 'North West', 'Manchester', 'not_started'),
    ('The Inside View Virtual Tour Photography', '+44 7966 398805', 'North West', 'Stretford, Manchester', 'not_started'),
    ('Virtual Tour 3D', '+44 1200 438320', 'North West', 'Clitheroe, Lancashire', 'not_started'),
    ('Cre8te 360', '+44 7852 292107', 'North West', 'Longridge, Preston, blue-chip client work', 'not_started'),
    ('Virtual Tours North East', '+44 7799 435486', 'North East', 'Newcastle, school/charity/public sector focus', 'not_started'),
    ('Newcrest 360', '+44 1642 942012', 'North East', 'Stockton-on-Tees, strong SEO/views uplift case studies', 'not_started'),
    ('Move 360', '+44 800 471 4888', 'North East', 'Stockton-on-Tees', 'not_started'),
    ('Virtual Deja Vu 360 Interactive Tours', '+44 7748 438631', 'North East', 'Whitby', 'not_started'),
    ('Clyde Digital', '+44 7515 384730', 'Scotland', 'Glasgow, property + drone + 3D scanning', 'not_started'),
    ('Letzee', '+44 7866 379096', 'Wales', 'Swansea, student accommodation specialist', 'not_started'),
    ('Virtual Inc', '+44 29 2264 8655', 'Wales', 'Cardiff', 'not_started'),
    ('virtual viewings', null, 'Wales', 'Enquire via website. Swansea', 'not_started'),
    ('Virtual Tour Specialists', '+44 333 358 0433', 'Wales', 'Colwyn Bay, North Wales', 'not_started'),
    ('360Spaces Virtual Tour Photography', '+44 7960 044486', 'Northern Ireland', 'Belfast, Google Business focus', 'not_started'),
    ('3D Digital Twins - Digital Strada', '+44 20 3432 3239', 'Northern Ireland', 'Belfast, Matterport digital twin consultancy', 'not_started')
) as v(company_name, phone, region, notes_summary, status)
where not exists (
  select 1
  from public.crm_companies c
  where lower(c.company_name) = lower(v.company_name)
);
