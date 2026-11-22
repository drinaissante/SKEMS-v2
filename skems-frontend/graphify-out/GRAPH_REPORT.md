# Graph Report - skems-frontend  (2026-11-22)

## Corpus Check
- 224 files · ~64,871 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 2, .xml 2, .css 2)

## Summary
- 814 nodes · 2257 edges · 41 communities (26 shown, 15 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- App Core & Routing
- Shared UI Components
- Grading Form Fields
- Admin Management & Approvals
- Modals & Toast Utilities
- Discord Serverless Endpoints
- Build & Lint Config
- App Persistence & Recovery
- Layout & Navigation Shell
- Borrowed Items Cards
- Scan & Form Parsing
- Notification System
- Database Schema & Policies
- Tauri Rust Core
- Public Site & Members
- TypeScript App Config
- TypeScript Node Config
- Guided Tour System
- Tauri Bundle Config
- Production Dependencies
- Google Sheets Export
- TypeScript Base Config
- Vite Build Toolchain
- Vercel Runtime Config
- NPM Scripts
- Tauri Capabilities
- App Shell Docs
- Audit Log Schema
- TSConfig Project References
- Vite Env Types
- Tauri Package

## God Nodes (most connected - your core abstractions)
1. `react` - 67 edges
2. `useAuth()` - 53 edges
3. `usePageTitle()` - 49 edges
4. `App()` - 45 edges
5. `react-router-dom` - 31 edges
6. `useToast()` - 31 edges
7. `react-icons` - 30 edges
8. `@tanstack/react-query` - 28 edges
9. `BorrowedPage()` - 28 edges
10. `EventCoveragePage()` - 27 edges

## Surprising Connections (you probably didn't know these)
- `Two-Step Owner Approval Flow` --rationale_for--> `approveAndMoveRequest()`  [EXTRACTED]
  AGENTS.md → src/services/supabase.ts
- `Owner Name Matching (RLS pattern)` --rationale_for--> `fetchRegisteredOwnerId()`  [EXTRACTED]
  AGENTS.md → src/services/supabase.ts
- `Two-Step Owner Approval Flow` --rationale_for--> `setOwnerDecision()`  [EXTRACTED]
  AGENTS.md → src/services/supabase.ts
- `Timezone Rules (PH +08:00)` --rationale_for--> `formatWallClock()`  [EXTRACTED]
  AGENTS.md → src/utils/datetime.ts
- `Timezone Rules (PH +08:00)` --rationale_for--> `formatManila()`  [EXTRACTED]
  AGENTS.md → src/utils/datetime.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **PH Timezone Handling Stack** — agents_md_timezone_rules, src_utils_datetime_tomanilaiso, src_utils_datetime_formatwallclock, src_utils_datetime_formatmanila [EXTRACTED 1.00]

## Communities (41 total, 15 thin omitted)

### Community 0 - "App Core & Routing"
Cohesion: 0.06
Nodes (62): @hcaptcha/react-hcaptcha@^2.0.2, @hcaptcha/react-hcaptcha, react, @tanstack/react-query, AdminRoute(), App(), GuestRoute(), ProtectedRoute() (+54 more)

### Community 1 - "Shared UI Components"
Cohesion: 0.06
Nodes (65): react-icons, ACTION_LABELS, AuditLogViewProps, DESKTOP_ITEMS, roleChip, CategoryFolderGrid(), CategoryFolderGridProps, conditionChipClass() (+57 more)

### Community 2 - "Grading Form Fields"
Cohesion: 0.07
Nodes (54): AttendanceField(), AttendanceFieldProps, DurationField(), DurationFieldProps, EquipmentUsedField(), EquipmentUsedFieldProps, EventField(), EventFieldProps (+46 more)

### Community 3 - "Admin Management & Approvals"
Cohesion: 0.10
Nodes (50): dtOpts, EventCoveragePage(), DiscordLink, Profile, UsersPage(), addBorrowedItem(), addEventItem(), ApprovalStatus (+42 more)

### Community 4 - "Modals & Toast Utilities"
Cohesion: 0.13
Nodes (36): qrcode, ImageLightbox(), ImageLightboxProps, CONDITION_OPTIONS, useToast(), dtOpts, OwnerRequestRow, OwnerRequestsModal() (+28 more)

### Community 5 - "Discord Serverless Endpoints"
Cohesion: 0.10
Nodes (34): handler(), handler(), DmTarget, DmUserResult, handler(), handler(), handler(), handler() (+26 more)

### Community 6 - "Build & Lint Config"
Cohesion: 0.08
Nodes (37): devDependencies, @babel/core@^7.29.0, babel-plugin-react-compiler@^1.0.0, eslint@^10.3.0, @eslint/js@^10.0.1, eslint-plugin-react-hooks@^7.1.1, eslint-plugin-react-refresh@^0.5.2, globals@^17.6.0 (+29 more)

### Community 7 - "App Persistence & Recovery"
Cohesion: 0.07
Nodes (25): react-dom@^19.2.6, @tanstack/query-sync-storage-persister@^5.101.4, @tanstack/react-query-persist-client@^5.101.4, react-dom, @tanstack/query-sync-storage-persister, @tanstack/react-query-persist-client, ErrorBoundary, ErrorBoundaryProps (+17 more)

### Community 8 - "Layout & Navigation Shell"
Cohesion: 0.11
Nodes (23): react-router-dom, Footer(), GradientLine(), GradientLineProps, LogoutModalManager(), MobileTabBar(), TabButton(), TabItem (+15 more)

### Community 9 - "Borrowed Items Cards"
Cohesion: 0.12
Nodes (26): ProofImage(), BorrowRecord, conditionColors, DESKTOP_ITEMS, formatDate(), formatReturnedOn(), MOBILE_ITEMS, BorrowedCards() (+18 more)

### Community 10 - "Scan & Form Parsing"
Cohesion: 0.14
Nodes (20): BorrowUpdate, EquipmentItem, ScannedFormFields, conditionBadgeClass(), fieldLabels, MONTH_ABBR, MONTHS, normalizeDate() (+12 more)

### Community 11 - "Notification System"
Cohesion: 0.17
Nodes (17): BellProps, NOTIFICATION_EMOJI, NotificationBell(), NotificationBellInner(), timeAgo(), ChannelEntry, channelRegistry, fanOut() (+9 more)

### Community 12 - "Database Schema & Policies"
Cohesion: 0.13
Nodes (11): profiles_approval_status_idx, skems_event_equipment_sweep(), event_folders, event_items, event_items_borrower_idx, event_items_folder_idx, notifications, requests_equipment_status_idx (+3 more)

### Community 13 - "Tauri Rust Core"
Cohesion: 0.13
Nodes (4): DEV_URL, DiscordState, PROD_URL, update_discord_rpc()

### Community 14 - "Public Site & Members"
Cohesion: 0.19
Nodes (14): motion@^13.2.0, motion, GroupedMembers, SpecCarousel(), MemberAvatar(), Reveal(), fetchMembers(), Member (+6 more)

### Community 15 - "TypeScript App Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 16 - "TypeScript Node Config"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 17 - "Guided Tour System"
Cohesion: 0.19
Nodes (14): isVisibleTarget(), TourOverlay(), TourOverlayProps, TourStep, buildTourSteps(), persistDismissed(), readDismissed(), TOUR_STEPS (+6 more)

### Community 18 - "Tauri Bundle Config"
Cohesion: 0.12
Nodes (16): app, security, build, beforeBuildCommand, beforeDevCommand, devUrl, frontendDist, bundle (+8 more)

### Community 19 - "Production Dependencies"
Cohesion: 0.12
Nodes (16): dependencies, docx@^9.7.1, @google/generative-ai@^0.24.1, jsqr@^1.4.0, qrcode@^1.5.4, react@^19.2.6, react-icons@^5.6.0, react-router-dom@^7.16.0 (+8 more)

### Community 20 - "Google Sheets Export"
Cohesion: 0.22
Nodes (6): Equipment, handler(), google-auth-library@^10.6.2, googleapis@^173.0.0, google-auth-library, googleapis

### Community 21 - "TypeScript Base Config"
Cohesion: 0.22
Nodes (8): compilerOptions, esModuleInterop, module, moduleResolution, skipLibCheck, strict, target, include

### Community 22 - "Vite Build Toolchain"
Cohesion: 0.22
Nodes (8): @tailwindcss/vite@^4.3.0, vite@^8.0.12, vite-plugin-pwa@^1.3.0, @vitejs/plugin-react@^6.0.1, @tailwindcss/vite, vite, vite-plugin-pwa, @vitejs/plugin-react

### Community 23 - "Vercel Runtime Config"
Cohesion: 0.25
Nodes (7): maxDuration, maxDuration, functions, api/export-to-sheets.ts, api/scan.ts, headers, rewrites

### Community 24 - "NPM Scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, preview, tauri

### Community 25 - "Tauri Capabilities"
Cohesion: 0.33
Nodes (5): description, identifier, permissions, $schema, windows

## Knowledge Gaps
- **2 isolated node(s):** `sine-kultura`, `Vite React TypeScript Template Notes`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 212 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `App Core & Routing` to `Shared UI Components`, `Grading Form Fields`, `Admin Management & Approvals`, `Modals & Toast Utilities`, `Build & Lint Config`, `App Persistence & Recovery`, `Layout & Navigation Shell`, `Borrowed Items Cards`, `Scan & Form Parsing`, `Notification System`, `Public Site & Members`, `Guided Tour System`, `Production Dependencies`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **What connects `sine-kultura`, `Vite React TypeScript Template Notes` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Core & Routing` be split into smaller, more focused modules?**
  _Cohesion score 0.062421972534332085 - nodes in this community are weakly interconnected._
- **Why does `@supabase/supabase-js` connect `Discord Serverless Endpoints` to `Admin Management & Approvals`, `Build & Lint Config`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Should `Shared UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.06450617283950617 - nodes in this community are weakly interconnected._
- **Why does `react-icons` connect `Shared UI Components` to `App Core & Routing`, `Grading Form Fields`, `Admin Management & Approvals`, `Modals & Toast Utilities`, `Build & Lint Config`, `Layout & Navigation Shell`, `Borrowed Items Cards`, `Public Site & Members`, `Production Dependencies`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Should `Grading Form Fields` be split into smaller, more focused modules?**
  _Cohesion score 0.06664198445020363 - nodes in this community are weakly interconnected._