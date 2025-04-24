// ==UserScript==
// @name         Perplexity Conversation Saver
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Save Perplexity conversations
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
    
    // ボタンをページに追加
    document.body.appendChild(saveButton);

    // 会話データを収集する関数
    function collectConversation() {
        const conversations = [];
        
        // 質問と回答のペアを取得
        const queryElements = document.getElementsByClassName('group/query');
        
        for (let queryEl of queryElements) {
            // 質問テキストを取得
            const question = queryEl.textContent.trim();
            
            // 対応する回答を取得（質問の次のprose要素を探す）
            let answer = '';
            let nextElement = queryEl.nextElementSibling;
            while (nextElement && !nextElement.classList.contains('group/query')) {
                if (nextElement.classList.contains('prose')) {
                    const paragraphs = nextElement.getElementsByTagName('p');
                    answer = Array.from(paragraphs)
                        .map(p => p.textContent.trim())
                        .join('\n');
                    break;
                }
                nextElement = nextElement.nextElementSibling;
            }
            
            conversations.push({
                question: question,
                answer: answer
            });
        }
        
        return conversations;
    }

    // 保存ボタンのクリックハンドラ
    saveButton.addEventListener('click', () => {
        const conversations = collectConversation();
        
        // JSON形式に変換
        const jsonData = JSON.stringify(conversations, null, 2);
        
        // ファイルとしてダウンロード
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `perplexity_conversation_${new Date().toISOString().split('T')[0]}.json`;
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