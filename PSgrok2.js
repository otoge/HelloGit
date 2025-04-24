// ==UserScript==
// @name         Perplexity Conversation Saver
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  Save Perplexity conversations with additional features
// @author       Grok
// @match        *://*.perplexity.ai/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 保存ボタンの作成
    const saveButton = document.createElement('button');
    saveButton.textContent = '保存';
    saveButton.style.position = 'fixed';
    saveButton.style.top = '10px';
    saveButton.style.right = '10px';
    saveButton.style.zIndex = '9999';
    saveButton.style.padding = '8px 16px';
    saveButton.style.backgroundColor = '#4CAF50';
    saveButton.style.color = 'white';
    saveButton.style.border = 'none';
    saveButton.style.borderRadius = '4px';
    saveButton.style.cursor = 'pointer';
    
    document.body.appendChild(saveButton);

    // 会話データを収集する関数
    function collectConversation() {
        const conversations = [];
        
        // 質問と回答の要素を別々に取得
        const queryElements = Array.from(document.getElementsByClassName('group/query'));
        const proseElements = Array.from(document.getElementsByClassName('prose'));
        
        if (queryElements.length === 0) {
            console.log('質問要素が見つかりません。');
            return { conversations: [], protagonist: '', villain: '' };
        }
        
        if (proseElements.length === 0) {
            console.log('回答要素が見つかりません。');
            return { conversations: [], protagonist: '', villain: '' };
        }

        // 質問と回答が交互に並ぶと仮定し、インデックスでペアリング
        const minLength = Math.min(queryElements.length, proseElements.length);
        for (let i = 0; i < minLength; i++) {
            const question = queryElements[i].textContent.trim();
            
            // prose内のp要素から回答を取得
            const paragraphs = proseElements[i].getElementsByTagName('p');
            const answer = Array.from(paragraphs)
                .map(p => p.textContent.trim())
                .join('\n');
            
            conversations.push({
                question: question,
                answer: answer || '回答が見つかりませんでした'
            });
        }

        if (queryElements.length !== proseElements.length) {
            console.log(`警告: 質問(${queryElements.length})と回答(${proseElements.length})の数が一致しません。`);
        }

        // 主人公と悪党の設定を取得（最初の質問から）
        let protagonist = '';
        let villain = '';
        if (conversations.length > 0) {
            const firstQuestion = conversations[0].question;
            const protagonistMatch = firstQuestion.match(/# 主人公の設定\s*([^\n]+)/);
            const villainMatch = firstQuestion.match(/悪党の設定：\s*([^\n]+)/);
            if (protagonistMatch) {
                protagonist = protagonistMatch[1].trim();
            }
            if (villainMatch) {
                villain = villainMatch[1].trim();
            }
        }

        console.log('収集された会話:', conversations);
        console.log('主人公の設定:', protagonist);
        console.log('悪党の設定:', villain);
        
        return { conversations, protagonist, villain };
    }

    // ファイル名をサニタイズする関数
    function sanitizeFileName(baseText) {
        return baseText
            .trim()
            .replace(/[\\\/:*?"<>|]/g, '') // 問題となる記号を除去
            .replace(/\s+/g, '_')         // 連続する空白を_に置換
            .replace(/^_+|_+$/g, '')       // 先頭と末尾の_を除去
            .replace(/_+/g, '_');          // 連続する_を単一の_に置換
    }

    // 日時をyyyymmdd_hhmmss形式で取得する関数
    function getCurrentDateTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${year}${month}${day}_${hours}${minutes}${seconds}`;
    }

    // 保存ボタンのクリックハンドラ
    saveButton.addEventListener('click', () => {
        const { conversations, protagonist, villain } = collectConversation();
        
        if (conversations.length === 0) {
            alert('保存する会話が見つかりませんでした。');
            return;
        }

        // ファイル名のxxx部分を決定
        let xxx;
        if (protagonist) {
            xxx = protagonist;
        } else if (conversations.length > 0) {
            xxx = conversations[0].question.substring(0, 15);
        } else {
            xxx = 'unknown';
        }
        xxx = sanitizeFileName(xxx);

        // 日時を取得
        const dateTime = getCurrentDateTime();

        // ファイル名を生成
        const fileName = `${xxx}_${dateTime}.json`;

        // JSONデータに日時、主人公、悪党を追加
        const dataToSave = {
            saveDateTime: dateTime,
            protagonist: protagonist || '不明',
            villain: villain || '不明',
            conversations: conversations
        };

        // JSON形式に変換
        const jsonData = JSON.stringify(dataToSave, null, 2);
        
        // ファイルとしてダウンロード
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });

    // ホバー効果
    saveButton.addEventListener('mouseover', () => {
        saveButton.style.backgroundColor = '#45a049';
    });
    saveButton.addEventListener('mouseout', () => {
        saveButton.style.backgroundColor = '#4CAF50';
    });
})();