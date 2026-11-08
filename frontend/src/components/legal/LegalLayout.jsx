import React from 'react';
import { Link } from 'react-router-dom';
import { LEGAL, placeholder } from './legalConfig';

const GREEN = '#1ea966';

export const LegalLinks = ({ className = '' }) => (
  <nav aria-label="Legal" className={`flex flex-wrap gap-x-5 gap-y-1 justify-center ${className}`}>
    <Link to="/privacy" style={{ color: GREEN }}>Privacy Policy</Link>
    <Link to="/terms" style={{ color: GREEN }}>Terms of Service</Link>
    <Link to="/support" style={{ color: GREEN }}>Support</Link>
  </nav>
);

/* Shows the owner-supplied value, or a clearly marked placeholder when it is not known yet. */
export const Fact = ({ value, label }) =>
  value ? <>{value}</> : <mark style={{ background: '#fff3cd', padding: '0 4px' }}>{placeholder(label)}</mark>;

const LegalLayout = ({ title, children }) => {
  React.useEffect(() => { document.title = `${title} | ${LEGAL.brand}`; }, [title]);
  return (
    <div style={{ background: '#fff', color: '#3b3745', minHeight: '100vh' }}>
      <header style={{ borderBottom: '1px solid #e5e7eb' }}>
        <div className="flex items-center gap-3" style={{ maxWidth: 860, margin: '0 auto', padding: '14px 16px' }}>
          <Link to="/" className="flex items-center gap-3" style={{ textDecoration: 'none' }}>
            <img src="/bare-logo.png" width={34} height={40} alt="" />
            <span style={{ fontSize: 22, fontWeight: 700, color: GREEN }}>BARE ACADEMY</span>
          </Link>
        </div>
      </header>
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px 48px', lineHeight: 1.65, fontSize: 16 }}>
        <h1 style={{ fontSize: 30, fontWeight: 700, marginBottom: 6 }}>{title}</h1>
        <p style={{ color: '#6b7280', marginBottom: 16 }}>
          Effective date: <Fact value={LEGAL.effectiveDate} label="effective date" />
        </p>
        {!LEGAL.reviewed && (
          <p role="note" style={{ background: '#fff3cd', border: '1px solid #ffe08a', borderRadius: 8, padding: '10px 14px', marginBottom: 20 }}>
            Draft: this page is awaiting review and approval by the Bare Academy owner. Items highlighted like this are not yet confirmed.
          </p>
        )}
        {children}
      </main>
      <footer style={{ borderTop: '1px solid #e5e7eb', padding: '18px 16px' }}>
        <LegalLinks />
      </footer>
    </div>
  );
};

export const H2 = ({ children }) => <h2 style={{ fontSize: 21, fontWeight: 700, margin: '28px 0 8px' }}>{children}</h2>;
export const P = ({ children }) => <p style={{ margin: '8px 0' }}>{children}</p>;
export const UL = ({ items }) => (
  <ul style={{ listStyle: 'disc', paddingLeft: 24, margin: '8px 0' }}>{items.map((t, i) => <li key={i} style={{ margin: '4px 0' }}>{t}</li>)}</ul>
);

export default LegalLayout;
