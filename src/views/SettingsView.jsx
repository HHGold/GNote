import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, LogOut, Cloud, CloudOff, User, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotes } from '../context/NotesContext';

// Google Logo SVG 元件
const GoogleLogo = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

// 同步狀態圖示
const SyncStatusBadge = ({ status }) => {
    const config = {
        synced: { icon: Cloud, color: '#34C759', text: '已同步' },
        syncing: { icon: Cloud, color: 'var(--accent-color)', text: '同步中...' },
        offline: { icon: CloudOff, color: 'var(--text-secondary)', text: '離線模式' },
        idle: { icon: CloudOff, color: 'var(--text-secondary)', text: '未連線' },
        error: { icon: AlertCircle, color: '#ff3b30', text: '同步失敗' },
    };
    const { icon: Icon, color, text } = config[status] || config.idle;
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '13px', color,
        }}>
            <Icon size={14} />
            <span>{text}</span>
            {status === 'syncing' && (
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                    style={{ width: 12, height: 12 }}
                >
                    <div style={{
                        width: 12, height: 12,
                        border: `2px solid ${color}`,
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                    }} />
                </motion.div>
            )}
        </div>
    );
};

const SettingsView = () => {
    const navigate = useNavigate();
    const { user, isLoggedIn, loginWithGoogle, logout, loading, error, isFirebaseReady } = useAuth();
    const { syncStatus } = useNotes();
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogin = async () => {
        setIsLoggingIn(true);
        await loginWithGoogle();
        setIsLoggingIn(false);
    };

    const handleLogout = async () => {
        await logout();
        setShowLogoutConfirm(false);
    };

    return (
        <motion.div
            className="view-container"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
        >
            <header className="header">
                <button className="back-button" onClick={() => navigate('/')}>
                    <ChevronLeft size={28} />
                    <span>返回</span>
                </button>
                <div className="header-title">設定</div>
                <div style={{ width: 50 }}></div>
            </header>

            <main className="content-scroll">
                {/* Firebase 未設定提示 */}
                {!isFirebaseReady && (
                    <div style={{
                        background: 'rgba(255, 149, 0, 0.1)',
                        border: '1px solid rgba(255, 149, 0, 0.3)',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        marginBottom: '16px',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        color: 'var(--text-primary)',
                    }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>⚠️ 雲端同步尚未設定</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                            開發者需在 <code style={{
                                background: 'rgba(142,142,147,0.12)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '12px',
                            }}>src/firebase.js</code> 填入 Firebase 設定資訊才能啟用雲端同步和分享功能。
                        </div>
                    </div>
                )}

                {/* === 帳號區域 === */}
                {isLoggedIn ? (
                    <section className="premium-card" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        marginBottom: '24px',
                    }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: '50%',
                            overflow: 'hidden', flexShrink: 0,
                            background: 'var(--accent-light)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            {user.photoURL ? (
                                <img
                                    src={user.photoURL}
                                    alt="頭像"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <User size={28} color="var(--accent-color)" />
                            )}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{
                                fontWeight: 600, fontSize: '18px',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                                {user.displayName || '使用者'}
                            </div>
                            <div style={{
                                color: 'var(--text-secondary)', fontSize: '14px',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                                {user.email}
                            </div>
                            <SyncStatusBadge status={syncStatus} />
                        </div>
                    </section>
                ) : (
                    <section className="premium-card" style={{
                        textAlign: 'center',
                        padding: '32px 24px',
                        marginBottom: '24px',
                    }}>
                        <div style={{
                            width: 72, height: 72, borderRadius: '50%',
                            background: 'var(--accent-light)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px',
                        }}>
                            <Cloud size={36} color="var(--accent-color)" />
                        </div>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
                            雲端同步
                        </h2>
                        <p style={{
                            color: 'var(--text-secondary)', fontSize: '15px',
                            lineHeight: '1.5', marginBottom: '24px',
                        }}>
                            登入 Google 帳號<br />
                            在多個裝置間同步你的備忘錄<br />
                            並可將備忘錄分享給其他人
                        </p>

                        <button
                            onClick={handleLogin}
                            disabled={isLoggingIn || loading || !isFirebaseReady}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                width: '100%',
                                padding: '14px 20px',
                                borderRadius: '12px',
                                background: 'var(--surface-color)',
                                border: '1.5px solid var(--divider-color)',
                                fontSize: '16px',
                                fontWeight: 600,
                                cursor: (isLoggingIn || !isFirebaseReady) ? 'not-allowed' : 'pointer',
                                opacity: (isLoggingIn || !isFirebaseReady) ? 0.5 : 1,
                                transition: 'all 0.2s',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            }}
                        >
                            {isLoggingIn ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                    style={{ width: 20, height: 20 }}
                                >
                                    <div style={{
                                        width: 20, height: 20,
                                        border: '2px solid var(--divider-color)',
                                        borderTopColor: 'var(--accent-color)',
                                        borderRadius: '50%',
                                    }} />
                                </motion.div>
                            ) : (
                                <GoogleLogo size={20} />
                            )}
                            <span>{isLoggingIn ? '登入中...' : '使用 Google 帳號登入'}</span>
                        </button>

                        {error && (
                            <div style={{
                                marginTop: '12px',
                                color: '#ff3b30',
                                fontSize: '13px',
                            }}>
                                {error}
                            </div>
                        )}
                    </section>
                )}

                {/* === 登出 === */}
                {isLoggedIn && (
                    <section className="premium-card" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
                        <button
                            onClick={() => setShowLogoutConfirm(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                width: '100%', padding: '16px',
                                textAlign: 'left',
                            }}
                        >
                            <div style={{
                                width: 32, height: 32, borderRadius: '8px',
                                background: '#ff3b30',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <LogOut size={18} color="white" />
                            </div>
                            <div>
                                <div style={{ fontWeight: 500, fontSize: '16px', color: '#ff3b30' }}>登出</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                                    登出後將使用離線模式
                                </div>
                            </div>
                        </button>
                    </section>
                )}

                {/* === 關於 === */}
                <section className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '16px',
                    }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: '8px',
                            background: 'var(--accent-color)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Shield size={18} color="white" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 500, fontSize: '16px' }}>隱私安全</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                                資料使用 Google Firebase 加密儲存
                            </div>
                        </div>
                    </div>
                </section>

                <div style={{
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                    padding: '24px 0',
                }}>
                    Premium Notes v1.0
                </div>
            </main>

            {/* 登出確認對話框 */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 100,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(0,0,0,0.4)',
                            backdropFilter: 'blur(4px)',
                        }}
                        onClick={() => setShowLogoutConfirm(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                background: 'var(--surface-color)',
                                borderRadius: '14px',
                                width: 'min(300px, 85%)',
                                overflow: 'hidden',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                            }}
                        >
                            <div style={{ padding: '20px', textAlign: 'center' }}>
                                <h3 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '8px' }}>
                                    確定要登出嗎？
                                </h3>
                                <p style={{
                                    color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.4',
                                }}>
                                    登出後，備忘錄將不再同步到雲端，但本地資料會保留。
                                </p>
                            </div>
                            <div style={{
                                display: 'flex', flexDirection: 'column',
                                borderTop: '1px solid var(--divider-color)',
                            }}>
                                <button
                                    onClick={handleLogout}
                                    style={{
                                        padding: '14px', fontSize: '17px',
                                        color: '#ff3b30', fontWeight: 600,
                                        borderBottom: '1px solid var(--divider-color)',
                                    }}
                                >
                                    登出
                                </button>
                                <button
                                    onClick={() => setShowLogoutConfirm(false)}
                                    style={{
                                        padding: '14px', fontSize: '17px',
                                        color: 'var(--accent-color)',
                                    }}
                                >
                                    取消
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default SettingsView;
