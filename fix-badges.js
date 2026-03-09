require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    const badges = [
        { code: 'FIRST_PHASE', name: 'First Steps', description: 'Complete your first learning phase', icon_name: 'Star', category: 'completion', requirement_type: 'phases_count', requirement_value: 1 },
        { code: 'STREAK_3', name: 'On Fire', description: 'Maintain a 3-day streak', icon_name: 'Flame', category: 'streak', requirement_type: 'streak_days', requirement_value: 3 },
        { code: 'STREAK_7', name: 'Fireball', description: 'Maintain a 7-day streak', icon_name: 'Flame', category: 'streak', requirement_type: 'streak_days', requirement_value: 7 },
        { code: 'STREAK_30', name: 'Inferno', description: 'Maintain a 30-day streak', icon_name: 'Flame', category: 'streak', requirement_type: 'streak_days', requirement_value: 30 },
        { code: 'PHASE_5', name: 'Dedicated Scholar', description: 'Complete 5 learning phases', icon_name: 'BookOpen', category: 'completion', requirement_type: 'phases_count', requirement_value: 5 },
        { code: 'PHASE_10', name: 'Master', description: 'Complete 10 learning phases', icon_name: 'Award', category: 'completion', requirement_type: 'phases_count', requirement_value: 10 }
    ];

    console.log('Inserting standard badges...');
    for (const b of badges) {
        // Try to insert
        await supabase.from('badges').upsert(b, { onConflict: 'code' });
    }

    console.log('Fetching students to evaluate...');
    const { data: students } = await supabase.from('users').select('id, name').eq('role', 'student');

    for (const student of students) {
        console.log('Evaluating for:', student.name);
        const { error } = await supabase.rpc('evaluate_achievements', { student_uuid: student.id });
        if (error) {
            console.error('Error on', student.name, error);
        }
    }

    console.log('All done!');
}

main();
