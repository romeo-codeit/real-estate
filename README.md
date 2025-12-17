# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

### Seeding Sanity (optional)

If you have a Sanity dataset and write token configured, you can seed sample plan documents with the following (useful for local development):

1. Add a write token in your `.env.local` file:

```
SANITY_API_TOKEN=your-write-token-here
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=your_dataset
NEXT_PUBLIC_SANITY_API_VERSION=2023-01-01
```

2. Run the seeding script:

```bash
npm run sanity:seed
```

3. Seed will create a few basic `plan` documents. If you also use Sanity Studio, open it and publish any un-published documents.

If you don't have a Sanity project or Studio, you can still test the UI locally — the `PricingPlans` component falls back to showing sample plan cards when no plans are found.

## Error Monitoring & Tracking

This project uses Sentry for comprehensive error tracking and performance monitoring.

### Sentry Setup

1. Create a Sentry project at [sentry.io](https://sentry.io)
2. Get your DSN from the project settings
3. Add the following environment variables to your `.env` file:

```env
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn-here@sentry.io/project-id
SENTRY_DSN=https://your-sentry-dsn-here@sentry.io/project-id
SENTRY_ORG=your-sentry-org-slug
SENTRY_PROJECT=your-sentry-project-slug
```

4. Replace the placeholder values with your actual Sentry project details

### Features Included

- **Real-time Error Tracking**: All errors are automatically captured and sent to Sentry
- **Performance Monitoring**: Page load times and API response times are tracked
- **Session Replay**: User interactions are recorded for debugging
- **Error Boundaries**: React components are wrapped with error boundaries for graceful failure handling
- **Global Error Handlers**: Unhandled promise rejections and JavaScript errors are captured
- **Custom Error Logging**: API errors, auth events, and user actions are logged

### Error Boundaries

The application includes several types of error boundaries:

- **CriticalErrorBoundary**: For critical application sections (layout, dashboard)
- **AsyncErrorBoundary**: For async server components with retry functionality
- **APIErrorBoundary**: Specialized for API-related errors
- **Default ErrorBoundary**: General-purpose error boundary with fallback UI

All error boundaries automatically send errors to Sentry with appropriate context and tags.
