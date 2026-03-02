import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  collection, doc, setDoc, deleteDoc, onSnapshot, query, where, getDoc,
  getDocs, serverTimestamp, arrayUnion, arrayRemove, updateDoc, deleteField
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { useAuth } from './AuthContext';

const NotesContext = createContext();

export const useNotes = () => useContext(NotesContext);

// 預設資料
const DEFAULT_NOTES = [{
  id: '1',
  title: '歡迎使用高級記事本',
  content: '這是一個模仿 iPhone 備忘錄的高品質 Android 應用程式原型。\n\n功能特點：\n- 極簡奢華設計\n- 自動儲存\n- 支援資料夾分類\n- Google 帳號雲端同步\n- 分享備忘錄給其他人',
  folder: '全部',
  updatedAt: new Date().toISOString()
}];

const DEFAULT_FOLDERS = ['全部'];

export const NotesProvider = ({ children }) => {
  const { user, isLoggedIn } = useAuth();

  const [syncStatus, setSyncStatus] = useState('idle');
  const syncTimerRef = useRef(null);

  // === 本地儲存 ===
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('premium_notes');
    return saved ? JSON.parse(saved) : DEFAULT_NOTES;
  });

  const [sharedNotes, setSharedNotes] = useState([]); // 別人分享給我的

  const [folders, setFolders] = useState(() => {
    const saved = localStorage.getItem('premium_folders');
    return saved ? JSON.parse(saved) : DEFAULT_FOLDERS;
  });

  // 寫入 localStorage
  useEffect(() => {
    localStorage.setItem('premium_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('premium_folders', JSON.stringify(folders));
  }, [folders]);

  // === Firestore 即時同步 ===
  useEffect(() => {
    if (!isFirebaseConfigured || !isLoggedIn || !user || !db) {
      setSyncStatus('offline');
      return;
    }

    setSyncStatus('syncing');

    // 監聽「我的備忘錄」（不使用 orderBy 避免需要複合索引）
    const myNotesQuery = query(
      collection(db, 'notes'),
      where('ownerId', '==', user.uid)
    );

    const unsubMyNotes = onSnapshot(myNotesQuery, (snapshot) => {
      if (!snapshot.metadata.hasPendingWrites) {
        const cloudNotes = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
          updatedAt: d.data().updatedAt?.toDate?.()?.toISOString?.() || d.data().updatedAt,
        }));
        if (cloudNotes.length > 0) {
          // 前端排序：按更新時間倒序
          cloudNotes.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
          setNotes(cloudNotes);
        }
      }
      setSyncStatus('synced');
    }, (err) => {
      console.error('我的備忘錄同步錯誤:', err);
      setSyncStatus('error');
    });

    // 監聽「別人分享給我的備忘錄」
    const sharedQuery = query(
      collection(db, 'notes'),
      where('sharedWithIds', 'array-contains', user.uid)
    );

    const unsubShared = onSnapshot(sharedQuery, (snapshot) => {
      const shared = snapshot.docs.map(d => {
        const data = d.data();
        const permission = data.sharedWith?.[user.uid]?.permission || 'view';
        return {
          id: d.id,
          ...data,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt,
          _isShared: true,
          _myPermission: permission,
        };
      });
      setSharedNotes(shared);
    }, (err) => {
      console.error('共享備忘錄同步錯誤:', err);
    });

    // 同步資料夾
    const foldersRef = doc(db, 'users', user.uid, 'config', 'folders');
    const unsubFolders = onSnapshot(foldersRef, (snapshot) => {
      if (snapshot.exists() && !snapshot.metadata.hasPendingWrites) {
        const data = snapshot.data();
        if (data.list?.length > 0) setFolders(data.list);
      }
    });

    return () => {
      unsubMyNotes();
      unsubShared();
      unsubFolders();
    };
  }, [isLoggedIn, user]);

  // === 雲端寫入 ===
  const syncNoteToCloud = useCallback(async (note, isNew = false) => {
    if (!isFirebaseConfigured || !isLoggedIn || !user || !db) return;
    try {
      const payload = {
        title: note.title || '',
        content: note.content || '',
        folder: note.folder || '全部',
        isLocked: !!note.isLocked,
        updatedAt: serverTimestamp(),
      };

      if (isNew) {
        payload.ownerId = user.uid;
        payload.ownerEmail = user.email;
        payload.ownerName = user.displayName || '';
        payload.sharedWith = note.sharedWith || {};
        payload.sharedWithIds = note.sharedWithIds || [];
      }

      await setDoc(doc(db, 'notes', note.id), payload, { merge: true });
    } catch (err) {
      console.error('寫入備忘錄失敗:', err);
    }
  }, [isLoggedIn, user]);

  const deleteNoteFromCloud = useCallback(async (noteId) => {
    if (!isFirebaseConfigured || !isLoggedIn || !user || !db) return;
    try {
      await deleteDoc(doc(db, 'notes', noteId));
    } catch (err) {
      console.error('刪除備忘錄失敗:', err);
    }
  }, [isLoggedIn, user]);

  const syncFoldersToCloud = useCallback(async (folderList) => {
    if (!isFirebaseConfigured || !isLoggedIn || !user || !db) return;
    try {
      await setDoc(doc(db, 'users', user.uid, 'config', 'folders'), { list: folderList });
    } catch (err) {
      console.error('寫入資料夾失敗:', err);
    }
  }, [isLoggedIn, user]);

  // 延遲同步
  const debouncedSyncNote = useCallback((note) => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => syncNoteToCloud(note), 800);
  }, [syncNoteToCloud]);

  // === 備忘錄操作 ===
  const addNote = (folder = '全部') => {
    const newNote = {
      id: Date.now().toString(),
      title: '',
      content: '',
      folder,
      sharedWith: {},
      sharedWithIds: [],
      updatedAt: new Date().toISOString()
    };
    setNotes(prev => [newNote, ...prev]);
    syncNoteToCloud(newNote, true);
    return newNote.id;
  };

  const updateNote = (id, updates) => {
    // 檢查是共享備忘錄還是自己的
    const isShared = sharedNotes.find(n => n.id === id);
    if (isShared) {
      // 直接更新雲端（共享備忘錄）
      const updatedNote = { ...isShared, ...updates };
      syncNoteToCloud(updatedNote);
      return;
    }

    setNotes(prev => {
      const updated = prev.map(note => {
        if (note.id === id) {
          const updatedNote = { ...note, ...updates, updatedAt: new Date().toISOString() };
          debouncedSyncNote(updatedNote);
          return updatedNote;
        }
        return note;
      });
      return updated;
    });
  };

  const deleteNote = (id) => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    setNotes(prev => prev.filter(note => note.id !== id));
    deleteNoteFromCloud(id);
  };

  // 取得所有備忘錄（自己的 + 共享的）
  const getAllNotes = useCallback(() => {
    return [...notes, ...sharedNotes];
  }, [notes, sharedNotes]);

  // 根據 ID 找備忘錄
  const findNoteById = useCallback((id) => {
    return notes.find(n => n.id === id) || sharedNotes.find(n => n.id === id);
  }, [notes, sharedNotes]);

  // === 分享功能 ===

  // 透過 email 搜尋使用者
  const findUserByEmail = useCallback(async (email) => {
    if (!db) return null;
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', email.trim().toLowerCase())
      );
      const snapshot = await getDocs(usersQuery);
      if (snapshot.empty) return null;
      const userDoc = snapshot.docs[0];
      return { uid: userDoc.id, ...userDoc.data() };
    } catch (err) {
      console.error('搜尋使用者失敗:', err);
      return null;
    }
  }, []);

  // 分享備忘錄給某個使用者
  const shareNote = useCallback(async (noteId, targetEmail, permission = 'edit') => {
    if (!db || !user) return { success: false, message: '請先登入' };

    // 不能分享給自己
    if (targetEmail.toLowerCase() === user.email.toLowerCase()) {
      return { success: false, message: '不能分享給自己' };
    }

    // 查找目標使用者
    const targetUser = await findUserByEmail(targetEmail);
    if (!targetUser) {
      return { success: false, message: '找不到此 Email 的使用者，對方需要先登入過 App' };
    }

    try {
      const noteRef = doc(db, 'notes', noteId);
      await updateDoc(noteRef, {
        [`sharedWith.${targetUser.uid}`]: {
          email: targetUser.email,
          displayName: targetUser.displayName || '',
          permission,
        },
        sharedWithIds: arrayUnion(targetUser.uid),
      });

      // 同步更新本地 state
      setNotes(prev => prev.map(note => {
        if (note.id === noteId) {
          const updatedSharedWith = { ...(note.sharedWith || {}) };
          updatedSharedWith[targetUser.uid] = {
            email: targetUser.email,
            displayName: targetUser.displayName || '',
            permission,
          };
          const updatedSharedWithIds = note.sharedWithIds?.includes(targetUser.uid)
            ? note.sharedWithIds
            : [...(note.sharedWithIds || []), targetUser.uid];

          return {
            ...note,
            sharedWith: updatedSharedWith,
            sharedWithIds: updatedSharedWithIds,
          };
        }
        return note;
      }));

      return { success: true, message: `已分享給 ${targetUser.displayName || targetUser.email}` };
    } catch (err) {
      console.error('分享失敗:', err);
      return { success: false, message: '分享失敗，請稍後再試' };
    }
  }, [user, findUserByEmail]);

  // 取消分享
  const unshareNote = useCallback(async (noteId, targetUid) => {
    if (!db || !user) return { success: false };
    try {
      const noteRef = doc(db, 'notes', noteId);
      await updateDoc(noteRef, {
        [`sharedWith.${targetUid}`]: deleteField(),
        sharedWithIds: arrayRemove(targetUid),
      });

      // 同步更新本地 state
      setNotes(prev => prev.map(note => {
        if (note.id === noteId) {
          const updatedSharedWith = { ...(note.sharedWith || {}) };
          delete updatedSharedWith[targetUid];
          const updatedSharedWithIds = (note.sharedWithIds || []).filter(id => id !== targetUid);

          return {
            ...note,
            sharedWith: updatedSharedWith,
            sharedWithIds: updatedSharedWithIds,
          };
        }
        return note;
      }));

      return { success: true };
    } catch (err) {
      console.error('取消分享失敗:', err);
      return { success: false };
    }
  }, [user]);

  // === 資料夾操作 ===
  const addFolder = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, message: '資料夾名稱不能為空' };
    if (folders.includes(trimmed)) return { success: false, message: '此資料夾名稱已存在' };
    const newFolders = [...folders, trimmed];
    setFolders(newFolders);
    syncFoldersToCloud(newFolders);
    return { success: true };
  };

  const deleteFolder = (name) => {
    if (name === '全部') return { success: false, message: '無法刪除「全部」資料夾' };
    notes.filter(n => n.folder === name).forEach(n => {
      const updated = { ...n, folder: '全部' };
      syncNoteToCloud(updated);
    });
    setNotes(prev => prev.map(n => n.folder === name ? { ...n, folder: '全部' } : n));
    const newFolders = folders.filter(f => f !== name);
    setFolders(newFolders);
    syncFoldersToCloud(newFolders);
    return { success: true };
  };

  const renameFolder = (oldName, newName) => {
    const trimmed = newName.trim();
    if (oldName === '全部') return { success: false, message: '無法重新命名' };
    if (!trimmed) return { success: false, message: '名稱不能為空' };
    if (folders.includes(trimmed)) return { success: false, message: '名稱已存在' };
    const newFolders = folders.map(f => f === oldName ? trimmed : f);
    setFolders(newFolders);
    syncFoldersToCloud(newFolders);
    notes.filter(n => n.folder === oldName).forEach(n => {
      syncNoteToCloud({ ...n, folder: trimmed });
    });
    setNotes(prev => prev.map(n => n.folder === oldName ? { ...n, folder: trimmed } : n));
    return { success: true };
  };

  return (
    <NotesContext.Provider value={{
      notes, sharedNotes, folders,
      addNote, updateNote, deleteNote,
      addFolder, deleteFolder, renameFolder,
      getAllNotes, findNoteById,
      shareNote, unshareNote,
      syncStatus,
    }}>
      {children}
    </NotesContext.Provider>
  );
};
