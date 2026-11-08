import React from 'react';
import LegalLayout, { H2, P, UL } from './LegalLayout';
import { LEGAL } from './legalConfig';

const link = { color: '#1ea966', textDecoration: 'underline' };

const SupportPage = () => (
  <LegalLayout title="Support">
    <P>Need help with {LEGAL.brand}? Contact us and include your registered phone number or email, your device model, and a short description or screenshot of the problem. Never send your password.</P>

    <H2>Contact</H2>
    <UL items={[
      <>Email: <a style={link} href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a></>,
      <>WhatsApp: <a style={link} href={`https://wa.me/${LEGAL.whatsappNumber}`} target="_blank" rel="noopener noreferrer">+{LEGAL.whatsappNumber}</a></>,
    ]} />

    <H2>Common problems</H2>
    <UL items={[
      'Cannot sign in: check your username/email and password, then use “Forgot password” to receive a code by email. If your account is limited to another device, contact support to move it.',
      'Video will not play: check your connection, close and reopen the app, and try another lesson. Tell us the course and lesson name.',
      'Download problems: keep the app open while downloading, make sure you have free storage, and retry on a stable connection.',
      'Document will not open: check your connection and retry; tell us which document.',
      'Report abusive content or a user: send us the course name and a description or screenshot.',
    ]} />

    <H2>Delete your account</H2>
    <P>In the app, open Profile and choose “Delete account”, then confirm with your password. On the website, use your profile page. If you cannot sign in, email us from the address registered on the account and ask for deletion. See the Privacy Policy for what is deleted and what is kept.</P>
  </LegalLayout>
);

export default SupportPage;
