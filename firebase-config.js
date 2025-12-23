// Firebase 配置文件
// 请在 Firebase 控制台获取你的配置信息并替换下面的内容

const firebaseConfig = {
    apiKey: "AIzaSyDSjnmni7Wh_rvTD-WDg2MN680702HXbW0",
    authDomain: "shudu-7f845.firebaseapp.com",
    databaseURL: "https://shudu-7f845-default-rtdb.firebaseio.com",
    projectId: "shudu-7f845",
    storageBucket: "shudu-7f845.firebasestorage.app",
    messagingSenderId: "210906076042",
    appId: "1:210906076042:web:ce62a7b290b3626cbc2e73",
    measurementId: "G-YRXPHYTT7L"
};

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);

// 获取数据库引用
const database = firebase.database();
