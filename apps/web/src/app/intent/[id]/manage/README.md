# Event Management System

This directory contains the complete event management system for Miglee. The management interface is accessible only to event owners, moderators, and application admins/moderators.

## Structure

```
/intent/[id]/manage/
├── layout.tsx                    # Main layout with sidebar and navbar
├── page.tsx                      # Dashboard (overview, stats, quick actions)
├── _components/                  # Shared management components
│   ├── intent-management-sidebar.tsx
│   ├── intent-management-navbar.tsx
│   ├── intent-management-mobile-sidebar.tsx
│   ├── intent-management-guard.tsx
│   ├── intent-management-provider.tsx
│   └── intent-management-dashboard.tsx
├── view/                         # View event in standard mode
│   └── page.tsx
├── members/                      # Member management
│   ├── page.tsx
│   └── _components/
│       ├── intent-members-management-connect.tsx
│       ├── members-panel.tsx
│       ├── member-section.tsx
│       ├── member-row.tsx
│       ├── member-manage-modal.tsx
│       ├── invite-users-modal.tsx
│       └── types.ts
├── join-form/                    # Join form questions and requests
│   ├── page.tsx
│   └── _components/
│       ├── join-form-panel.tsx
│       └── join-requests-list.tsx
├── invite-links/                 # Invite link management
│   ├── page.tsx
│   └── _components/
│       ├── invite-links-panel.tsx
│       └── edit-link-modal.tsx
├── plans/                        # Sponsorship plans purchase
│   ├── page.tsx
│   └── _components/
│       └── plans-panel.tsx
├── subscription/                 # Active sponsorship management
│   ├── page.tsx
│   └── _components/
│       ├── subscription-panel.tsx
│       └── subscription-panel-types.ts
├── notifications/                # Send notifications to members
│   ├── page.tsx
│   └── _components/
│       └── notifications-panel.tsx
├── chat/                         # Chat management (placeholder)
│   └── page.tsx
├── analytics/                    # Event analytics (placeholder)
│   └── page.tsx
├── moderation/                   # Content moderation (placeholder)
│   └── page.tsx
└── settings/                     # Event settings
    ├── page.tsx
    └── _components/
        └── intent-settings-management.tsx
```

## Features

### Access Control

- **Owner**: Full access to all management features
- **Moderator**: Access to member management, moderation, and chat
- **App Admin/Moderator**: Full access to all events
- **Regular Users**: Redirected to standard event view

### Pages

#### Dashboard (`/manage`)

- Event statistics overview
- Quick actions (edit, delete, share)
- Member count and activity
- Recent activity feed

#### View Event (`/manage/view`)

- Preview the event as regular users see it
- Embedded within management interface
- Quick link to open in new tab

#### Members (`/manage/members`)

- View all members by status (JOINED, PENDING, INVITED, etc.)
- Search and filter members
- Manage roles (Owner, Moderator, Participant)
- Approve/reject join requests
- Kick, ban, or unban members
- Invite new members
- View member statistics

#### Join Form (`/manage/join-form`)

- Create and edit join questions
- View and manage join requests
- Approve or reject requests with answers
- Reorder questions (drag & drop)
- Lock/unlock editing based on existing members

#### Invite Links (`/manage/invite-links`)

- Create custom invite links
- Set expiration dates and usage limits
- Track link usage and statistics
- Revoke or delete links
- View users who joined via each link

#### Sponsorship Plans (`/manage/plans`)

- Purchase sponsorship packages (Basic, Plus, Pro)
- View plan features and pricing
- Subscription integration (auto-unlock plans)

#### Active Subscription (`/manage/subscription`)

- Manage active sponsorship features
- Boost event visibility
- Send local push notifications
- Toggle sponsored badge
- Toggle event highlighting
- View usage statistics
- Top-up actions (buy more boosts/pushes)

#### Notifications (`/manage/notifications`)

- Send quick notifications to members
- Target specific groups (JOINED, INVITED, PENDING)
- Custom message composition
- View member counts per group

#### Chat Management (`/manage/chat`)

- Placeholder for chat moderation features
- Message filtering and moderation
- User muting and blocking

#### Analytics (`/manage/analytics`)

- Placeholder for event analytics
- View counts, engagement metrics
- Member growth over time
- Geographic distribution

#### Moderation (`/manage/moderation`)

- Placeholder for content moderation
- Review reported content
- Manage user reports

#### Settings (`/manage/settings`)

- Edit event details
- Configure privacy settings
- Manage event visibility
- Delete event

## Layout Components

### IntentManagementSidebar

- Desktop sidebar navigation
- Collapsible with animations
- Active route highlighting
- Logo and branding
- Sticky positioning

### IntentManagementNavbar

- Top navigation bar
- Mobile menu toggle
- User actions (profile, notifications)
- Breadcrumb navigation

### IntentManagementMobileSidebar

- Mobile drawer navigation
- Slide-in animation
- Touch-friendly interface
- Backdrop overlay

### IntentManagementGuard

- Access control wrapper
- Permission checking
- Redirect unauthorized users
- Loading states

### IntentManagementProvider

- Context provider for event data
- Shared state management
- Data fetching and caching

## Permissions

The management interface uses `useIntentPermissions` hook to check:

- Is user the event owner?
- Is user an event moderator?
- Is user an app admin?
- Is user an app moderator?

Access is granted if any of these conditions are true.

## Navigation

The sidebar includes:

1. **Dashboard** - Overview and quick actions
2. **View Event** - Preview standard view
3. **Members** - Member management
4. **Join Form** - Form configuration
5. **Invite Links** - Link management
6. **Sponsorship** - Purchase plans
7. **Active Plan** - Manage subscription (conditional)
8. **Notifications** - Send messages
9. **Chat** - Chat moderation
10. **Analytics** - Event metrics
11. **Moderation** - Content moderation
12. **Settings** - Event configuration

## Styling

- Consistent with `/account/` section design
- Dark mode support
- Responsive layout (mobile, tablet, desktop)
- Smooth animations and transitions
- Tailwind CSS utility classes

## Data Fetching

- React Query for server state
- Optimistic updates
- Automatic refetching
- Error handling
- Loading states

## Future Enhancements

- Real-time updates via WebSockets
- Advanced analytics dashboard
- Automated moderation tools
- Bulk member actions
- Export member data
- Event templates
- Recurring events
- Multi-language support
