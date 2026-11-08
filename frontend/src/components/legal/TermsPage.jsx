import React from 'react';
import LegalLayout, { Fact, H2, P, UL } from './LegalLayout';
import { LEGAL } from './legalConfig';

const TermsPage = () => (
  <LegalLayout title="Terms of Service">
    <P>
      These terms govern your use of {LEGAL.brand} (the website and the mobile app), operated by{' '}
      <Fact value={LEGAL.legalName} label="legal name of the operator" />. By creating an account or using the service you agree to them.
    </P>

    <H2>1. Your account</H2>
    <UL items={[
      'Give accurate registration information and keep it up to date.',
      'You are responsible for your password and for activity under your account. Do not share your account.',
      'Accounts may be limited to registered devices. Tell us promptly if your account is used without permission.',
    ]} />

    <H2>2. Courses and content</H2>
    <P>
      Course videos, documents, quizzes and other materials belong to {LEGAL.brand} or its instructors and are protected by copyright.
      Access is granted to you personally, for your own learning, and is not transferable. Course access terms: [owner to confirm whether all courses are currently free].
    </P>

    <H2>3. Acceptable use</H2>
    <UL items={[
      'Do not copy, record, download except through the app’s offline feature, redistribute, resell or publish course videos or documents.',
      'Do not attempt to bypass device restrictions, content protection or access controls, or to interfere with the service.',
      'Do not post unlawful, abusive, harassing, hateful or misleading content in reviews or chat, and do not impersonate others.',
      'Do not upload malware or use the service to send spam.',
    ]} />

    <H2>4. Reviews and messages</H2>
    <P>You are responsible for what you post. You allow us to display your reviews in the service. We may remove content that breaks these terms. To report objectionable content or abuse, contact support (see the Support page).</P>

    <H2>5. Suspension and termination</H2>
    <P>We may suspend or end access if these terms are broken or to protect the service or other users. You may stop using the service and delete your account at any time (in the app: Profile → Delete account). See the Privacy Policy for what happens to your data.</P>

    <H2>6. Availability</H2>
    <P>We work to keep the service available but do not promise uninterrupted or error-free operation. Features may change.</P>

    <H2>7. Liability</H2>
    <P>[Limitation-of-liability wording — requires owner and qualified legal review before publication.]</P>

    <H2>8. Governing law</H2>
    <P><Fact value={LEGAL.governingLaw} label="governing law and jurisdiction" /></P>

    <H2>9. Changes</H2>
    <P>We may update these terms; the effective date above shows the latest version. Continued use after a change means you accept it.</P>

    <H2>10. Contact</H2>
    <P>
      <a href={`mailto:${LEGAL.supportEmail}`} style={{ color: '#1ea966' }}>{LEGAL.supportEmail}</a>
    </P>
  </LegalLayout>
);

export default TermsPage;
