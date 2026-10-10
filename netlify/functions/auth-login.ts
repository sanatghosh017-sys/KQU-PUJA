export const handler = async (event: { httpMethod: string; body: string | null }) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { userId, password } = JSON.parse(event.body || '{}');
    const inputUser = (userId || '').trim().toLowerCase();
    const inputPass = (password || '').trim().toLowerCase();

    const isAdmin = (inputUser === 'kqu2026' && inputPass === '712407') ||
                    (inputUser === 'admin' && inputPass === 'durga2026') ||
                    (inputUser === 'kqu' && inputPass === 'kqu2026');

    const isUnit = inputUser.startsWith('unit') && inputPass === 'kqu';

    if (isAdmin) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          user: {
            role: 'admin',
            userId: 'KQU2026',
            name: 'Committee Admin (KQU2026)',
            canChangeData: true,
          },
        }),
      };
    } else if (isUnit) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          user: {
            role: 'unit',
            userId: inputUser.toUpperCase(),
            name: `${inputUser.toUpperCase()} User (Enter Once)`,
            canChangeData: false,
          },
        }),
      };
    }

    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Invalid credentials. Unit: UNIT1.. & KQU. Admin: KQU2026 & 712407',
      }),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: message }),
    };
  }
};
