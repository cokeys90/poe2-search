import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Firebase 웹 앱 설정 (apiKey는 공개용 식별자로 노출되어도 무방)
const firebaseConfig = {
  apiKey: "AIzaSyDZMAc8CFGhKM3dWuO13yR8vxbkUDgEKJY",
  authDomain: "poe2-search.firebaseapp.com",
  projectId: "poe2-search",
  storageBucket: "poe2-search.firebasestorage.app",
  messagingSenderId: "225427620516",
  appId: "1:225427620516:web:b849d096876e19cdb21c31",
  measurementId: "G-KQ125JX3WM",
};

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
