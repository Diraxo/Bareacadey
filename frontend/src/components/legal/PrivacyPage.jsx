import React from 'react';
import LegalLayout, { Fact, H2, P, UL } from './LegalLayout';
import { LEGAL } from './legalConfig';

const PrivacyPage = () => (
  <LegalLayout title="Privacy Policy">
    <P>
      This policy explains what personal information {LEGAL.brand} (the website {LEGAL.site} and the {LEGAL.brand} mobile app) collects,
      why, and the choices you have. The service is operated by <Fact value={LEGAL.legalName} label="legal name of the operator" />.
    </P>

    <H2>1. Information we collect</H2>
    <UL items={[
      'Account details you give when registering or editing your profile: name, username, email address, phone number, gender, date of birth, and an optional "about me" text.',
      'Your password. It is stored only as a one-way hash on our server; we cannot read it.',
      'An optional profile picture you choose from your photo library.',
      'Sign-in and session information: login sessions (including a short description of the browser or device), and timestamps used to keep you signed in and to sign you out.',
      'Device registration: an identifier derived from your device is stored so that an account can be limited to registered devices.',
      'Learning activity: the courses you open, ratings and reviews you write, and quiz results.',
      'Messages you send through in-app chat, and files attached to them.',
      'Messages you send through the contact form on the website (name, email, phone and message).',
      'Course downloads for offline viewing are saved on your own device. Which items you download is not used for advertising.',
    ]} />

    <H2>2. Information stored on your device</H2>
    <UL items={[
      'Sign-in tokens and app settings are kept in the app’s local storage.',
      'If you choose to remember an account, its sign-in name is stored in the app and its password in your device’s secure keystore (iOS Keychain / Android Keystore). You can remove it at any time from the sign-in screen.',
      'If your device supports Face ID or fingerprint, the app asks the operating system to confirm it is you before quick sign-in. The app never receives your biometric data.',
    ]} />

    <H2>3. How we use information</H2>
    <UL items={[
      'To create and secure your account, sign you in, and recover your password.',
      'To provide courses, videos, documents, quizzes, progress and ratings.',
      'To restrict an account to its registered device(s) and to detect misuse or copying of course content.',
      'To answer your support requests and messages.',
      'To maintain and improve the service and keep it secure.',
    ]} />
    <P>We do not use advertising or analytics tracking SDKs in the mobile app and do not sell personal information.</P>

    <H2>4. Who receives information</H2>
    <UL items={[
      'Hosting and infrastructure: our servers are operated by a hosting provider on our behalf. Provider name and location: [to be confirmed by the owner].',
      'Email delivery: password-reset codes and notifications are sent through an email service. Provider: [to be confirmed by the owner].',
      'WhatsApp: if you contact support through WhatsApp, your message, phone number and any details you include are handled by WhatsApp under its own policy.',
      'Google: if you open a PDF/document inside the app, it may be displayed through Google’s document viewer, which receives the document address. Google may also be used for sign-in on the website, where offered.',
      'Payment processing: the service contains payment code for a payment provider (Chapa). If courses are free, no payment details are collected. [Owner to confirm whether any paid features are active.]',
      'Other users: your ratings and reviews and your chat messages are visible to the people they are addressed to, and, for reviews, may be shown with your name to other students. [Owner to confirm exact visibility.]',
      'We may disclose information when required by law.',
    ]} />

    <H2>5. Retention and deletion</H2>
    <P>We keep account information while your account exists. You can delete your account inside the app (Profile → Delete account) or on the website (profile page), or by contacting support.</P>
    <P>When you delete your account: your profile details are erased or replaced with anonymous values, your photo, registered devices, ratings and reviews, chat messages and notifications are deleted, all your login sessions are ended, and the account can no longer be used. Payment records, if any, and an administrative activity log are kept in anonymised form because they may be needed for accounting, security and legal reasons; retention period: <Fact value="" label="retention period" />. Deletion of the copy stored on your own device is done by removing the app.</P>

    <H2>6. Security</H2>
    <P>Connections to our website and API use HTTPS. Passwords are hashed. Access to administrative functions is restricted by role. No system is perfectly secure, so we cannot guarantee absolute security.</P>

    <H2>7. Your choices and rights</H2>
    <P>You can view and update your profile in the app, remove your profile picture, remove saved sign-in details, and delete your account. You can also contact us to ask about, correct or delete information. Additional rights may apply depending on where you live.</P>

    <H2>8. Children</H2>
    <P>The intended age range of the service is <Fact value="" label="intended audience / age range" />. Do not register if you are below the minimum age. Contact us if you believe a child has registered without permission and we will delete the account.</P>

    <H2>9. Changes</H2>
    <P>We will post any changes on this page and update the effective date above.</P>

    <H2>10. Contact</H2>
    <P>
      Email: <a href={`mailto:${LEGAL.supportEmail}`} style={{ color: '#1ea966' }}>{LEGAL.supportEmail}</a><br />
      Address: <Fact value={LEGAL.address} label="postal address" />
    </P>
  </LegalLayout>
);

export default PrivacyPage;
