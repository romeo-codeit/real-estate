# Real Estate Investment Platform

A comprehensive real estate investment platform built with Next.js 14, featuring cryptocurrency payments, property investments, admin dashboard, and secure financial transactions.

## 🚀 Features

- **Property Investment**: Browse and invest in real estate properties
- **Cryptocurrency Payments**: Support for BTC and other crypto payments
- **Multiple Payment Gateways**: Stripe, PayPal, Paystack integration
- **Admin Dashboard**: Complete admin panel for managing investments, users, and transactions
- **User Authentication**: Secure authentication with role-based access control (RBAC)
- **Transaction Management**: Comprehensive transaction tracking and reconciliation
- **Real-time Notifications**: Investment updates and payment confirmations
- **Responsive Design**: Mobile-first design with Tailwind CSS

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **CMS**: Sanity.io for content management
- **Payments**: Stripe, PayPal, Paystack, Cryptocurrency
- **Authentication**: Supabase Auth
- **Deployment**: Koyeb (Docker)
- **Monitoring**: Sentry for error tracking

## 📋 Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account
- Sanity.io account (optional)
- Payment gateway accounts (Stripe, PayPal, Paystack)

## 🚀 Quick Start (Development)

1. **Clone the repository**
   ```bash
   git clone https://github.com/romeo-codeit/real-estate.git
   cd real-estate
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Run database migrations**
   ```bash
   # Apply the complete schema to your Supabase database
   # Use the SQL in complete_schema.sql
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Seed sample data (optional)**
   ```bash
   npm run sanity:seed
   ```

## 🌐 Deployment to Koyeb

### Step 1: Prepare for Production

1. **Update environment variables for production**
   ```bash
   cp .env.production.example .env.production
   # Edit with your production keys
   ```

2. **Validate payment configuration**
   ```bash
   npm run test:payment-config
   ```

### Step 2: Deploy to Koyeb

1. **Connect your GitHub repository**
   - Go to [Koyeb Dashboard](https://app.koyeb.com)
   - Click "Create App" → "GitHub"
   - Connect your GitHub account and select this repository

2. **Configure the deployment**
   - **Name**: `real-estate-investment-platform`
   - **Instance Type**: Select based on your needs (start with smallest)
   - **Region**: Choose closest to your users

3. **Set environment variables**
   In the Koyeb dashboard, add all environment variables from `.env.production.example`:
   - Go to your app → Settings → Environment Variables
   - Add each variable with its production value

4. **Configure payment webhooks**
   Update webhook URLs in your payment gateway dashboards:
   ```
   Stripe:  https://your-app.koyeb.app/api/webhooks/stripe
   PayPal:  https://your-app.koyeb.app/api/webhooks/paypal
   Paystack: https://your-app.koyeb.app/api/webhooks/paystack
   ```

5. **Deploy**
   - Click "Deploy" in Koyeb
   - Monitor the build logs
   - Your app will be available at `https://your-app.koyeb.app`

### Step 3: Post-Deployment Setup

1. **Create first admin user**
   - Visit: `https://your-app.koyeb.app/admin`
   - Use the admin setup secret from your environment variables

2. **Test payment flows**
   - Test deposits with small amounts
   - Verify webhook processing
   - Check transaction reconciliation

3. **Configure custom domain (optional)**
   - In Koyeb dashboard: Settings → Domains
   - Add your custom domain and configure DNS

## 🔧 Configuration

### Environment Variables

See `.env.production.example` for all required environment variables.

### Payment Gateway Setup

Detailed setup instructions in `PAYMENT_ENV_SETUP.md` and `PAYMENT_GATEWAYS_README.md`.

### Database Schema

The complete database schema is in `complete_schema.sql`. Apply this to your Supabase database.

## 📊 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
npm run typecheck       # Run TypeScript checks

# Database & Content
npm run sanity:seed     # Seed Sanity CMS with sample data
npm run seed:reports    # Seed sample reports

# Payment Configuration
npm run test:payment-config  # Validate payment gateway setup
```

## 🔒 Security Features

- **CSRF Protection**: Prevents cross-site request forgery
- **Input Sanitization**: XSS protection and data validation
- **Rate Limiting**: API rate limiting for security
- **Row Level Security**: Database-level access control
- **Webhook Verification**: Payment webhook signature validation

## 📱 Admin Features

- User management with RBAC
- Transaction monitoring and reconciliation
- Investment plan management
- Property management
- Crypto wallet administration
- Payment gateway monitoring
- Audit logs and reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is private and proprietary.

## 🆘 Support

For support or questions, please contact the development team.

---

**Built with ❤️ for real estate investment management**

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
