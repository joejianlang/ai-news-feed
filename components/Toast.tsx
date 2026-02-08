'use client';

import { useState, useEffect } from 'react';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    onClose: () => void;
    duration?: number;
}

export default function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for fade-out animation
        }, duration);

        return () => clearTimeout(timer);
    }, [onClose, duration]);

    const bgColor = type === 'error' ? 'bg-red-500' : 'bg-teal-600';

    return (
        <div
            className={`fixed top-5 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
                }`}
        >
            <div className={`${bgColor} text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 min-w-[200px] justify-center`}>
                {type === 'success' && <span>✅</span>}
                {type === 'error' && <span>❌</span>}
                <span className="font-medium">{message}</span>
            </div>
        </div>
    );
}
