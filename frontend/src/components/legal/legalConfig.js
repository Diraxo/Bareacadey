/* Single place for the facts the legal pages need that only the owner can confirm.
 *
 * `reviewed` stays false until the owner (and a qualified legal reviewer) approved the wording; while it is false every
 * legal page shows a visible "draft" notice, and any value in OWNER_TO_CONFIRM is rendered as a marked placeholder
 * instead of as a fact. Nothing here may be invented: leave a value empty until it is confirmed. */
export const LEGAL = {
  reviewed: false,
  brand: 'Bare Academy',
  site: 'https://bareacadamy.com',
  // Legal entity, postal address and governing law: NOT known. Leave empty until the owner supplies them.
  legalName: '',
  address: '',
  governingLaw: '',
  effectiveDate: '',
  // Contact details already shown on the live site / inside the released app; the owner must confirm them for publication.
  supportEmail: 'jooharacademy@gmail.com',
  whatsappNumber: '251917977714',
};

export const placeholder = (label) => `[${label} — to be confirmed by the owner]`;
