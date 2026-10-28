// Every environment variable the app reads, in one place. Values come from
// `.env` locally and from the Vercel project settings in production.
// See `.env.example` for a template.

import { defineEnvVars } from '@sveltejs/kit/env';

const optional = (value: string | undefined) => value || undefined;

export const variables = defineEnvVars({
	DATABASE_URL: {
		description:
			'Database location: `file:local.db` locally, `libsql://<db>.turso.io` in production.'
	},
	DATABASE_AUTH_TOKEN: {
		description: 'Turso auth token. Leave empty for a local file database.',
		schema: optional
	},
	BLOB_READ_WRITE_TOKEN: {
		description:
			'Vercel Blob token for product photos. Set automatically on Vercel once a Blob store is connected. When empty, photos are saved to ./uploads (local dev only).',
		schema: optional
	},
	SHIPPO_API_TOKEN: {
		description:
			'Shippo API token for real shipping labels (a free `shippo_test_...` token works). When empty, rate lookups fail with a clear message.',
		schema: optional
	},
	SHIP_FROM_NAME: { description: 'Return address: name.', schema: optional },
	SHIP_FROM_STREET1: { description: 'Return address: street.', schema: optional },
	SHIP_FROM_STREET2: { description: 'Return address: apt/suite.', schema: optional },
	SHIP_FROM_CITY: { description: 'Return address: city.', schema: optional },
	SHIP_FROM_STATE: { description: 'Return address: state.', schema: optional },
	SHIP_FROM_ZIP: { description: 'Return address: ZIP.', schema: optional },
	SHIP_FROM_COUNTRY: { description: 'Return address: country code.', schema: optional },
	SHIP_FROM_PHONE: { description: 'Return address: phone.', schema: optional },
	SHIP_FROM_EMAIL: { description: 'Return address: email.', schema: optional },
	RESEND_API_KEY: {
		description:
			'Resend API key for order confirmation emails. When empty, emails are printed to the terminal instead of sent.',
		schema: optional
	},
	EMAIL_FROM: {
		description:
			"Email sender, e.g. `Los Pellot <pedidos@lospellotled.com>` (domain verified in Resend). When empty, uses Resend's test sender, which only delivers to your own Resend account email.",
		schema: optional
	}
});
