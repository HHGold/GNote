import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, ChevronRight, Search, Plus, MinusCircle, X, User, Users } from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { useAuth } from '../context/AuthContext';

// iOS 風格的對話框元件
const IOSDialog = ({ visible, title, children, onClose }) => (
    <AnimatePresence>
        {visible && (
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
                    WebkitBackdropFilter: 'blur(4px)',
                }}
                onClick={onClose}
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
                    <div style={{
                        padding: '20px 20px 16px',
                        textAlign: 'center',
                    }}>
                        <h3 style={{
                            fontSize: '17px',
                            fontWeight: 600,
                            marginBottom: '4px',
                        }}>{title}</h3>
                    </div>
                    {children}
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

const FoldersView = () => {
    const { folders, notes, sharedNotes, addFolder, deleteFolder } = useNotes();
    const { user, isLoggedIn } = useAuth();
    const navigate = useNavigate();

    // 編輯模式
    const [isEditing, setIsEditing] = useState(false);

    // 新增資料夾對話框
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [addError, setAddError] = useState('');
    const addInputRef = useRef(null);

    // 刪除確認對話框
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [folderToDelete, setFolderToDelete] = useState(null);

    // 搜尋
    const [searchQuery, setSearchQuery] = useState('');

    // 聚焦新增輸入框
    useEffect(() => {
        if (showAddDialog) {
            setTimeout(() => addInputRef.current?.focus(), 100);
        }
    }, [showAddDialog]);

    const getNoteCount = (folder) => {
        return notes.filter(n => folder === '全部' || n.folder === folder).length;
    };

    // 過濾資料夾
    const filteredFolders = searchQuery.trim()
        ? folders.filter(f => f.toLowerCase().includes(searchQuery.toLowerCase()))
        : folders;

    // 處理新增資料夾
    const handleAddFolder = () => {
        setAddError('');
        const result = addFolder(newFolderName);
        if (result.success) {
            setNewFolderName('');
            setShowAddDialog(false);
        } else {
            setAddError(result.message);
        }
    };

    // 處理刪除事件
    const handleDeleteClick = (folder) => {
        setFolderToDelete(folder);
        setShowDeleteDialog(true);
    };

    const handleConfirmDelete = () => {
        if (folderToDelete) {
            deleteFolder(folderToDelete);
        }
        setShowDeleteDialog(false);
        setFolderToDelete(null);
    };

    // 取得該資料夾下的備忘錄數量（用於刪除提示）
    const getDeletedNoteCount = () => {
        if (!folderToDelete) return 0;
        return notes.filter(n => n.folder === folderToDelete).length;
    };

    return (
        <motion.div
            className="view-container"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
        >
            {/* 頂部標題列 */}
            <header className="header">
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    style={{
                        color: 'var(--accent-color)',
                        fontWeight: 500,
                        fontSize: '17px',
                        minWidth: '50px',
                        textAlign: 'left',
                    }}
                >
                    {isEditing ? '完成' : '編輯'}
                </button>
                <h1 className="header-title">資料夾</h1>
                <button
                    onClick={() => navigate('/settings')}
                    style={{
                        width: 34, height: 34, borderRadius: '50%',
                        overflow: 'hidden',
                        background: 'var(--accent-light)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: isLoggedIn ? '2px solid var(--accent-color)' : 'none',
                        padding: 0,
                    }}
                >
                    {isLoggedIn && user?.photoURL ? (
                        <img
                            src={user.photoURL}
                            alt="頭像"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <User size={18} color="var(--accent-color)" />
                    )}
                </button>
            </header>

            {/* 內容區域 */}
            <main className="content-scroll">
                {/* 搜尋列 */}
                <div className="search-bar" style={{
                    background: 'rgba(142, 142, 147, 0.12)',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '24px',
                    gap: '8px',
                    color: 'var(--text-secondary)',
                    backdropFilter: 'blur(5px)'
                }}>
                    <Search size={18} strokeWidth={2.5} />
                    <input
                        type="text"
                        placeholder="搜尋"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ width: '100%', fontSize: '17px' }}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} style={{ display: 'flex' }}>
                            <X size={18} color="var(--text-secondary)" />
                        </button>
                    )}
                </div>

                {/* 資料夾清單 */}
                <section className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <AnimatePresence>
                        {filteredFolders.map((folder, index) => (
                            <motion.div
                                key={folder}
                                layout
                                initial={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.25 }}
                            >
                                <div
                                    onClick={() => !isEditing && navigate(`/folder/${folder}`)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0 16px',
                                        height: '52px',
                                        borderBottom: index === filteredFolders.length - 1
                                            ? 'none'
                                            : '1px solid var(--divider-color)',
                                        cursor: isEditing ? 'default' : 'pointer',
                                        transition: 'background-color 0.15s',
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        flex: 1,
                                        overflow: 'hidden',
                                    }}>
                                        {/* 編輯模式：刪除按鈕 */}
                                        <AnimatePresence>
                                            {isEditing && folder !== '全部' && (
                                                <motion.button
                                                    initial={{ opacity: 0, width: 0, marginRight: -12 }}
                                                    animate={{ opacity: 1, width: 24, marginRight: 0 }}
                                                    exit={{ opacity: 0, width: 0, marginRight: -12 }}
                                                    transition={{ duration: 0.2 }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteClick(folder);
                                                    }}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <MinusCircle
                                                        size={22}
                                                        color="#ff3b30"
                                                        fill="#ff3b30"
                                                        strokeWidth={0}
                                                    />
                                                    {/* 用白色減號覆蓋 */}
                                                    <div style={{
                                                        position: 'absolute',
                                                        width: '10px',
                                                        height: '2px',
                                                        background: 'white',
                                                        borderRadius: '1px',
                                                        marginLeft: '6px',
                                                    }} />
                                                </motion.button>
                                            )}
                                        </AnimatePresence>

                                        <Folder size={20} color="var(--accent-color)" />
                                        <span style={{
                                            fontWeight: 500,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}>{folder}</span>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        color: 'var(--text-secondary)',
                                        flexShrink: 0,
                                    }}>
                                        <span>{getNoteCount(folder)}</span>
                                        <ChevronRight size={16} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </section>

                {/* 與我共享 */}
                {isLoggedIn && sharedNotes.length > 0 && (
                    <section style={{ marginTop: '20px' }}>
                        <div style={{
                            fontSize: '13px', fontWeight: 600,
                            color: 'var(--text-secondary)',
                            textTransform: 'uppercase',
                            marginBottom: '8px', paddingLeft: '4px',
                        }}>與我共享</div>
                        <div
                            className="premium-card"
                            onClick={() => navigate('/folder/共享')}
                            style={{
                                padding: '0 16px', height: '52px',
                                display: 'flex', alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Users size={20} color="#007AFF" />
                                <span style={{ fontWeight: 500 }}>與我共享的備忘錄</span>
                            </div>
                            <div style={{
                                display: 'flex', alignItems: 'center',
                                gap: '8px', color: 'var(--text-secondary)',
                            }}>
                                <span>{sharedNotes.length}</span>
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    </section>
                )}

                {/* 如果搜尋無結果 */}
                {filteredFolders.length === 0 && searchQuery && (
                    <div style={{
                        textAlign: 'center',
                        marginTop: '40px',
                        color: 'var(--text-secondary)',
                        fontSize: '15px',
                    }}>
                        找不到符合「{searchQuery}」的資料夾
                    </div>
                )}
            </main>

            {/* 底部工具列 */}
            <footer className="tab-bar">
                <div style={{ width: 24 }}></div>
                <button
                    onClick={() => {
                        setNewFolderName('');
                        setAddError('');
                        setShowAddDialog(true);
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--accent-color)',
                        fontWeight: 600,
                        fontSize: '17px',
                    }}
                >
                    <Plus size={20} strokeWidth={2.5} />
                    <span>新增資料夾</span>
                </button>
            </footer>

            {/* ===== 新增資料夾對話框 ===== */}
            <IOSDialog
                visible={showAddDialog}
                title="新增資料夾"
                onClose={() => setShowAddDialog(false)}
            >
                <div style={{ padding: '0 20px 4px' }}>
                    <input
                        ref={addInputRef}
                        type="text"
                        value={newFolderName}
                        onChange={e => {
                            setNewFolderName(e.target.value);
                            setAddError('');
                        }}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && newFolderName.trim()) handleAddFolder();
                        }}
                        placeholder="輸入資料夾名稱"
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            fontSize: '15px',
                            borderRadius: '8px',
                            background: 'rgba(142, 142, 147, 0.12)',
                            border: addError ? '1px solid #ff3b30' : '1px solid transparent',
                            transition: 'border-color 0.2s',
                        }}
                    />
                    {addError && (
                        <div style={{
                            color: '#ff3b30',
                            fontSize: '13px',
                            marginTop: '6px',
                            textAlign: 'left',
                        }}>
                            {addError}
                        </div>
                    )}
                </div>
                <div style={{
                    display: 'flex',
                    borderTop: '1px solid var(--divider-color)',
                    marginTop: '16px',
                }}>
                    <button
                        onClick={() => setShowAddDialog(false)}
                        style={{
                            flex: 1,
                            padding: '14px',
                            fontSize: '17px',
                            color: 'var(--accent-color)',
                            borderRight: '1px solid var(--divider-color)',
                        }}
                    >
                        取消
                    </button>
                    <button
                        onClick={handleAddFolder}
                        style={{
                            flex: 1,
                            padding: '14px',
                            fontSize: '17px',
                            fontWeight: 600,
                            color: newFolderName.trim()
                                ? 'var(--accent-color)'
                                : 'var(--text-secondary)',
                            opacity: newFolderName.trim() ? 1 : 0.5,
                        }}
                        disabled={!newFolderName.trim()}
                    >
                        新增
                    </button>
                </div>
            </IOSDialog>

            {/* ===== 刪除確認對話框 ===== */}
            <IOSDialog
                visible={showDeleteDialog}
                title="刪除資料夾"
                onClose={() => setShowDeleteDialog(false)}
            >
                <div style={{
                    padding: '0 20px 0',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    lineHeight: '1.4',
                }}>
                    確定要刪除「{folderToDelete}」資料夾嗎？
                    {getDeletedNoteCount() > 0 && (
                        <div style={{ marginTop: '4px' }}>
                            其中的 {getDeletedNoteCount()} 個備忘錄將移至「全部」
                        </div>
                    )}
                </div>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    borderTop: '1px solid var(--divider-color)',
                    marginTop: '16px',
                }}>
                    <button
                        onClick={handleConfirmDelete}
                        style={{
                            padding: '14px',
                            fontSize: '17px',
                            color: '#ff3b30',
                            fontWeight: 600,
                            borderBottom: '1px solid var(--divider-color)',
                        }}
                    >
                        刪除
                    </button>
                    <button
                        onClick={() => setShowDeleteDialog(false)}
                        style={{
                            padding: '14px',
                            fontSize: '17px',
                            color: 'var(--accent-color)',
                        }}
                    >
                        取消
                    </button>
                </div>
            </IOSDialog>
        </motion.div>
    );
};

export default FoldersView;
