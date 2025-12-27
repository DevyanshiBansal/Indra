import { supabase } from './supabase';

// Content Types
export interface ContentItem {
    id: string;
    type: 'scheme' | 'news' | 'blog' | 'story';
    category: string;
    title: string;
    excerpt: string;
    content?: string;
    date: string;
    author?: string;
    source_url?: string;
    image_url?: string;
    tags?: string[];
    is_featured: boolean;
    created_at: string;
    updated_at: string;
}

export interface ContentStats {
    total_users: number;
    water_saved_liters: number;
    verified_vendors: number;
    avg_savings: number;
}

// Fallback/mock data for when API is not available
const fallbackContent: ContentItem[] = [
    {
        id: '1',
        type: 'scheme',
        category: 'Government',
        title: 'Jal Shakti Abhiyan: 50% Subsidy on RWH Systems',
        excerpt: 'Central government announces major subsidy for residential rainwater harvesting installations across India.',
        date: new Date().toISOString(),
        is_featured: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source_url: 'https://jalshakti-ddws.gov.in/',
    },
    {
        id: '2',
        type: 'news',
        category: 'Policy',
        title: 'Karnataka Makes RWH Mandatory for Buildings Above 60 sqm',
        excerpt: 'New state regulation joins Bengaluru, Chennai in enforcing rainwater harvesting compliance.',
        date: new Date().toISOString(),
        is_featured: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source_url: '#',
    },
    {
        id: '3',
        type: 'blog',
        category: 'Education',
        title: 'Complete Guide: Setting Up RWH in Your Apartment',
        excerpt: 'Expert tips on implementing rainwater harvesting in multi-story residential buildings.',
        date: new Date().toISOString(),
        author: 'INDRA Team',
        is_featured: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: '4',
        type: 'story',
        category: 'Inspiration',
        title: 'How Vasant Kunj Society Saved ₹8 Lakhs Annually',
        excerpt: 'A community-driven initiative that transformed water management for 200+ families.',
        date: new Date().toISOString(),
        is_featured: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: '5',
        type: 'scheme',
        category: 'Government',
        title: 'Atal Bhujal Yojana: Groundwater Recharge Incentives',
        excerpt: 'State-wise financial assistance for installing recharge pits and borewells.',
        date: new Date().toISOString(),
        is_featured: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source_url: 'https://ataljal.mowr.gov.in/',
    },
    {
        id: '6',
        type: 'news',
        category: 'Technology',
        title: 'IIT Delhi Develops Smart RWH Monitoring System',
        excerpt: 'IoT-enabled solution tracks water collection, quality, and provides maintenance alerts.',
        date: new Date().toISOString(),
        is_featured: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];

const fallbackStats: ContentStats = {
    total_users: 10000,
    water_saved_liters: 50000000,
    verified_vendors: 500,
    avg_savings: 25000,
};

// API Functions

/**
 * Fetch all content items with optional filtering
 */
export async function fetchContent(options?: {
    type?: ContentItem['type'];
    category?: string;
    featured?: boolean;
    limit?: number;
}): Promise<ContentItem[]> {
    try {
        let query = supabase
            .from('content')
            .select('*')
            .order('date', { ascending: false });

        if (options?.type) {
            query = query.eq('type', options.type);
        }
        if (options?.category) {
            query = query.eq('category', options.category);
        }
        if (options?.featured !== undefined) {
            query = query.eq('is_featured', options.featured);
        }
        if (options?.limit) {
            query = query.limit(options.limit);
        }

        const { data, error } = await query;

        if (error) {
            console.warn('Supabase fetch error, using fallback:', error.message);
            return filterFallbackContent(options);
        }

        return data as ContentItem[];
    } catch (error) {
        console.warn('API unavailable, using fallback content');
        return filterFallbackContent(options);
    }
}

/**
 * Fetch a single content item by ID
 */
export async function fetchContentById(id: string): Promise<ContentItem | null> {
    try {
        const { data, error } = await supabase
            .from('content')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.warn('Supabase fetch error:', error.message);
            return fallbackContent.find(item => item.id === id) || null;
        }

        return data as ContentItem;
    } catch (error) {
        console.warn('API unavailable');
        return fallbackContent.find(item => item.id === id) || null;
    }
}

/**
 * Fetch platform statistics
 */
export async function fetchStats(): Promise<ContentStats> {
    try {
        const { data, error } = await supabase
            .from('stats')
            .select('*')
            .single();

        if (error) {
            console.warn('Stats fetch error, using fallback:', error.message);
            return fallbackStats;
        }

        return data as ContentStats;
    } catch (error) {
        console.warn('API unavailable, using fallback stats');
        return fallbackStats;
    }
}

/**
 * Subscribe to real-time content updates
 */
export function subscribeToContent(
    callback: (payload: { new: ContentItem; old: ContentItem | null; eventType: string }) => void
) {
    const subscription = supabase
        .channel('content_changes')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'content' },
            (payload) => {
                callback({
                    new: payload.new as ContentItem,
                    old: payload.old as ContentItem | null,
                    eventType: payload.eventType,
                });
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(subscription);
    };
}

/**
 * Subscribe to real-time stats updates
 */
export function subscribeToStats(callback: (stats: ContentStats) => void) {
    const subscription = supabase
        .channel('stats_changes')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'stats' },
            (payload) => {
                callback(payload.new as ContentStats);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(subscription);
    };
}

// Helper to filter fallback content
function filterFallbackContent(options?: {
    type?: ContentItem['type'];
    category?: string;
    featured?: boolean;
    limit?: number;
}): ContentItem[] {
    let result = [...fallbackContent];

    if (options?.type) {
        result = result.filter(item => item.type === options.type);
    }
    if (options?.category) {
        result = result.filter(item => item.category === options.category);
    }
    if (options?.featured !== undefined) {
        result = result.filter(item => item.is_featured === options.featured);
    }
    if (options?.limit) {
        result = result.slice(0, options.limit);
    }

    return result;
}

// Format date helper
export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}
