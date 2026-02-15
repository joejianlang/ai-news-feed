'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import Toast from '@/components/Toast';
import { ChevronRight, Camera, Mail, Phone, Lock, Bell, Moon, Trash2, LogOut, X, Loader2 } from 'lucide-react';

type ModalType = 'nickname' | 'email' | 'phone' | 'password' | 'delete' | null;

export default function SettingsPage() {
    const { user, isLoading, logout, checkAuth } = useUser();
    const router = useRouter();
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timer, setTimer] = useState(0);

    // Form states
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        code: ''
    });

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
        if (user) {
            setFormData(prev => ({
                ...prev,
                displayName: user.display_name || '',
                email: user.email || '',
                phone: user.phone || ''
            }));
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        let interval: any;
        if (timer > 0) {
            interval = setInterval(() => setTimer(prev => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    if (isLoading || !user) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const handleSendCode = async (type: 'email' | 'phone') => {
        const identifier = type === 'email' ? formData.email : formData.phone;
        if (!identifier) return setToast({ message: '请输入地址', type: 'error' });

        try {
            const res = await fetch('/api/user/send-change-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, identifier })
            });
            if (res.ok) {
                setToast({ message: '验证码已发送', type: 'success' });
                setTimer(60);
            } else {
                const data = await res.json();
                setToast({ message: data.error || '发送失败', type: 'error' });
            }
        } catch (e) {
            setToast({ message: '网络错误', type: 'error' });
        }
    };

    const handleUpdateProfile = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ display_name: formData.displayName })
            });
            if (res.ok) {
                setToast({ message: '修改成功', type: 'success' });
                setActiveModal(null);
                checkAuth();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyAndUpdate = async (type: 'email' | 'phone') => {
        setIsSubmitting(true);
        const identifier = type === 'email' ? formData.email : formData.phone;
        try {
            const res = await fetch('/api/user/verify-and-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, identifier, code: formData.code })
            });
            if (res.ok) {
                setToast({ message: '修改成功', type: 'success' });
                setActiveModal(null);
                checkAuth();
            } else {
                const data = await res.json();
                setToast({ message: data.error || '修改失败', type: 'error' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChangePassword = async () => {
        if (formData.password !== formData.confirmPassword) {
            return setToast({ message: '密码不一致', type: 'error' });
        }
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/user/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: formData.password })
            });
            if (res.ok) {
                setToast({ message: '密码修改成功', type: 'success' });
                setActiveModal(null);
            } else {
                const data = await res.json();
                setToast({ message: data.error || '修改失败', type: 'error' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderModal = () => {
        if (!activeModal) return null;

        const modalContent = {
            nickname: {
                title: '修改昵称',
                input: 'displayName',
                placeholder: '输入新昵称',
                action: handleUpdateProfile
            },
            email: {
                title: '修改邮箱',
                input: 'email',
                placeholder: '输入新邮箱',
                needOTP: true,
                action: () => handleVerifyAndUpdate('email')
            },
            phone: {
                title: '绑定手机',
                input: 'phone',
                placeholder: '输入手机号',
                needOTP: true,
                action: () => handleVerifyAndUpdate('phone')
            },
            password: {
                title: '修改密码',
                action: handleChangePassword
            },
            delete: {
                title: '注销账号',
                isDanger: true,
                action: () => { } // Implement delete logic
            }
        }[activeModal];

        return (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
                <div className="bg-white dark:bg-slate-900 w-full max-w-[400px] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-10">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black">{modalContent.title}</h3>
                            <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {activeModal === 'password' ? (
                                <>
                                    <input
                                        type="password"
                                        placeholder="新密码"
                                        className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                    <input
                                        type="password"
                                        placeholder="确认新密码"
                                        className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                        value={formData.confirmPassword}
                                        onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    />
                                </>
                            ) : activeModal === 'delete' ? (
                                <div className="text-center py-4">
                                    <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Trash2 className="w-8 h-8" />
                                    </div>
                                    <p className="font-bold text-slate-600 dark:text-slate-400">确定要注销账号吗？此操作无法撤销。</p>
                                </div>
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        placeholder={modalContent.placeholder}
                                        className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                        value={(formData as any)[modalContent.input!]}
                                        onChange={e => setFormData({ ...formData, [modalContent.input!]: e.target.value })}
                                    />
                                    {modalContent.needOTP && (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="验证码"
                                                className="flex-1 h-12 px-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                                value={formData.code}
                                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                                            />
                                            <button
                                                disabled={timer > 0}
                                                onClick={() => handleSendCode(activeModal as 'email' | 'phone')}
                                                className="px-4 h-12 bg-slate-100 dark:bg-slate-800 text-indigo-600 font-black rounded-xl disabled:text-slate-400 whitespace-nowrap min-w-[100px]"
                                            >
                                                {timer > 0 ? `${timer}s` : '获取'}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}

                            <button
                                disabled={isSubmitting}
                                onClick={modalContent.action}
                                className={`w-full h-12 rounded-xl font-black flex items-center justify-center gap-2 transition-all ${modalContent.isDanger
                                    ? 'bg-red-600 text-white shadow-lg shadow-red-500/20'
                                    : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                    }`}
                            >
                                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                {activeModal === 'delete' ? '确认注销' : '保存修改'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 flex items-center gap-4">
                <button onClick={() => router.back()} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors font-bold">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <h1 className="text-xl font-black italic">设置.</h1>
            </div>

            <div className="max-w-[600px] mx-auto p-4 space-y-6">
                {/* Profile Section */}
                <section className="space-y-3">
                    <h2 className="px-2 text-[11px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">个人身份</h2>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
                        <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                            <div className="flex items-center gap-4 text-left">
                                <div className="relative">
                                    <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm transition-transform group-hover:scale-105">
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-indigo-600 dark:text-indigo-400 font-black text-xl">{user.email?.[0].toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 p-1 bg-indigo-600 rounded-full text-white border-2 border-white dark:border-slate-900 shadow-sm">
                                        <Camera className="w-3 h-3" />
                                    </div>
                                </div>
                                <div>
                                    <div className="font-black text-[16px]">头像</div>
                                    <div className="text-[12px] text-slate-400 font-bold">点击上传新头像</div>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-indigo-500 transition-colors" />
                        </button>
                        <div className="h-px bg-slate-100 dark:bg-slate-800/50 mx-4"></div>
                        <button onClick={() => setActiveModal('nickname')} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                            <div className="flex flex-col text-left">
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-tight mb-0.5">显示名称</span>
                                <span className="font-black text-[15px]">{user.display_name || '匿名用户'}</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-indigo-500 transition-colors" />
                        </button>
                    </div>
                </section>

                {/* Security Section */}
                <section className="space-y-3">
                    <h2 className="px-2 text-[11px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">安全与隐私</h2>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
                        <button onClick={() => setActiveModal('email')} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                            <div className="flex items-center gap-4 text-left">
                                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-black text-[15px]">账号邮箱</div>
                                    <div className="text-[12px] text-slate-400 font-bold">{user.email}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-green-500/10 text-green-500 px-2.5 py-1 rounded-full font-black uppercase tracking-tighter">已验证</span>
                                <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-indigo-500 transition-colors" />
                            </div>
                        </button>
                        <div className="h-px bg-slate-100 dark:bg-slate-800/50 mx-4"></div>
                        <button onClick={() => setActiveModal('phone')} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                            <div className="flex items-center gap-4 text-left">
                                <div className="p-2.5 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition-all duration-300">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-black text-[15px]">手机号码</div>
                                    <div className="text-[12px] text-slate-400 font-bold">{user.phone || '未绑定'}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {!user.phone && <span className="text-[10px] bg-orange-500/10 text-orange-500 px-2.5 py-1 rounded-full font-black uppercase tracking-tighter">未绑定</span>}
                                <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-indigo-500 transition-colors" />
                            </div>
                        </button>
                        <div className="h-px bg-slate-100 dark:bg-slate-800/50 mx-4"></div>
                        <button onClick={() => setActiveModal('password')} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <div className="font-black text-[15px]">修改密码</div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-indigo-500 transition-colors" />
                        </button>
                    </div>
                </section>

                {/* Ads Section */}
                <section className="space-y-3">
                    <h2 className="px-2 text-[11px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">广告管理</h2>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
                        <button onClick={() => router.push('/profile/ads')} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 rounded-xl group-hover:bg-pink-600 group-hover:text-white transition-all duration-300">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 5L6 9H2V15H6L11 19V5Z" /><path d="M15.54 8.46002C16.4774 9.39766 17.0041 10.6692 17.0041 11.995C17.0041 13.3208 16.4774 14.5924 15.54 15.53" /><path d="M19.07 4.93005C20.9448 6.80531 21.9979 9.34842 21.9979 12.0001C21.9979 14.6517 20.9448 17.1948 19.07 19.0701" /></svg>
                                </div>
                                <div className="font-black text-[15px]">我的广告</div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-indigo-500 transition-colors" />
                        </button>
                        <div className="h-px bg-slate-100 dark:bg-slate-800/50 mx-4"></div>
                        <button onClick={() => router.push('/ads/create')} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 rounded-xl group-hover:bg-cyan-600 group-hover:text-white transition-all duration-300">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5V19M5 12H19" /></svg>
                                </div>
                                <div className="font-black text-[15px]">发布推广</div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-indigo-500 transition-colors" />
                        </button>
                    </div>
                </section>

                {/* Preferences Section */}
                <section className="space-y-3">
                    <h2 className="px-2 text-[11px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">系统偏好</h2>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl">
                                    <Bell className="w-5 h-5" />
                                </div>
                                <div className="font-black text-[15px]">推送通知</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                        <div className="h-px bg-slate-100 dark:bg-slate-800/50 mx-4"></div>
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                    <Moon className="w-5 h-5" />
                                </div>
                                <div className="font-black text-[15px]">深色模式</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                    </div>
                </section>

                {/* Danger Zone */}
                <section className="space-y-3">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
                        <button onClick={() => setActiveModal('delete')} className="w-full flex items-center justify-between p-4 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group">
                            <div className="flex items-center gap-4 text-red-600 text-left">
                                <div className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-xl">
                                    <Trash2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-black text-[15px]">注销账号</div>
                                    <div className="text-[11px] text-red-400 font-bold uppercase tracking-tight">不可逆操作</div>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-red-100 group-hover:text-red-500 transition-colors" />
                        </button>
                    </div>
                </section>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="w-full h-14 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-black rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-[0.98]"
                >
                    <LogOut className="w-5 h-5" />
                    退出当前账号
                </button>

                <p className="text-center text-slate-300 dark:text-slate-700 text-[10px] font-black pt-4 pb-8 uppercase tracking-[0.2em] animate-pulse">数位 Buffet 引擎 v1.2</p>
            </div>

            {activeModal && renderModal()}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
