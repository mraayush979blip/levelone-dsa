const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://ijpvephwwuggqamveqrd.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcHZlcGh3d3VnZ3FhbXZlcXJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA1ODI3MywiZXhwIjoyMDg4NjM0MjczfQ.Hh32BzS7f5Ols9Y8ykwhkF1D76N-7nFxz0DE4Gs71lo'
);

async function test() {
    const { data, error } = await supabase.rpc('get_leaderboard_v2');
    console.log('Result from get_leaderboard_v2:');
    if (error) {
        console.error('ERROR:', error);
    } else {
        console.dir(data, { depth: null });
    }

    // Also manually fetch the users table simply
    const { data: users, error: err2 } = await supabase.from('users').select('*').limit(5);
    console.log('\nResult from users table directly:');
    if (err2) {
        console.error('ERROR:', err2);
    } else {
        console.log('Found', users.length, 'users');
        console.dir(users, { depth: null });
    }
}

test();
