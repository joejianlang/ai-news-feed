'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, ChevronRight } from 'lucide-react';
import { renderMarkdown } from '@/lib/utils/markdown';

interface AgreementModalProps {
    isOpen: boolean;
    onClose: () => void;
    agreementKey: string;
}

export default function AgreementModal({ isOpen, onClose, agreementKey }: AgreementModalProps) {
    const [agreement, setAgreement] = useState<{ title: string; content: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchAgreement();
        }
    }, [isOpen, agreementKey]);

    const fetchAgreement = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/agreements?key=${agreementKey}`);
            const data = await res.json();
            if (data[agreementKey]) {
                setAgreement(data[agreementKey]);
            }
        } catch (error) {
            console.error('Failed to fetch agreement:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
            onClick={onClose}
        >
            <div
                className="bg-background w-full max-w-2xl max-h-[80vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-card-border animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-card-border flex items-center justify-between bg-card shrink-0">
                    <div className="flex items-center gap-2">
                        <FileText className="text-teal-600" size={20} />
                        <h3 className="font-black italic">{agreement?.title || '协议详情'}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-black/5 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-slate-900">
                    {isLoading ? (
                        <div className="space-y-4 animate-pulse">
                            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4"></div>
                            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-5/6"></div>
                            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                        </div>
                    ) : (
                        <div
                            className="prose dark:prose-invert max-w-none text-sm leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(agreement?.content || '') }}
                        />
                    )}
                </div>

                <div className="p-6 border-t border-card-border bg-card flex justify-center shrink-0">
                    <button
                        onClick={onClose}
                        className="px-10 py-3 bg-teal-600 text-white font-black rounded-2xl shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center gap-2"
                    >
                        朕已阅
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
