import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Time utility functions

export function getTimeUntilDeadline(endDate: string): {
    seconds: number;
    formatted: string;
    isExpired: boolean;
} {
    const now = new Date();
    // Inclusive: Deadline is the LAST SECOND of that day
    const deadline = new Date(endDate);
    deadline.setHours(23, 59, 59, 999);
    
    const diff = deadline.getTime() - now.getTime();

    if (diff <= 0) {
        return { seconds: 0, formatted: 'Deadline passed', isExpired: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    const formatted = `${days}d ${hours}h ${minutes}m`;

    return { seconds: Math.floor(diff / 1000), formatted, isExpired: false };
}

// Phase status computer
export function getPhaseStatus(
    startDate: string,
    endDate: string,
    isPaused: boolean
): 'upcoming' | 'live' | 'ended' | 'paused' {
    const now = new Date();
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0); // Start of day

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // End of day (inclusive)

    if (isPaused) return 'paused';
    if (now < start) return 'upcoming';
    if (now > end) return 'ended';
    return 'live';
}

// Format seconds to human readable time
export function formatSeconds(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

// Validate GitHub URL
export function isValidGithubUrl(url: string): boolean {
    return /^https:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+\/?$/.test(url);
}

// Validate YouTube URL
export function isValidYoutubeUrl(url: string): boolean {
    return /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/.test(url);
}

// Extract YouTube video ID
export function extractYoutubeVideoId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

// Validate email
export function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
