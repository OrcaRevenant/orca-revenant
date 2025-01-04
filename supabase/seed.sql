-- seeds/connection_seed.sql
--  _   _               
-- | | | |___  ___ _ __ 
-- | | | / __|/ _ \ '__|
-- | |_| \__ \  __/ |   
--  \___/|___/\___|_|   
INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    )
VALUES (
        '00000000-0000-0000-0000-000000000000',
        uuid_generate_v4 (),
        'authenticated',
        'authenticated',
        'adam@orca.com',
        crypt('123456', gen_salt('bf')),
        current_timestamp,
        current_timestamp,
        current_timestamp,
        '{"provider":"email","providers":["email"]}',
        '{}',
        current_timestamp,
        current_timestamp,
        '',
        '',
        '',
        ''
    ),
    (
        '00000000-0000-0000-0000-000000000000',
        uuid_generate_v4 (),
        'authenticated',
        'authenticated',
        'eve@orca.com',
        crypt('123456', gen_salt('bf')),
        current_timestamp,
        current_timestamp,
        current_timestamp,
        '{"provider":"email","providers":["email"]}',
        '{}',
        current_timestamp,
        current_timestamp,
        '',
        '',
        '',
        ''
    );
INSERT INTO auth.identities (
        provider_id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    )
VALUES (
        uuid_generate_v4 (),
        (
            SELECT id
            FROM auth.users
            WHERE email = 'adam@orca.com'
        ),
        format(
            '{"sub":"%s","email":"%s"}',
            (
                SELECT id
                FROM auth.users
                WHERE email = 'adam@orca.com'
            )::text,
            'adam@orca.com'
        )::jsonb,
        'email',
        current_timestamp,
        current_timestamp,
        current_timestamp
    ),
    (
        uuid_generate_v4 (),
        (
            SELECT id
            FROM auth.users
            WHERE email = 'eve@orca.com'
        ),
        format(
            '{"sub":"%s","email":"%s"}',
            (
                SELECT id
                FROM auth.users
                WHERE email = 'eve@orca.com'
            )::text,
            'eve@orca.com'
        )::jsonb,
        'email',
        current_timestamp,
        current_timestamp,
        current_timestamp
    );
--   ____                            _   _             
--  / ___|___  _ __  _ __   ___  ___| |_(_) ___  _ __  
-- | |   / _ \| '_ \| '_ \ / _ \/ __| __| |/ _ \| '_ \ 
-- | |__| (_) | | | | | | |  __/ (__| |_| | (_) | | | |
--  \____\___/|_| |_|_| |_|\___|\___|\__|_|\___/|_| |_|
INSERT INTO public.connection (name, title, type, logo, description, enabled)
VALUES (
        'nobitex',
        'Nobitex',
        'CEX',
        'https://nobitex.ir/favicon.png',
        'Nobitex is a digital currency exchange in Iran.',
        true
    );
--  ____            _    __       _ _       
-- |  _ \ ___  _ __| |_ / _| ___ | (_) ___  
-- | |_) / _ \| '__| __| |_ / _ \| | |/ _ \ 
-- |  __/ (_) | |  | |_|  _| (_) | | | (_) |
-- |_|   \___/|_|   \__|_|  \___/|_|_|\___/ 
-- INSERT INTO public.portfolio (
--         user_id,
--         connection_name,
--         title,
--         color,
--         api_key
--     )
-- VALUES (
--         (
--             SELECT id
--             FROM auth.users
--             WHERE email = 'adam@orca.com'
--         ),
--         'nobitex',
--         'Adam Portfolio',
--         '#a11043',
--         '3099ac0863cd456d1a5977f847a4f334b6c4cc80'
--     );
--     _                 _   
--    / \   ___ ___  ___| |_ 
--   / _ \ / __/ __|/ _ \ __|
--  / ___ \\__ \__ \  __/ |_ 
-- /_/   \_\___/___/\___|\__|
INSERT INTO public.asset (name, symbol, logo)
VALUES (
        'Bitcoin',
        'btc',
        'https://bin.bnbstatic.com/static/assets/logos/BTC.png'
    ),
    (
        'Ethereum',
        'eth',
        'https://bin.bnbstatic.com/static/assets/logos/ETH.png'
    ),
    (
        'Tether',
        'usdt',
        'https://bin.bnbstatic.com/static/assets/logos/USDT.png'
    );