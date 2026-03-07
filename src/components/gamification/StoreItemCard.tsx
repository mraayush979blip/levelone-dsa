'use client';

import { Lock, Check, ShoppingBag, AlertCircle, Sparkles, Image as ImageIcon, Palette, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface StoreItem {
    id: string;
    code: string;
    name: string;
    description: string;
    cost: number;
    type: string;
    asset_value: string;
    required_badge_id?: string;
    required_streak?: number;
}

interface StoreItemCardProps {
    item: StoreItem;
    isOwned: boolean;
    isEquipped: boolean;
    canAfford: boolean;
    lockedReason: string | null;
    onPurchase: (item: StoreItem) => void;
    onEquip: (item: StoreItem) => void;
    purchasing: boolean;
}

export default function StoreItemCard({
    item,
    isOwned,
    isEquipped,
    canAfford,
    lockedReason,
    onPurchase,
    onEquip,
    purchasing
}: StoreItemCardProps) {
    const isLocked = !!lockedReason;

    const Icon = item.type === 'theme' ? Palette : item.type === 'banner' ? ImageIcon : UserIcon;

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className={cn(
                "group relative bg-white dark:bg-white/5 rounded-3xl border transition-all duration-300 flex flex-col h-full overflow-hidden",
                isEquipped ? "border-indigo-500/50 shadow-xl shadow-indigo-500/5" : "border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 shadow-sm"
            )}
        >
            {/* Visual Preview */}
            <div className={cn(
                "h-32 flex items-center justify-center relative bg-[url('/grid.svg')] bg-[length:16px_16px]",
                isEquipped ? "bg-indigo-500/5" : "bg-slate-50/50 dark:bg-black/20"
            )}>
                <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110",
                    isEquipped ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/20" : "bg-white dark:bg-white/5 text-slate-400 border border-slate-100 dark:border-white/5"
                )}>
                    {item.type === 'avatar' ? (
                        <span className="text-3xl">{item.asset_value}</span>
                    ) : (
                        <Icon className="w-8 h-8" />
                    )}
                </div>

                {isEquipped && (
                    <div className="absolute top-4 right-4 bg-indigo-600 text-white p-1 rounded-full shadow-lg">
                        <Check className="h-3 w-3" />
                    </div>
                )}

                {isLocked && (
                    <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2">
                            <Lock className="h-4 w-4 text-slate-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{lockedReason}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-bold tracking-tight text-foreground">{item.name}</h3>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest bg-card border border-card-border text-muted">
                        {item.type}
                    </span>
                </div>

                <p className="text-xs text-muted font-medium mb-6 flex-1 line-clamp-2 leading-relaxed">
                    {item.description}
                </p>

                <div className="mt-auto">
                    {isOwned ? (
                        <button
                            onClick={() => onEquip(item)}
                            disabled={isEquipped}
                            className={cn(
                                "w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                                isEquipped
                                    ? "bg-slate-100 dark:bg-white/5 text-slate-400 cursor-default"
                                    : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 active:scale-95"
                            )}
                        >
                            {isEquipped ? 'Active' : 'Equip Item'}
                        </button>
                    ) : (
                        <button
                            onClick={() => onPurchase(item)}
                            disabled={isLocked || !canAfford || purchasing}
                            className={cn(
                                "w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                isLocked || !canAfford
                                    ? "bg-slate-50 dark:bg-white/5 text-slate-400 cursor-not-allowed"
                                    : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.02] shadow-xl group/btn"
                            )}
                        >
                            {purchasing ? (
                                <span className="animate-pulse">Processing...</span>
                            ) : (
                                <>
                                    {!canAfford && <AlertCircle className="h-3.5 w-3.5 opacity-50" />}
                                    <span>{item.cost.toLocaleString()} Points</span>
                                    {!isLocked && canAfford && <ShoppingBag className="h-3.5 w-3.5 transition-transform group-hover/btn:rotate-12" />}
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
