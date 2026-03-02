import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Share2, Trash2, Check, UserPlus, X, Users, Lock, Unlock } from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { useAuth } from '../context/AuthContext';

// 分享對話框
const ShareDialog = ({ visible, noteId, note, onClose }) => {
    const { shareNote, unshareNote } = useNotes();
    const [email, setEmail] = useState('');
    const [permission, setPermission] = useState('edit');
    const [message, setMessage] = useState(null);
    const [isSharing, setIsSharing] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (visible) setTimeout(() => inputRef.current?.focus(), 100);
    }, [visible]);

    const handleShare = async () => {
        if (!email.trim()) return;
        setIsSharing(true);
        setMessage(null);
        const result = await shareNote(noteId, email.trim(), permission);
        setMessage(result);
        if (result.success) setEmail('');
        setIsSharing(false);
    };

    const handleUnshare = async (uid) => {
        await unshareNote(noteId, uid);
    };

    const sharedUsers = note?.sharedWith ? Object.entries(note.sharedWith) : [];

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 100,
                        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(4px)',
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'var(--surface-color)',
                            borderRadius: '20px 20px 0 0',
                            width: '100%',
                            maxWidth: '500px',
                            maxHeight: '70vh',
                            overflow: 'auto',
                            padding: '20px',
                        }}
                    >
                        {/* 標題列 */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            marginBottom: '20px',
                        }}>
                            <h3 style={{ fontSize: '20px', fontWeight: 700 }}>分享備忘錄</h3>
                            <button onClick={onClose} style={{ display: 'flex' }}>
                                <X size={24} color="var(--text-secondary)" />
                            </button>
                        </div>

                        {/* 輸入 Email */}
                        <div style={{
                            display: 'flex', gap: '8px', marginBottom: '12px',
                        }}>
                            <input
                                ref={inputRef}
                                type="email"
                                value={email}
                                onChange={e => { setEmail(e.target.value); setMessage(null); }}
                                onKeyDown={e => e.key === 'Enter' && handleShare()}
                                placeholder="輸入對方的 Email"
                                style={{
                                    flex: 1,
                                    padding: '12px 14px',
                                    fontSize: '15px',
                                    borderRadius: '10px',
                                    background: 'rgba(142, 142, 147, 0.12)',
                                }}
                            />
                            <button
                                onClick={handleShare}
                                disabled={isSharing || !email.trim()}
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: '10px',
                                    background: 'var(--accent-color)',
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '15px',
                                    opacity: (isSharing || !email.trim()) ? 0.5 : 1,
                                }}
                            >
                                {isSharing ? '...' : '分享'}
                            </button>
                        </div>

                        {/* 權限選擇 */}
                        <div style={{
                            display: 'flex', gap: '8px', marginBottom: '16px',
                        }}>
                            {[
                                { value: 'edit', label: '可編輯' },
                                { value: 'view', label: '僅檢視' },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setPermission(opt.value)}
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        background: permission === opt.value
                                            ? 'var(--accent-color)'
                                            : 'rgba(142, 142, 147, 0.12)',
                                        color: permission === opt.value ? 'white' : 'var(--text-primary)',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* 提示訊息 */}
                        {message && (
                            <div style={{
                                padding: '10px 14px',
                                borderRadius: '8px',
                                marginBottom: '16px',
                                fontSize: '14px',
                                background: message.success
                                    ? 'rgba(52, 199, 89, 0.1)'
                                    : 'rgba(255, 59, 48, 0.1)',
                                color: message.success ? '#34C759' : '#ff3b30',
                            }}>
                                {message.message}
                            </div>
                        )}

                        {/* 已分享的人列表 */}
                        {sharedUsers.length > 0 && (
                            <>
                                <div style={{
                                    fontSize: '13px', color: 'var(--text-secondary)',
                                    fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase',
                                }}>
                                    已分享給
                                </div>
                                <div style={{
                                    background: 'rgba(142, 142, 147, 0.08)',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                }}>
                                    {sharedUsers.map(([uid, info], index) => (
                                        <div key={uid} style={{
                                            display: 'flex', alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '12px 14px',
                                            borderBottom: index < sharedUsers.length - 1
                                                ? '1px solid var(--divider-color)' : 'none',
                                        }}>
                                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                                <div style={{
                                                    fontWeight: 500, fontSize: '15px',
                                                    whiteSpace: 'nowrap', overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}>
                                                    {info.displayName || info.email}
                                                </div>
                                                <div style={{
                                                    fontSize: '12px',
                                                    color: 'var(--text-secondary)',
                                                }}>
                                                    {info.permission === 'edit' ? '可編輯' : '僅檢視'}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleUnshare(uid)}
                                                style={{
                                                    color: '#ff3b30',
                                                    fontSize: '14px',
                                                    fontWeight: 500,
                                                }}
                                            >
                                                移除
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const EditorView = () => {
    const { noteId } = useParams();
    const navigate = useNavigate();
    const { findNoteById, updateNote, deleteNote } = useNotes();
    const { user } = useAuth();
    const note = findNoteById(noteId);

    const [title, setTitle] = useState(note?.title || '');
    const [content, setContent] = useState(note?.content || '');
    const [showShareDialog, setShowShareDialog] = useState(false);
    const titleRef = useRef(null);

    // 判斷權限
    const isOwner = note?.ownerId === user?.uid || !note?.ownerId;
    const isSharedView = note?._isShared && note?._myPermission === 'view';
    const canEdit = isOwner || (note?._isShared && note?._myPermission === 'edit');
    const hasSharedUsers = note?.sharedWith && Object.keys(note.sharedWith).length > 0;
    const isLocked = !!note?.isLocked;

    const toggleLock = () => {
        updateNote(noteId, { isLocked: !isLocked });
    };

    useEffect(() => {
        if (note && !note.title && !note.content && canEdit) {
            titleRef.current?.focus();
        }
    }, []);

    // 同步遠端更新（共享時）
    useEffect(() => {
        if (note) {
            setTitle(note.title || '');
            setContent(note.content || '');
        }
    }, [note?.title, note?.content]);

    useEffect(() => {
        if (note && canEdit) {
            // 防呆：如果內容跟剛載入的一樣，不要觸發更新，避免一進入就排隊儲存
            if (title === (note.title || '') && content === (note.content || '')) return;

            const timeout = setTimeout(() => {
                updateNote(noteId, { title, content });
            }, 500);
            return () => clearTimeout(timeout);
        }
    }, [title, content]);

    if (!note) return null;

    return (
        <motion.div
            className="view-container"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            style={{ background: 'var(--surface-color)' }}
        >
            <header className="header" style={{ background: 'transparent', backdropFilter: 'none' }}>
                <button className="back-button" onClick={() => navigate(-1)}>
                    <ChevronLeft size={28} />
                    <span>備忘錄</span>
                </button>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {/* 分享狀態指示 */}
                    {isOwner && hasSharedUsers && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            fontSize: '12px', color: '#34C759',
                        }}>
                            <Users size={14} />
                            <span>{Object.keys(note.sharedWith).length}</span>
                        </div>
                    )}
                    {isOwner && (
                        <button onClick={toggleLock}>
                            {isLocked ? <Lock size={22} color="var(--accent-color)" /> : <Unlock size={22} color="var(--accent-color)" />}
                        </button>
                    )}
                    {isOwner && (
                        <button onClick={() => deleteNote(noteId) || navigate(-1)}>
                            <Trash2 size={22} color="var(--accent-color)" />
                        </button>
                    )}
                    {isOwner && (
                        <button onClick={() => setShowShareDialog(true)}>
                            <Share2 size={22} color="var(--accent-color)" />
                        </button>
                    )}
                    <button onClick={() => navigate(-1)} style={{ color: 'var(--accent-color)', fontWeight: 600 }}>
                        完成
                    </button>
                </div>
            </header>

            <main className="content-scroll" style={{ padding: '0 24px', background: 'var(--surface-color)', display: 'flex', flexDirection: 'column' }}>
                {/* 共享備忘錄提示 */}
                {note._isShared && (
                    <div style={{
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        padding: '8px 12px',
                        background: 'rgba(142, 142, 147, 0.08)',
                        borderRadius: '8px',
                        marginBottom: '12px',
                    }}>
                        👤 由 <strong>{note.ownerName || note.ownerEmail}</strong> 分享
                        {isSharedView ? ' · 僅檢視' : ' · 可編輯'}
                    </div>
                )}

                <input
                    ref={titleRef}
                    type="text"
                    value={title}
                    onChange={(e) => canEdit && setTitle(e.target.value)}
                    readOnly={!canEdit}
                    placeholder="標題"
                    style={{
                        fontSize: '28px',
                        fontWeight: 800,
                        width: '100%',
                        marginBottom: '16px',
                        marginTop: '8px',
                        opacity: canEdit ? 1 : 0.8,
                    }}
                />
                <textarea
                    value={content}
                    onChange={(e) => {
                        if (!canEdit) return;
                        setContent(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    readOnly={!canEdit}
                    placeholder="開始輸入..."
                    style={{
                        width: '100%',
                        flex: 1,
                        fontSize: '18px',
                        lineHeight: '1.6',
                        resize: 'none',
                        opacity: canEdit ? 1 : 0.8,
                    }}
                />
            </main>

            {/* 分享對話框 */}
            <ShareDialog
                visible={showShareDialog}
                noteId={noteId}
                note={note}
                onClose={() => setShowShareDialog(false)}
            />
        </motion.div>
    );
};

export default EditorView;
