import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC3sr4YpnidLoJEqHo5zn0ooalLJw8fSSM",
  authDomain: "dyzo-f402d.firebaseapp.com",
  databaseURL: "https://dyzo-f402d-default-rtdb.firebaseio.com",
  projectId: "dyzo-f402d",
  storageBucket: "dyzo-f402d.firebasestorage.app",
  messagingSenderId: "1060265225241",
  appId: "1:1060265225241:web:e27899b8604de5d0680e88",
  measurementId: "G-259LQ52KRF"
};

const app = initializeApp(firebaseConfig);

const database = getDatabase(app);

export default database;
