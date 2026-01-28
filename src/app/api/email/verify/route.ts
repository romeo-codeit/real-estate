import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { EmailService } from '@/lib/email-service';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';

const emailService = EmailService.getInstance();

export async function POST(request: NextRequest) {
  // Email verification is currently disabled
  return NextResponse.json({
    error: 'Email verification is temporarily disabled',
    message: 'Email verification feature is currently unavailable. Please contact support if you need assistance.'
  }, { status: 503 });

  // Uncomment below to reactivate email verification
  // try {
  //   const authHeader = request.headers.get('authorization');
  //   if (!authHeader || !authHeader.startsWith('Bearer ')) {
  //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  //   }
  //   const token = authHeader.substring(7);
  //   const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  //   if (authError || !user) {
  //     return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  //   }

  //   // Check if user is already verified
  //   const { data: userData, error: userError } = await supabaseAdmin
  //     .from('users')
  //     .select('email_verified_at')
  //     .eq('id', user.id)
  //     .single();

  //   if (userError) {
  //     return NextResponse.json({ error: 'Failed to check verification status' }, { status: 500 });
  //   }

  //   if ((userData as any).email_verified_at) {
  //     return NextResponse.json({ error: 'Email already verified' }, { status: 400 });
  //   }

  //   // Generate verification token
  //   const verificationToken = crypto.randomUUID();
  //   const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`;

  //   // Store verification token (you might want to create a verification_tokens table)
  //   // For now, we'll store it in user metadata or create a simple table
  //   const { error: tokenError } = await supabaseAdmin
  //     .from('users')
  //     .update({
  //       metadata: {
  //         email_verification_token: verificationToken,
  //         token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
  //       }
  //     } as any)
  //     .eq('id', user.id);

  //   if (tokenError) {
  //     return NextResponse.json({ error: 'Failed to generate verification token' }, { status: 500 });
  //   }

  //   // Send verification email
  //   const template = emailService.getEmailVerificationTemplate(
  //     verificationUrl,
  //     `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || 'User'
  //   );

  //   await emailService.sendEmail(user.email!, template);

  //   return NextResponse.json({ message: 'Verification email sent successfully' });
  // } catch (error) {
  //   console.error('Email verification error:', error);
  //   return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  // }
}

// Verify email endpoint - currently disabled
export async function PUT(request: NextRequest) {
  // Email verification is currently disabled
  return NextResponse.json({
    error: 'Email verification is temporarily disabled',
    message: 'Email verification feature is currently unavailable. Please contact support if you need assistance.'
  }, { status: 503 });

  // Uncomment below to reactivate email verification
  // try {
  //   const { token } = await request.json();

  //   if (!token) {
  //     return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
  //   }

  //   // Find user with this token
  //   const { data: userData, error: userError } = await supabaseAdmin
  //     .from('users')
  //     .select('id, metadata')
  //     .eq('metadata->email_verification_token', token)
  //     .single();

  //   if (userError || !userData) {
  //     return NextResponse.json({ error: 'Invalid or expired verification token' }, { status: 400 });
  //   }

  //   const metadata = (userData as any).metadata as any;
  //   const expiresAt = metadata?.token_expires_at;

  //   if (!expiresAt || new Date(expiresAt) < new Date()) {
  //     return NextResponse.json({ error: 'Verification token has expired' }, { status: 400 });
  //   }

  //   // Mark email as verified
  //   const { error: updateError } = await supabaseAdmin
  //     .from('users')
  //     .update({
  //       email_verified_at: new Date().toISOString(),
  //       metadata: {
  //         ...metadata,
  //         email_verification_token: null,
  //         token_expires_at: null,
  //       }
  //     } as any)
  //     .eq('id', (userData as any).id);

  //   if (updateError) {
  //     return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 });
  //   }

  //   return NextResponse.json({ message: 'Email verified successfully' });
  // } catch (error) {
  //   console.error('Email verification error:', error);
  //   return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  // }
}