-- seeds/connections_seed.sql
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
    );
INSERT INTO public.connections (name, title, type, logo, description, enabled)
VALUES (
        'nobitex',
        'Nobitex',
        'CEX',
        'https://nobitex.ir/favicon.png',
        'Nobitex is a digital currency exchange in Iran.',
        true
    );
INSERT INTO public.portfolios (
        user_id,
        connection_name,
        title,
        color
    )
VALUES (
        (
            SELECT id
            FROM auth.users
            WHERE email = 'adam@orca.com'
        ),
        'nobitex',
        'Adam Portfolio',
        '#a11043'
    );