import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MoreHorizontal, SquarePen, Users, Circle, CheckCircle2, Trash2, FolderOutput, Pencil, Trash, X, ArrowDownUp, CheckSquare, Lock } from 'lucide-react';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { useNotes } from '../context/NotesContext';

const NotesListView = () => {
    const { folderName } = useParams();
    const { notes, sharedNotes, addNote, updateNote, deleteNote, deleteFolder, renameFolder, folders } = useNotes();
    const navigate = useNavigate();

    // 狀態
    const [showMenu, setShowMenu] = useState(false);
    const [sortBy, setSortBy] = useState('date_desc'); // date_desc, date_asc, title_asc
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedNotes, setSelectedNotes] = useState(new Set());

    // 對話框狀態
    const [showMoveDialog, setShowMoveDialog] = useState(false);
    const [showRenameDialog, setShowRenameDialog] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const renameInputRef = useRef(null);
    const menuRef = useRef(null);

    const isSharedFolder = folderName === '共享';
    const isDefaultFolder = folderName === '全部';

    // 點擊外面關閉選單
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false);
            }
        };
        if (showMenu) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);

    // 過濾與排序
    const filteredNotes = useMemo(() => {
        let list = isSharedFolder
            ? sharedNotes
            : notes.filter(n => isDefaultFolder || n.folder === folderName);

        list = [...list];
        list.sort((a, b) => {
            if (sortBy === 'title_asc') {
                return (a.title || '無標題').localeCompare(b.title || '無標題');
            } else if (sortBy === 'date_asc') {
                return (a.updatedAt || '').localeCompare(b.updatedAt || '');
            } else { // date_desc
                return (b.updatedAt || '').localeCompare(a.updatedAt || '');
            }
        });
        return list;
    }, [isSharedFolder, sharedNotes, notes, folderName, sortBy, isDefaultFolder]);

    const handleCreateNote = () => {
        const id = addNote(folderName === '全部' ? '全部' : folderName);
        navigate(`/note/${id}`);
    };

    const handleNoteClick = async (note) => {
        if (isSelectMode) {
            toggleSelectNode(note.id);
            return;
        }

        if (note.isLocked) {
            try {
                const result = await NativeBiometric.isAvailable();
                if (result.isAvailable) {
                    await NativeBiometric.verifyIdentity({
                        reason: "解鎖備忘錄",
                        title: "解鎖",
                        subtitle: "請驗證您的身分",
                        description: "此備忘錄已加密上鎖"
                    });
                    // 驗證成功
                    navigate(`/note/${note.id}`);
                } else {
                    alert('你的裝置目前不支援或尚未設定生物辨識解鎖');
                }
            } catch (err) {
                console.error('解鎖失敗/取消:', err);
            }
        } else {
            navigate(`/note/${note.id}`);
        }
    };

    const toggleSelectNode = (id) => {
        setSelectedNotes(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleBatchDelete = () => {
        if (selectedNotes.size === 0) return;
        if (window.confirm(`確定要刪除選取的 ${selectedNotes.size} 個備忘錄嗎？`)) {
            selectedNotes.forEach(id => deleteNote(id));
            setIsSelectMode(false);
            setSelectedNotes(new Set());
        }
    };

    const handleBatchMove = (targetFolder) => {
        selectedNotes.forEach(id => {
            updateNote(id, { folder: targetFolder });
        });
        setIsSelectMode(false);
        setSelectedNotes(new Set());
        setShowMoveDialog(false);
    };

    const handleRenameFolder = () => {
        const res = renameFolder(folderName, newFolderName);
        if (res.success) {
            setShowRenameDialog(false);
            navigate(`/folder/${newFolderName}`, { replace: true });
        } else {
            alert(res.message);
        }
    };

    const handleDeleteFolder = () => {
        if (window.confirm(`確定要刪除「${folderName}」嗎？裡面的備忘錄會移到「全部」。`)) {
            const res = deleteFolder(folderName);
            if (res.success) {
                navigate('/');
            } else {
                alert(res.message);
            }
        }
    };

    const cycleSort = () => {
        if (sortBy === 'date_desc') setSortBy('date_asc');
        else if (sortBy === 'date_asc') setSortBy('title_asc');
        else setSortBy('date_desc');
        setShowMenu(false);
    };

    const getSortLabel = () => {
        if (sortBy === 'date_desc') return '依日期排序 (新到舊)';
        if (sortBy === 'date_asc') return '依日期排序 (舊到新)';
        return '依標題排序 (A-Z)';
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
                    <span>資料夾</span>
                </button>
                <div className="header-title" style={{ flex: 1, textAlign: 'center' }}>
                    {isSharedFolder ? '與我共享' : folderName}
                </div>

                {isSelectMode ? (
                    <button style={{ color: 'var(--accent-color)', fontWeight: 600, fontSize: '16px' }} onClick={() => { setIsSelectMode(false); setSelectedNotes(new Set()); }}>
                        完成
                    </button>
                ) : (
                    <div style={{ position: 'relative' }} ref={menuRef}>
                        <button onClick={() => setShowMenu(!showMenu)}>
                            <MoreHorizontal size={24} color="var(--accent-color)" />
                        </button>

                        {/* 更多選單 */}
                        <AnimatePresence>
                            {showMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    style={{
                                        position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                                        width: '220px', background: 'var(--surface-color)',
                                        borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                                        zIndex: 50, overflow: 'hidden', border: '1px solid var(--divider-color)',
                                        display: 'flex', flexDirection: 'column'
                                    }}
                                >
                                    <button onClick={cycleSort} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', width: '100%', textAlign: 'left', borderBottom: '1px solid var(--divider-color)' }}>
                                        <ArrowDownUp size={18} color="var(--text-primary)" />
                                        <span style={{ fontSize: '15px', color: 'var(--text-primary)', flex: 1 }}>{getSortLabel()}</span>
                                    </button>

                                    {!isSharedFolder && (
                                        <button onClick={() => { setIsSelectMode(true); setShowMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', width: '100%', textAlign: 'left', borderBottom: '1px solid var(--divider-color)' }}>
                                            <CheckSquare size={18} color="var(--text-primary)" />
                                            <span style={{ fontSize: '15px', color: 'var(--text-primary)', flex: 1 }}>選取備忘錄</span>
                                        </button>
                                    )}

                                    {!isDefaultFolder && !isSharedFolder && (
                                        <>
                                            <button onClick={() => { setNewFolderName(folderName); setShowRenameDialog(true); setShowMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', width: '100%', textAlign: 'left', borderBottom: '1px solid var(--divider-color)' }}>
                                                <Pencil size={18} color="var(--text-primary)" />
                                                <span style={{ fontSize: '15px', color: 'var(--text-primary)', flex: 1 }}>重新命名資料夾</span>
                                            </button>
                                            <button onClick={() => { handleDeleteFolder(); setShowMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', width: '100%', textAlign: 'left' }}>
                                                <Trash size={18} color="#ff3b30" />
                                                <span style={{ fontSize: '15px', color: '#ff3b30', flex: 1 }}>刪除資料夾</span>
                                            </button>
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </header>

            <main className="content-scroll">
                <div style={{ padding: '0 8px' }}>
                    {filteredNotes.length === 0 ? (
                        <div style={{ textAlign: 'center', marginTop: '100px', color: 'var(--text-secondary)' }}>
                            {isSharedFolder ? '沒有共享的備忘錄' : '沒有備忘錄'}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {filteredNotes.map((note) => (
                                <div
                                    key={note.id}
                                    className="premium-card"
                                    onClick={() => handleNoteClick(note)}
                                    style={{
                                        padding: '16px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}
                                >
                                    {isSelectMode && (
                                        <div style={{ flexShrink: 0 }}>
                                            {selectedNotes.has(note.id) ? (
                                                <CheckCircle2 size={24} color="var(--accent-color)" fill="var(--accent-color)" style={{ color: "white" }} />
                                            ) : (
                                                <Circle size={24} color="var(--text-secondary)" />
                                            )}
                                        </div>
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            fontWeight: 600, fontSize: '17px', marginBottom: '4px',
                                        }}>
                                            <span style={{
                                                whiteSpace: 'nowrap', overflow: 'hidden',
                                                textOverflow: 'ellipsis', flex: 1,
                                            }}>
                                                {note.title || '無標題'}
                                            </span>
                                            {(note._isShared || (note.sharedWithIds?.length > 0)) && (
                                                <Users size={14} color="#007AFF" style={{ flexShrink: 0 }} />
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                            <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                                            {note._isShared && (
                                                <span style={{ color: '#007AFF', fontSize: '12px' }}>
                                                    {note._myPermission === 'edit' ? '可編輯' : '僅檢視'}
                                                </span>
                                            )}
                                            {note.isLocked ? (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)' }}>
                                                    <Lock size={12} />已上鎖
                                                </span>
                                            ) : (
                                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {(note.content || '').substring(0, 50) || '無額外文字'}
                                                </span>
                                            )}
                                        </div>
                                        {note._isShared && note.ownerName && (
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                來自 {note.ownerName}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* 底部工具列：選取模式 vs 正常模式 */}
            <footer className="tab-bar">
                {isSelectMode ? (
                    <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', padding: '0 8px' }}>
                        <button
                            onClick={() => setShowMoveDialog(true)}
                            disabled={selectedNotes.size === 0}
                            style={{ opacity: selectedNotes.size === 0 ? 0.3 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                        >
                            <FolderOutput size={24} color="var(--accent-color)" />
                            <span style={{ fontSize: '10px', color: 'var(--accent-color)' }}>搬移</span>
                        </button>
                        <button
                            onClick={handleBatchDelete}
                            disabled={selectedNotes.size === 0}
                            style={{ opacity: selectedNotes.size === 0 ? 0.3 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                        >
                            <Trash2 size={24} color="#ff3b30" />
                            <span style={{ fontSize: '10px', color: '#ff3b30' }}>刪除</span>
                        </button>
                    </div>
                ) : (
                    <>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                            {filteredNotes.length} 個備忘錄
                        </div>
                        {!isSharedFolder && (
                            <button onClick={handleCreateNote}>
                                <SquarePen size={28} color="var(--accent-color)" />
                            </button>
                        )}
                    </>
                )}
            </footer>

            {/* 重新命名資料夾對話框 */}
            <AnimatePresence>
                {showRenameDialog && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 100,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)'
                        }}
                        onClick={() => setShowRenameDialog(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                background: 'var(--surface-color)', width: '85%', maxWidth: '320px',
                                borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center'
                            }}
                        >
                            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>重新命名資料夾</h3>
                            <input
                                ref={renameInputRef}
                                type="text"
                                value={newFolderName}
                                onChange={e => setNewFolderName(e.target.value)}
                                placeholder="輸入新名稱"
                                style={{
                                    width: '100%', padding: '12px', borderRadius: '10px',
                                    background: 'var(--bg-color)', fontSize: '16px', marginBottom: '20px',
                                    border: '1px solid var(--divider-color)'
                                }}
                            />
                            <div style={{ display: 'flex', width: '100%', gap: '12px' }}>
                                <button
                                    onClick={() => setShowRenameDialog(false)}
                                    style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'var(--bg-color)', fontWeight: 500 }}
                                >取消</button>
                                <button
                                    onClick={handleRenameFolder}
                                    style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'var(--accent-color)', color: 'white', fontWeight: 600 }}
                                >儲存</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 搬移到資料夾對話框 */}
            <AnimatePresence>
                {showMoveDialog && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 101,
                            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)'
                        }}
                        onClick={() => setShowMoveDialog(false)}
                    >
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                background: 'var(--surface-color)', width: '100%', maxWidth: '500px',
                                borderRadius: '20px 20px 0 0', padding: '20px',
                                maxHeight: '70vh', overflow: 'auto'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 600 }}>搬移到...</h3>
                                <button onClick={() => setShowMoveDialog(false)}><X size={24} color="var(--text-secondary)" /></button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {['全部', ...folders].filter((v, i, a) => a.indexOf(v) === i).map(f => (
                                    <button
                                        key={f}
                                        onClick={() => handleBatchMove(f)}
                                        style={{
                                            padding: '16px', background: 'var(--bg-color)',
                                            borderRadius: '12px', textAlign: 'left',
                                            fontSize: '16px', fontWeight: 500
                                        }}
                                    >
                                        📁 {f}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default NotesListView;
