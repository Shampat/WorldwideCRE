# WorldwideCRE Product Blueprint

## 1. Product

AI-powered commercial real estate marketplace.

Brand: WorldwideCRE
Domain: worldwidecre.com
Launch country: Canada
Future markets: USA, India, UAE, Australia

## 2. User Types

- Owner
- Commercial Agent / Realtor
- Developer
- Builder
- Property Manager
- Condo Corporation
- Authorized Representative

One account may have multiple roles or relationships.

Concept:

User -> Role/Relationship -> Listing -> Property

## 3. Core Data Model

Separate these entities:

- User
- Property / Building
- Project
- Unit
- Listing
- Media
- Documents
- Payment
- Saved Search
- Notification
- Report
- Audit/Event
- Trust/Risk signals

Typical relationships:

Building -> Unit -> Listing -> User

Standalone:

Property -> Listing -> User

Projects:

Project -> Building -> Units -> Listings -> Representatives

Physical properties persist when representatives change.

## 4. Listing Lifecycle

Statuses:

- Draft
- Under Review
- Active
- Pending
- Sold
- Leased
- Withdrawn
- Expired
- Flagged

Normal lifecycle:

Draft -> Under Review -> Active

At approximately 30 days:
availability confirmation.

At 7 days before expiry:
renewal reminder.

At 90 days:
automatic expiry unless renewed.

Sold/Leased/Withdrawn:
remove from normal active search immediately.

Historical records remain internally.

## 5. Listing Creation

Guided workflow:

1. Transaction and property type
2. Property/building/location
3. Property details
4. Financial information
5. Description and AI assistance
6. Photos/media/documents
7. Representative/contact
8. Review and AI checks
9. Payment and publication

Drafts autosave.

Maximum 12 listing images.

Virtual tours may be provided by URL.

## 6. Property Categories

Office:
- Office building
- Office condo
- Medical office
- Professional office

Retail:
- Retail unit
- Strip plaza
- Shopping centre
- Standalone retail
- Restaurant
- Gas station / convenience

Industrial:
- Warehouse
- Industrial building
- Manufacturing
- Flex
- Distribution/logistics

Hospitality:
- Hotel
- Motel
- Resort
- Other hospitality

Investment:
- Apartment/multi-unit investment
- Student housing
- Senior living
- Other commercial investment

Land:
- Commercial land
- Industrial land
- Development land
- Agricultural/investment land
- Vacant land
- Mixed-use development site

Specialized:
- Development project
- Mixed-use
- Self-storage
- Automotive
- Gas station
- Marina
- Golf property
- Religious/institutional
- Other commercial

## 7. Project / Inventory

Developers and builders can create projects containing units.

Features:

- Project dashboard
- Inventory manager
- Unit numbers
- Duplicate unit-number validation
- Bulk upload
- Validation before publication
- Unit filtering
- Project page
- Inventory credits

Example:

ABC Business Centre
48 units
31 active
8 ready to publish
9 sold/leased

## 8. Location Privacy

Three public modes:

1. Exact Location
2. Approximate Location
3. Confidential Location

Approximate location should use a privacy-safe map position.

Confidential listings can show city/area and useful search context without exposing the exact address.

Professional warning:

**Contact representative before visiting the property.**

## 9. Trust System

Trust is layered.

Person signals:
- Email verification
- Phone verification when enabled
- Company/professional information

Listing signals:
- Location consistency
- Duplicate detection
- Image analysis
- Price anomalies
- Suspicious content
- Document consistency

Behavior:
- Account history
- Listing freshness
- Reports
- Policy violations
- Responsiveness
- Successful history

Trust Score example:

87/100

Always accompanied by:

**Based on account, listing and activity signals. This score is not a guarantee of authenticity.**

Payment never increases trust.

## 10. Image Rights

Every uploader confirms:

**I confirm that I have the right or permission to publish these images on WorldwideCRE.**

AI may flag:

- MLS/board watermarks
- Agency/platform logos
- Copyright notices
- Photographer marks
- URLs
- Screenshots
- Duplicates
- Suspicious manipulation

Flagging language must be neutral.

Users replace only problematic images.

## 11. Smart Image Duplication

Common-building media may legitimately appear across multiple units.

Examples:
- Exterior
- Lobby
- Parking
- Amenities
- Elevators
- Common areas
- Building views

AI should distinguish common-building media from suspicious reuse of unit-specific media.

Never automatically accuse a user of wrongdoing based only on duplicate images.

## 12. Search

Structured search fields:

- Country
- Province/state
- City
- Property type
- Sale/lease
- Price
- Size
- Verified/trust signals
- Other property-specific attributes

Natural-language search example:

10,000 sq ft warehouse in Mississauga under $4M

AI extracts structured criteria while retaining broader intent.

Search should first return exact matches.

If insufficient:

show nearby/close matches and explicitly state what changed.

Example:

No exact matches in Mississauga. We found 4 nearby properties in Brampton that match your size and budget.

## 13. Nearby Search

Nearby expansion considers:

- Geographic distance
- Property type
- Size
- Price
- User intent
- Active inventory
- Market relevance

Never silently alter search criteria.

## 14. Saved Searches

Alert frequencies:

- Instant
- Daily
- Weekly

Features:

- AI match scores
- New-property alerts
- Useful change alerts
- No empty/noise emails

Searcher identity is not exposed to representatives unless the user contacts them.

## 15. Public Listing Page

Components:

- Transaction status
- Title
- Location
- Price
- Photo gallery
- Virtual tour
- Location confidence
- Property facts
- Financial details
- AI summary
- AI match explanation
- Representative profile
- Call
- WhatsApp
- Email
- Contact Representative
- Privacy warning where applicable
- Trust/freshness signals
- Similar properties

AI must not invent missing facts.

## 16. Building Intelligence

Buildings may have a shared profile.

Example:

ABC Business Centre

Available Units:
- 101 — 1,800 sf — Available
- 205 — 2,300 sf — Available
- 410 — 3,100 sf — Leased
- 510 — 1,500 sf — Available

Common building information and media can be reused appropriately.

AI may identify likely related buildings, but must not automatically merge physical properties.

## 17. AI Features

Initial/roadmap capabilities:

1. Listing Assistant
2. Document Reader
3. Stale Listing Detection
4. Buyer Matching
5. Pricing Insights
6. Deal Summary
7. Document Vault
8. Lead Qualification
9. Trust/Freshness scoring
10. Image rights and context analysis
11. Natural-language search
12. Building intelligence

AI-generated information must be clearly labelled and reviewable.

## 18. Lead Privacy

WorldwideCRE facilitates connections; it does not own the customer relationship.

Direct contact:

Buyer -> Representative

Methods:
- Phone
- WhatsApp
- Email
- Contact form

Platform may collect anonymous/aggregate events:

- Views
- Phone clicks
- WhatsApp clicks
- Email inquiries
- Contact actions
- Saves
- Source attribution

Individual lead identities are not sold or exposed by default.

Admin access to individual leads is restricted to legitimate technical, security, legal, or exceptional operational needs.

## 19. Pricing

Free account.

Standard:
$49 CAD / 90 days.

Featured:
$99 CAD / 90 days, provisional.

Future:
- Bulk listing packages
- Listing credits
- Brokerage plans
- Enterprise
- Premium intelligence
- Carefully selected advertising
- API/data services

Pricing may vary by future market and product evolution.

## 20. Payments

Stripe initially.

Payment methods may include:
- Cards
- Apple Pay
- Google Pay

Checkout:
- Listing preview
- Price
- Tax
- Refund terms
- Rights/accuracy confirmation
- Payment

After successful payment:
- Publish
- Receipt/invoice
- Confirmation email

Failed payment preserves the draft.

Refund:
7-day request window, manual review.

## 21. Notifications

Seller/representative:
- Listing submitted
- Published
- Needs attention
- 30-day freshness confirmation
- Expiring in 7 days
- Expired
- Renewal confirmation

Buyer:
- Saved-search match
- Instant/daily/weekly alerts
- Account/security notices

Email first.

SMS/Twilio later.

## 22. Dashboard

User dashboard:

- Active listings
- Expiring soon
- Contact actions
- Saved searches
- Inventory credits
- List Property
- Manage Inventory
- Analytics
- Profile

Developer dashboard emphasizes projects and inventory.

Admin dashboard:
- Users
- Listings
- AI flags
- Reports
- Payments
- Expiring listings
- Revenue
- Country statistics
- Trust/risk signals
- Projects/inventory
- System health

## 23. Homepage

Hero:

**Commercial Property Worldwide. Find it. List it. Discover it.**

Natural-language search.

Primary CTA:
Search Commercial Property

Secondary CTA:
List Your Property

Trust signals:
- Fresh listings
- AI-assisted review
- Verified contact information
- Privacy-controlled locations
- Commercial property only

Additional sections:
- Featured properties
- Demo showcase
- Property types
- Popular markets
- AI search explanation
- List-your-property CTA

## 24. SEO

SEO-first architecture.

Automatic pages for:

- Countries
- Provinces/states
- Cities
- Property types
- Property-type + city combinations
- Commercial terms
- Projects/buildings
- Individual listings where appropriate

Human-readable URLs.

Automatic sitemap generation.

Dynamic internal linking.

Nearby-market links based on relevance and inventory.

Commercial Terms knowledge centre:
- Cap Rate
- NOI
- Triple Net Lease
- CAM
- Zoning
- Easement
- Clear Height
- Loading Dock
- Commercial Condo
- Other useful CRE terms

## 25. Country Architecture

Country configuration controls:

- Currency
- Measurement units
- Tax rules
- Disclaimers
- Address formats
- Local fields
- Regulatory considerations

Initial examples:

Canada: CAD, sq ft
USA: USD, sq ft
India: INR, sq ft
UAE: AED, sq m
Australia: AUD, sq m

Approximate currency conversions must be clearly labelled.

English first; multilingual support later.

## 26. Anti-Stale Engine

Core marketplace automation:

- 30-day confirmation
- 7-day renewal reminder
- 90-day expiry
- Sold/leased removal
- AI inactivity signals
- Duplicate monitoring
- Report escalation
- Representative inactivity monitoring

Objective:

**An Active listing should mean something.**

## 27. Marketplace Intelligence

Use anonymized/aggregated demand signals to improve:

- Search
- Recommendations
- SEO
- Property fields
- Market insights
- Future market intelligence

Never expose individual searcher identities.

## 28. Demo Inventory

Launch with clearly labelled fictional demonstration properties.

Demo listings must never be presented as real properties.

AI-generated images may be used for demos.

Replace demo inventory progressively as real listings arrive.

## 29. Technology Direction

Preferred architecture:

- Next.js / React
- TypeScript
- Tailwind CSS
- Supabase / PostgreSQL
- Vercel
- Cloudflare
- Mapbox
- Stripe

Future/optional:
- Twilio
- Redis
- AWS
- Additional payment providers

No WordPress/Wix/Webflow dependency.

## 30. Development Philosophy

Build a true SaaS platform.

Priorities:

1. Simple UX
2. Automation
3. Trust
4. Fresh inventory
5. Search quality
6. Global-ready architecture
7. Low owner involvement
8. Security and privacy
9. Maintainability
10. Scalability

Do not build unnecessary features simply because competitors have them.

Every feature should answer:

**Does this make WorldwideCRE simpler, better, safer, more useful, or more automated?**


## 31. Architecture Amendments — Pre-Development

## 31.1 Organization Layer

Support both individual users and professional organizations.

Core relationship:

User → Organization → Role → Listing

Organizations may represent brokerages, development companies, property managers, builders, condo corporations, or other commercial real estate businesses.

A user may belong to multiple organizations and may have different roles within each organization.

The organization layer must support future permissions, team management, billing, branding, and enterprise accounts.

## 31.2 Contact Profile Separation

Contact information must be separated from authentication identity.

Core relationship:

User → Contact Profile → Listing

A Contact Profile contains the public professional contact information used on listings.

This prevents changes to a user's personal account information from unintentionally altering historical listing records.

Listings should preserve historical contact/representative information through listing versions or snapshots where appropriate.

## 31.3 Listing Versioning and Audit History

Important listing changes must be historically traceable.

Track changes to:

- price
- status
- location/privacy level
- description
- property details
- media
- documents
- representatives
- AI review results
- verification/trust signals
- ownership/representation declarations

Audit records should capture:

- who made the change
- when it happened
- what changed
- previous value where appropriate
- new value where appropriate
- relevant system/AI action

Audit history is append-oriented and should not be treated as ordinary editable listing data.

## 31.4 Moderation Architecture

Moderation is a first-class system.

Pipeline:

AI Check → Risk Assessment → Moderation Queue → Human Decision

Possible outcomes:

- Pass
- Needs Attention
- Restricted
- Rejected
- Suspended

AI may identify risk and recommend an action, but AI is not the final authority for important enforcement decisions.

Moderation must support listings, images, documents, reports, users, and other relevant marketplace content.

## 31.5 Search Architecture

PostgreSQL remains the initial source of truth.

Initial search capabilities should use:

- structured database filtering
- PostgreSQL full-text search
- PostGIS geographic search
- vector/semantic search where useful
- relevance/ranking logic

A separate search engine or search cluster should only be introduced when actual scale or performance demonstrates the need.

Search indexing must respond to important listing lifecycle events such as publication, update, expiry, suspension, sale, and lease.

## 31.6 Background Jobs

The platform requires durable background processing for tasks such as:

- 30-day availability confirmations
- 7-day expiry reminders
- automatic listing expiry
- saved-search alerts
- AI processing
- image analysis
- document extraction
- sitemap updates
- email delivery
- analytics aggregation
- trust/risk recalculation
- search index updates

Jobs must be retryable and should not depend on a user keeping a browser window open.

## 31.7 Internal Event Architecture

Important system actions should generate internal events.

Examples:

- listing.created
- listing.submitted
- listing.published
- listing.updated
- listing.expired
- listing.sold
- listing.leased
- listing.reported
- payment.completed
- payment.refunded
- search.saved
- document.uploaded

Events can trigger downstream actions such as notifications, search updates, analytics, AI processing, moderation, and saved-search matching.

The initial implementation should favor a simple durable event/outbox pattern rather than a distributed event platform.

## 31.8 Simplicity Rule

Do not introduce microservices, Redis, a separate search cluster, or additional infrastructure unless a demonstrated product, scale, reliability, or performance requirement justifies it.

The initial architecture should remain a modular monolith with a strong PostgreSQL foundation.

