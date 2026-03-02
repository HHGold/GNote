import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    signOut,
    onAuthStateChanged,
    signInWithCredential,
    GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { auth, db, isFirebaseConfigured } from '../firebase';

if (Capacitor.isNativePlatform()) {
    GoogleAuth.initialize({
        clientId: '613935979196-gipvid7iofmps3mlch7korkuml7prt2h.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
    });
}

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 監聽登入狀態
    useEffect(() => {
        if (!isFirebaseConfigured || !auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            setLoading(false);

            // 登入後儲存使用者資訊到 Firestore（供其他人搜尋分享用）
            if (currentUser && db) {
                try {
                    await setDoc(doc(db, 'users', currentUser.uid), {
                        email: currentUser.email,
                        displayName: currentUser.displayName || '',
                        photoURL: currentUser.photoURL || '',
                    }, { merge: true });
                } catch (err) {
                    console.error('儲存使用者資訊失敗:', err);
                }
            }
        });

        return () => unsubscribe();
    }, []);

    // Google 登入
    const loginWithGoogle = async () => {
        if (!isFirebaseConfigured || !auth) {
            setError('Firebase 尚未設定');
            return null;
        }
        setError(null);
        try {
            const googleUser = await GoogleAuth.signIn();
            const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
            const result = await signInWithCredential(auth, credential);
            return result.user;
        } catch (err) {
            // Capacitor GoogleAuth 取消錯誤碼通常不會有 specific firebase code，所以要加上防呆
            if (err?.code !== 'auth/popup-closed-by-user' && String(err).indexOf('canceled') === -1) {
                setError(err.message || '登入失敗');
                console.error('登入錯誤:', err);
            }
            return null;
        }
    };

    // 登出
    const logout = async () => {
        if (!auth) return;
        setError(null);
        try {
            await signOut(auth);
            await GoogleAuth.signOut();
        } catch (err) {
            setError('登出失敗');
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            error,
            loginWithGoogle,
            logout,
            isLoggedIn: !!user,
            isFirebaseReady: isFirebaseConfigured,
        }}>
            {children}
        </AuthContext.Provider>
    );
};
