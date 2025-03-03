import { Kysely, sql } from "kysely";
import { MOCK_ACCOUNTS } from "../../apps/backend/src/mock-connection/mock-connection.constant";

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
    await db
        .insertInto("public.connection")
        .values([
            {
                name: "mock",
                title: "Mock",
                type: "CEX",
                logo:
                    "https://img.icons8.com/?size=100&id=dxoYK8bxqiJr&format=png&color=000000",
                description: "Mock is the best exchange in the orca.",
                enabled: true,
            },
            {
                name: "nobitex",
                title: "Nobitex",
                type: "CEX",
                logo: "https://nobitex.ir/favicon.png",
                description: "Nobitex is a digital currency exchange in Iran.",
                enabled: true,
            },
            {
                name: "coinex",
                title: "Coinex",
                type: "CEX",
                logo: "https://www.coinex.com/assets/img/brand/svg/day-1.svg",
                description: "Coinex",
                enabled: true,
            },
        ])
        .execute();

    await db
        .insertInto("public.portfolio")
        .values(
            MOCK_ACCOUNTS.flatMap((account) =>
                account.portfolios.map((portfolio) => ({
                    user_id:
                        sql`(SELECT id FROM auth.users WHERE email = ${account.user})`,
                    connection_name: portfolio.connection_name,
                    title: portfolio.title,
                    color: portfolio.color,
                    meta: portfolio.meta,
                    group_id: portfolio.group_id,
                }))
            ),
        )
        .execute();

    await db
        .insertInto("public.asset")
        .values([
            {
                name: "Bitcoin",
                symbol: "btc",
                logo: "https://bin.bnbstatic.com/static/assets/logos/BTC.png",
            },
            {
                name: "Tether",
                symbol: "usdt",
                logo: "https://bin.bnbstatic.com/static/assets/logos/USDT.png",
            },
            {
                name: "Toman",
                symbol: "irt",
                logo: "https://nobitex.ir/_nuxt/img/irt.ee27747.svg",
            },
            {
                name: "Ethereum",
                symbol: "eth",
                logo: "https://bin.bnbstatic.com/static/assets/logos/ETH.png",
            },
            {
                name: "Binance coin",
                symbol: "bnb",
                logo: "https://bin.bnbstatic.com/static/assets/logos/BNB.png",
            },
            {
                name: "Ripple",
                symbol: "xrp",
                logo: "https://bin.bnbstatic.com/static/assets/logos/XRP.png",
            },
            {
                name: "Solana",
                symbol: "sol",
                logo: "https://bin.bnbstatic.com/static/assets/logos/TON.png",
            },
            {
                name: "Cardano",
                symbol: "ada",
                logo: "https://bin.bnbstatic.com/static/assets/logos/ADA.png",
            },
            {
                name: "Tron",
                symbol: "trx",
                logo: "https://bin.bnbstatic.com/static/assets/logos/TRX.png",
            },
            {
                name: "XAUT",
                symbol: "xaut",
                logo: "https://bin.bnbstatic.com/static/assets/logos/xaut.png",
            },
        ])
        .execute();
}
