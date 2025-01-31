import { Kysely, sql } from "kysely";

export async function seed(db: Kysely<any>): Promise<void> {
	// Insert into auth.users
	await db.insertInto("auth.users").values([
		{
			instance_id: "00000000-0000-0000-0000-000000000000",
			id: sql`uuid_generate_v4()`,
			aud: "authenticated",
			role: "authenticated",
			email: "adam@orca.com",
			encrypted_password: sql`crypt('123456', gen_salt('bf'))`,
			email_confirmed_at: sql`current_timestamp`,
			recovery_sent_at: sql`current_timestamp`,
			last_sign_in_at: sql`current_timestamp`,
			raw_app_meta_data:
				sql`'{"provider":"email","providers":["email"]}'`,
			raw_user_meta_data: sql`'{}'`,
			created_at: sql`current_timestamp`,
			updated_at: sql`current_timestamp`,
			confirmation_token: "",
			email_change: "",
			email_change_token_new: "",
			recovery_token: "",
		},
		{
			instance_id: "00000000-0000-0000-0000-000000000000",
			id: sql`uuid_generate_v4()`,
			aud: "authenticated",
			role: "authenticated",
			email: "eve@orca.com",
			encrypted_password: sql`crypt('123456', gen_salt('bf'))`,
			email_confirmed_at: sql`current_timestamp`,
			recovery_sent_at: sql`current_timestamp`,
			last_sign_in_at: sql`current_timestamp`,
			raw_app_meta_data:
				sql`'{"provider":"email","providers":["email"]}'`,
			raw_user_meta_data: sql`'{}'`,
			created_at: sql`current_timestamp`,
			updated_at: sql`current_timestamp`,
			confirmation_token: "",
			email_change: "",
			email_change_token_new: "",
			recovery_token: "",
		},
	]).execute();

	// Insert into auth.identities
	await db.insertInto("auth.identities").values([
		{
			provider_id: sql`uuid_generate_v4()`,
			user_id:
				sql`(SELECT id FROM auth.users WHERE email = 'adam@orca.com')`,
			identity_data: sql`format(
	    '{"sub":"%s","email":"%s"}',
	    (SELECT id FROM auth.users WHERE email = 'adam@orca.com')::text,
	    'adam@orca.com'
	  )::jsonb`,
			provider: "email",
			last_sign_in_at: sql`current_timestamp`,
			created_at: sql`current_timestamp`,
			updated_at: sql`current_timestamp`,
		},
		{
			provider_id: sql`uuid_generate_v4()`,
			user_id:
				sql`(SELECT id FROM auth.users WHERE email = 'eve@orca.com')`,
			identity_data: sql`format(
	    '{"sub":"%s","email":"%s"}',
	    (SELECT id FROM auth.users WHERE email = 'eve@orca.com')::text,
	    'eve@orca.com'
	  )::jsonb`,
			provider: "email",
			last_sign_in_at: sql`current_timestamp`,
			created_at: sql`current_timestamp`,
			updated_at: sql`current_timestamp`,
		},
	]).execute();

	// Insert into public.connection
	await db.insertInto("public.connection").values({
		name: "nobitex",
		title: "Nobitex",
		type: "CEX",
		logo: "https://nobitex.ir/favicon.png",
		description: "Nobitex is a digital currency exchange in Iran.",
		enabled: true,
	}).execute();

	// Insert into public.portfolio
	await db.insertInto("public.portfolio").values({
		user_id: sql`(SELECT id FROM auth.users WHERE email = 'adam@orca.com')`,
		connection_name: "nobitex",
		title: "Adam Portfolio",
		color: "#a11043",
		api_key: "",
	}).execute();

	// Insert into public.asset
	await db.insertInto("public.asset").values([
		{
			name: "Bitcoin",
			symbol: "btc",
			logo: "https://bin.bnbstatic.com/static/assets/logos/BTC.png",
		},
		{
			name: "Ethereum",
			symbol: "eth",
			logo: "https://bin.bnbstatic.com/static/assets/logos/ETH.png",
		},
		{
			name: "Tether",
			symbol: "usdt",
			logo: "https://bin.bnbstatic.com/static/assets/logos/USDT.png",
		},
		{
			name: "Binance coin",
			symbol: "bnb",
			logo: "https://bin.bnbstatic.com/static/assets/logos/BNB.png",
		},
		{
			name: "Ton coin",
			symbol: "ton",
			logo: "https://bin.bnbstatic.com/static/assets/logos/TON.png",
		},
		{
			name: "Iranian Rial",
			symbol: "rls",
			alt_names: [`﷼`],
		},
	]).execute();
}
