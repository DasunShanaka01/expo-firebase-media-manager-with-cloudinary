// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import React from "react";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCjRRV_Mju5QhG2qZzll4HGVqCCNcFVtaQ",
  authDomain: "first-project-185be.firebaseapp.com",
  projectId: "first-project-185be",
  storageBucket: "first-project-185be.firebasestorage.app",
  messagingSenderId: "1034744947071",
  appId: "1:1034744947071:web:3c3da8a0e517aff936fa4a",
  measurementId: "G-480E0CKYXJ"
};

// Initialize Firebase
// Initialize Firebase app
export const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(app);
export const storage = getStorage(app);
