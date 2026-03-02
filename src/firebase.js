// Firebase 設定檔
// 使用者不需要做任何事，直接選 Google 帳號登入即可

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyClzDXIavFMSxx435VXni54u-hzlQbz_H4",
    authDomain: "noteapp-488414.firebaseapp.com",
    projectId: "noteapp-488414",
    storageBucket: "noteapp-488414.firebasestorage.app",
    messagingSenderId: "613935979196",
    appId: "1:613935979196:web:70f5cd5a564aa5fce94eb9",
    measurementId: "G-9J3WWJYRJ1"
};

// 檢查是否已設定
export const isFirebaseConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

export { app, auth, googleProvider, db };
export default app;
