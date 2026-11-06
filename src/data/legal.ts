export interface LegalSection {
  heading: string;
  body: string[];
}

export interface LegalDocument {
  title: string;
  updated: string;
  sections: LegalSection[];
}

export const PRIVACY_POLICY: LegalDocument = {
  title: 'Privacy Policy',
  updated: 'October 2026',
  sections: [
    {
      heading: 'What we collect',
      body: [
        'When you create an account we keep your name, email address, WhatsApp number, hostel or institution details and your preferred delivery address.',
        'When you place an order we keep the order details you enter, your delivery location and the reference number we give you.',
      ],
    },
    {
      heading: 'How we use it',
      body: [
        'We use your details to confirm, prepare and deliver your orders, to reply to you on WhatsApp, and to show you your order history.',
        'We do not sell your personal information.',
      ],
    },
    {
      heading: 'Who can see your information',
      body: [
        'You can see only your own profile and orders. Dreypella Campus staff who manage orders can see the orders they handle.',
        'Our hosting and database providers store the information on our behalf so the website can work.',
      ],
    },
    {
      heading: 'Your choices',
      body: [
        'You can update your profile at any time from the My profile page.',
        'To ask us to delete your account or records, message us on WhatsApp using the number on the Contact page.',
      ],
    },
  ],
};

export const TERMS_AND_CONDITIONS: LegalDocument = {
  title: 'Terms and Conditions',
  updated: 'October 2026',
  sections: [
    {
      heading: 'What we offer',
      body: [
        'Dreypella Campus helps students in Ogbomoso with buying, printing, collecting and delivering items, and with bulk requests for groups and departments.',
      ],
    },
    {
      heading: 'Orders and prices',
      body: [
        'An order is only confirmed after our team replies to you on WhatsApp. Prices are shown only when they have been confirmed; otherwise the order is marked "Request a Quote".',
        'The reference number you receive identifies your request. Please quote it in any follow-up message.',
      ],
    },
    {
      heading: 'Accounts',
      body: [
        'You are responsible for keeping your password private and for the accuracy of the details on your profile.',
      ],
    },
    {
      heading: 'Delivery and cancellations',
      body: [
        'Please give accurate delivery locations and times. Ask us to change or cancel an order as early as possible, before we have bought or printed the items.',
      ],
    },
    {
      heading: 'Limits',
      body: [
        'We take care in handling every order, but our responsibility is limited to the amount you have paid for the affected order.',
      ],
    },
  ],
};
