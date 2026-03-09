import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { username, problemSlug } = await req.json();

        if (!username || !problemSlug) {
            return NextResponse.json({ success: false, error: 'Username and Problem Slug are required' }, { status: 400 });
        }

        const query = `
            query recentAcSubmissions($username: String!, $limit: Int!) {
                recentAcSubmissionList(username: $username, limit: $limit) {
                    titleSlug
                }
            }
        `;

        const variables = {
            username: username,
            limit: 20 // Check last 20 AC submissions
        };

        const response = await fetch('https://leetcode.com/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            body: JSON.stringify({ query, variables }),
        });

        const data = await response.json();

        if (data.errors) {
            return NextResponse.json({ success: false, error: 'User not found or LeetCode API error' }, { status: 404 });
        }

        const submissions = data.data.recentAcSubmissionList || [];
        const isSolved = submissions.some((sub: any) => sub.titleSlug === problemSlug);

        if (isSolved) {
            return NextResponse.json({ success: true, message: 'Problem verified successfully!' });
        } else {
            return NextResponse.json({
                success: false,
                error: 'Problem not found in your recent solved list. Please make sure you solved it and your profile is public.'
            });
        }

    } catch (error: any) {
        console.error('LeetCode verification error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
