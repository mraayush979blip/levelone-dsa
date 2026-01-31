'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ArrowLeft, ShoppingBag, Sparkles } from 'lucide-react';
import Link from 'next/link';
import StoreItemCard, { StoreItem } from '@/components/gamification/StoreItemCard';
import PointsDisplay from '@/components/gamification/PointsDisplay';
import { toast } from 'sonner';
import { SlideUp, FadeIn } from '@/components/ui/motion-wrapper';
import { cn } from '@/lib/utils';

export default function StorePage() {
    const { user, refreshUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<StoreItem[]>([]);
    const [userPoints, setUserPoints] = useState(0);
    const [userStreak, setUserStreak] = useState(0);
    const [equippedItems, setEquippedItems] = useState<{ theme: string, banner: string, avatar: string }>({
        theme: 'default',
        banner: 'default',
        avatar: '👤'
    });
    const [inventory, setInventory] = useState<Set<string>>(new Set());
    const [purchasingId, setPurchasingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                if (!user) return;

                const { data: userData } = await supabase
                    .from('users')
                    .select('points, current_streak, equipped_theme, equipped_banner, equipped_avatar')
                    .eq('id', user.id)
                    .single();

                if (userData) {
                    setUserPoints(userData.points || 0);
                    setUserStreak(userData.current_streak || 0);
                    setEquippedItems({
                        theme: userData.equipped_theme || 'default',
                        banner: userData.equipped_banner || 'default',
                        avatar: userData.equipped_avatar || '👤'
                    });
                }

                const { data: invData } = await supabase
                    .from('user_inventory')
                    .select('item_id')
                    .eq('user_id', user.id);

                const invSet = new Set((invData || []).map((i: any) => i.item_id));
                setInventory(invSet);

                const { data: itemData } = await supabase
                    .from('store_items')
                    .select('*')
                    .order('cost', { ascending: true });

                const fetchedItems = itemData || [];

                const defaultItems: StoreItem[] = [
                    {
                        id: 'default-avatar-id',
                        code: 'CHAR_DEFAULT',
                        name: 'Student',
                        description: 'The standard Levelone student avatar.',
                        cost: 0,
                        type: 'avatar',
                        asset_value: '👤'
                    }
                ];

                let finalItems = [...defaultItems.filter(d => !fetchedItems.some(f => f.code === d.code)), ...fetchedItems]
                    .filter(item => item.code !== 'DEFAULT_BANNER');

                finalItems = finalItems.sort((a, b) => {
                    if (a.code === 'CHAR_DEFAULT') return -1;
                    if (b.code === 'CHAR_DEFAULT') return 1;
                    return a.cost - b.cost;
                });

                setItems(finalItems);

            } catch (error) {
                console.error('Error fetching store data:', error);
                toast.error('Failed to load store');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const handlePurchase = async (item: StoreItem) => {
        if (!user || purchasingId) return;
        setPurchasingId(item.id);
        try {
            const { data, error } = await supabase.rpc('purchase_item', { item_id_param: item.id });
            if (error) throw error;
            if (data.success) {
                toast.success(`Purchased ${item.name}!`);
                setUserPoints(data.new_balance);
                setInventory(prev => new Set(prev).add(item.id));
            } else {
                toast.error(data.message || 'Purchase failed');
            }
        } catch (error: any) {
            console.error('Purchase error:', error);
            toast.error(error.message || 'Failed to complete purchase');
        } finally {
            setPurchasingId(null);
        }
    };

    const handleEquip = async (item: StoreItem) => {
        try {
            if (!user) return;
            if (item.id === 'default-avatar-id' || item.id === 'default-banner-id' || item.id === 'default-theme-id') {
                let column = 'equipped_avatar';
                if (item.type === 'theme') column = 'equipped_theme';
                if (item.type === 'banner') column = 'equipped_banner';

                const { error } = await supabase
                    .from('users')
                    .update({ [column]: item.asset_value })
                    .eq('id', user.id);

                if (error) throw error;
                toast.success(`${item.name} Equipped!`);
                setEquippedItems(prev => ({ ...prev, [item.type]: item.asset_value }));
            } else {
                const { data, error } = await supabase.rpc('equip_item', { item_id_param: item.id });
                if (error) throw error;
                if (data.success) {
                    toast.success(`${item.name} Equipped!`);
                    if (item.type === 'theme') {
                        setEquippedItems(prev => ({ ...prev, theme: item.asset_value }));
                    } else if (item.type === 'banner') {
                        setEquippedItems(prev => ({ ...prev, banner: item.asset_value }));
                    } else if (item.type === 'avatar') {
                        setEquippedItems(prev => ({ ...prev, avatar: item.asset_value }));
                    }
                } else {
                    toast.error(data.message || 'Equip failed');
                    return;
                }
            }
            await refreshUser();
        } catch (error: any) {
            console.error('Equip error:', error);
            toast.error('Failed to equip item');
        }
    };

    const isItemEquipped = (item: StoreItem) => {
        if (item.type === 'theme') return equippedItems.theme === item.asset_value;
        if (item.type === 'banner') return equippedItems.banner === item.asset_value;
        if (item.type === 'avatar') return equippedItems.avatar === item.asset_value;
        return false;
    };

    const getLockedReason = (item: StoreItem): string | null => {
        if (item.required_streak && userStreak < item.required_streak) {
            return `${item.required_streak} Day Streak`;
        }
        return null;
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[60vh] space-y-4">
                <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Rewards...</p>
            </div>
        );
    }

    const isNeon = user?.equipped_theme === 'theme-neon';

    return (
        <div className={cn("max-w-6xl mx-auto px-6 py-12 space-y-16 pb-24 relative z-10", isNeon ? "text-white" : "text-slate-900")}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-slate-100 dark:border-white/5">
                <SlideUp>
                    <div className="space-y-4">
                        <Link href="/student" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">
                            <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Back to Dashboard
                        </Link>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-indigo-500">
                                <Sparkles className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Exclusives</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                                Points <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Store</span>
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-lg">Unlock premium cosmetics and character upgrades with your hard-earned points.</p>
                        </div>
                    </div>
                </SlideUp>

                <SlideUp delay={0.1}>
                    <PointsDisplay points={userPoints} />
                </SlideUp>
            </div>

            {/* Store Grid */}
            <FadeIn delay={0.2}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {items.map((item) => (
                        <StoreItemCard
                            key={item.id}
                            item={item}
                            isOwned={item.cost === 0 || inventory.has(item.id)}
                            isEquipped={isItemEquipped(item)}
                            canAfford={userPoints >= item.cost}
                            lockedReason={getLockedReason(item)}
                            onPurchase={handlePurchase}
                            onEquip={handleEquip}
                            purchasing={purchasingId === item.id}
                        />
                    ))}
                </div>
            </FadeIn>
        </div>
    );
}
