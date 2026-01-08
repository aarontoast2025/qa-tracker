import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user, email_data } = body;

    if (!user || !email_data) {
      return NextResponse.json({ error: 'Missing user or email_data' }, { status: 400 });
    }

    const { token, token_hash, type, redirect_to } = email_data;
    const email = user.email;

    // Determine the base URL
    // Priority: NEXT_PUBLIC_SITE_URL -> request origin
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
    
    const url = new URL('/auth/confirm', siteUrl);
    
    // Construct query parameters
    if (token_hash) {
      url.searchParams.set('token_hash', token_hash);
      url.searchParams.set('type', type);
    } else {
      url.searchParams.set('token', token);
      url.searchParams.set('type', type);
      url.searchParams.set('email', email);
    }

    if (redirect_to) {
      url.searchParams.set('next', redirect_to);
    }

    const link = url.toString();

    let subject = 'Confirm your email';
    let text = `Please confirm your email by clicking here: ${link}`;

    switch (type) {
      case 'recovery':
        subject = 'Reset your password';
        text = `Reset your password by clicking here: ${link}`;
        break;
      case 'magiclink':
        subject = 'Your Magic Link';
        text = `Log in by clicking here: ${link}`;
        break;
      case 'email_change':
        subject = 'Confirm Email Change';
        text = `Confirm your email change by clicking here: ${link}`;
        break;
      case 'invite':
        subject = 'You have been invited';
        text = `You have been invited. Click here to accept: ${link}`;
        break;
      case 'signup':
      default:
        subject = 'Confirm your email';
        text = `Please confirm your email by clicking here: ${link}`;
        break;
    }

    const { data, error } = await resend.emails.send({
      from: 'noreply_toast_tracker@resend.dev',
      to: [email],
      subject: subject,
      html: `
        <div>
          <p>${text}</p>
          <p><a href="${link}">Click here</a></p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data?.id });
  } catch (error: any) {
    console.error('Error in send-email hook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
