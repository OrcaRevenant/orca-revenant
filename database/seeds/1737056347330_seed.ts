import { Kysely, sql } from "kysely";
import { MOCK_ACCOUNTS } from "../../apps/backend/src/mock-connection/mock-connection.constant";

export async function seed(db: Kysely<any>): Promise<void> {
  // Insert into auth.users
  await db
    .insertInto("auth.users")
    .values([
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
        raw_app_meta_data: sql`'{"provider":"email","providers":["email"]}'`,
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
        raw_app_meta_data: sql`'{"provider":"email","providers":["email"]}'`,
        raw_user_meta_data: sql`'{}'`,
        created_at: sql`current_timestamp`,
        updated_at: sql`current_timestamp`,
        confirmation_token: "",
        email_change: "",
        email_change_token_new: "",
        recovery_token: "",
      },
    ])
    .execute();

  // Insert into auth.identities
  await db
    .insertInto("auth.identities")
    .values([
      {
        provider_id: sql`uuid_generate_v4()`,
        user_id: sql`(SELECT id FROM auth.users WHERE email = 'adam@orca.com')`,
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
        user_id: sql`(SELECT id FROM auth.users WHERE email = 'eve@orca.com')`,
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
    ])
    .execute();

  // Insert into public.connection
  await db
    .insertInto("public.connection")
    .values([
      {
        name: "mock",
        title: "Mock",
        type: "CEX",
        logo: "http://127.0.0.1:54321/storage/v1/object/public/logos/connections/unknown.svg",
        description: "Mock is the best exchange in the orca.",
        schema: {
          type: "object",
          properties: {
            api_key: {
              type: "string",
              description: "The API key for the exchange.",
            },
          },
          required: ["api_key"],
        },
        enabled: true,
      },
      {
        name: "nobitex",
        title: "Nobitex",
        type: "CEX",
        logo: "http://127.0.0.1:54321/storage/v1/object/public/logos/connections/nobitex.svg",
        description: "Nobitex is a digital currency exchange in Iran.",
        enabled: true,
        schema: {
          type: "object",
          properties: {
            api_key: {
              type: "string",
              description: "The API key for the exchange.",
            },
          },
          required: ["api_key"],
        },
      },
      {
        name: "coinex",
        title: "Coinex",
        type: "CEX",
        logo: "http://127.0.0.1:54321/storage/v1/object/public/logos/connections/coinex.svg",
        description: "Coinex",
        enabled: true,
        schema: {
          type: "object",
          properties: {
            api_key: {
              type: "string",
              description: "The API key for the exchange.",
            },
            secret_key: {
              type: "string",
              description: "The API secret for the exchange.",
            },
          },
          required: ["api_key", "secret_key"],
        },
      },
    ])
    .execute();

  await db
    .insertInto("public.portfolio")
    .values(
      MOCK_ACCOUNTS.flatMap((account) =>
        account.portfolios.map((portfolio) => ({
          user_id: sql`(SELECT id FROM auth.users WHERE email = ${account.user})`,
          connection_name: portfolio.connection_name,
          title: portfolio.title,
          color: portfolio.color,
          meta: portfolio.meta,
          group_id: portfolio.group_id,
        }))
      )
    )
    .execute();

  await db
    .insertInto("public.asset")
    .values([
      {
        name: "Bitcoin",
        symbol: "btc",
        logo: "http://127.0.0.1:54321/storage/v1/object/public/logos/assets/btc.svg",
      },
      {
        name: "Ethereum",
        symbol: "eth",
        logo: "http://127.0.0.1:54321/storage/v1/object/public/logos/assets/eth.svg",
      },
      {
        name: "Tether",
        symbol: "usdt",
        logo: "http://127.0.0.1:54321/storage/v1/object/public/logos/assets/usdt.svg",
      },
      {
        name: "USD Coin",
        symbol: "usdc",
        logo: "http://127.0.0.1:54321/storage/v1/object/public/logos/assets/usdc.svg",
      },
      {
        name: "Binance Coin",
        symbol: "bnb",
        logo: "http://127.0.0.1:54321/storage/v1/object/public/logos/assets/bnb.svg",
      },
      {
        name: "XRP",
        symbol: "xrp",
        logo: "http://127.0.0.1:54321/storage/v1/object/public/logos/assets/xrp.svg",
      },
      {
        name: "Cardano",
        symbol: "ada",
        logo: "http://127.0.0.1:54321/storage/v1/object/public/logos/assets/ada.svg",
      },
      {
        name: "Dogecoin",
        symbol: "doge",
        logo: "http://127.0.0.1:54321/storage/v1/object/public/logos/assets/doge.svg",
      },
      {
        name: "Solana",
        symbol: "sol",
        logo: "http://127.0.0.1:54321/storage/v1/object/public/logos/assets/sol.svg",
      },
      {
        name: "Polkadot",
        symbol: "dot",
        logo: "http://127.0.0.1:54321/storage/v1/object/public/logos/assets/dot.svg",
      },
      // {
      //   name: "Iranian Toman",
      //   symbol: "irt",
      // },
    ])
    .execute();
}
