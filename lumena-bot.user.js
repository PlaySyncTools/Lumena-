// ==UserScript==
// @name         Lumena Auto Bot Definitivo
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Bot automatizado para Lumena con manejo de equipo, ataques y reaparición en ciudad.
// @match        https://*.lumena.gg/*
// @match        https://lumena.gg/*
// @updateURL    https://willlyams2025.github.io/Lumena-/lumena-bot.user.js
// @downloadURL  https://willlyams2025.github.io/Lumena-/lumena-bot.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- SELECTORES OFICIALES ---
    const SELECTOR_ALLY_HP = '#root > main > section > aside.battle-monster-hud.battle-monster-hud--ally > div.battle-monster-hud__hp-row';
    const SELECTOR_ENEMY_HP = '#root > main > section > aside.battle-monster-hud.battle-monster-hud--enemy > div.battle-monster-hud__hp-row > span.battle-monster-hud__hp-value';
    const SELECTOR_FIGHT = 'button.battle-action-button.battle-action-button--fight';
    const SELECTOR_TEAM = 'button.battle-action-button.battle-action-button--team';
    const SELECTOR_RUN = 'button.battle-action-button.battle-action-button--run';
    const SELECTOR_BACK = 'button.battle-team__action.battle-team__action--back';
    const SELECTOR_LOCATION = 'button.hud__location-button';

    const LATERAL_PATH = [
        'ArrowRight', 'ArrowRight',
        'ArrowLeft',  'ArrowLeft'
    ];

    let botMaster = null;
    let running = false;
    let teamRetryCount = 0;
    let walkStep = 0; 

    function toggleBot() {
        if (running) {
            clearInterval(botMaster);
            running = false;
            console.log("⏸️ Bot pausado.");
            updateButtonUI(false);
        } else {
            botMaster = setInterval(() => {
                const locationBtn = document.querySelector(SELECTOR_LOCATION);
                if (locationBtn && locationBtn.innerText.includes('Bloomvale')) {
                    clearInterval(botMaster);
                    running = false;
                    console.log("🏙️ ¡Reaparición en ciudad (Bloomvale) detectada! Bot apagado.");
                    updateButtonUI(false);
                    return;
                }

                const allyHpEl = document.querySelector(SELECTOR_ALLY_HP);
                const btnFight = document.querySelector(SELECTOR_FIGHT);
                const enemyHpEl = document.querySelector(SELECTOR_ENEMY_HP);
                const btnTeam = document.querySelector(SELECTOR_TEAM);
                const btnRun = document.querySelector(SELECTOR_RUN);
                const btnBack = document.querySelector(SELECTOR_BACK);

                let currentAllyHp = 99;
                if (allyHpEl) {
                    const match = allyHpEl.innerText.match(/(\d+)\/(\d+)/);
                    if (match) currentAllyHp = parseInt(match[1]);
                }

                const lumenRows = document.querySelectorAll('button.hud-menu__lumen-row');
                
                if (lumenRows.length > 0) {
                    let targetLumen = null;
                    for (let row of lumenRows) {
                        const text = row.innerText || '';
                        if (text.includes('IN BATTLE') || text.includes('FNT')) continue;

                    const hpMatch = text.match(/(\d+)\/(\d+)/);
                        if (hpMatch) {
                            const currentHp = parseInt(hpMatch[1]);
                            if (currentHp > 0) {
                                targetLumen = row;
                                break;
                            }
                        }
                    }

                    if (targetLumen) {
                        teamRetryCount = 0;
                        targetLumen.click();

                        setTimeout(() => {
                            const actionButtons = document.querySelectorAll('button.battle-team__action, button.battle-action-button');
                            for (let btn of actionButtons) {
                                const btnText = btn.innerText.toUpperCase();
                                if (btnText.includes('SWAP') || btnText.includes('CHANGE') || btnText.includes('SELECT') || btnText.includes('CONFIRM')) {
                                    btn.click();
                                    break;
                                }
                            }
                        }, 200);

                    } else {
                        console.log("🚨 ¡TODOS LOS POKÉMON ESTÁN DEBILITADOS! Saliendo y apagando bot...");
                        if (btnBack) btnBack.click();
                        
                        setTimeout(() => {
                            const btnRunNow = document.querySelector(SELECTOR_RUN);
                            if (btnRunNow) btnRunNow.click();
                        }, 150);

                        clearInterval(botMaster);
                        running = false;
                        updateButtonUI(false);
                        console.log("🛑 Bot detenido automáticamente.");
                    }
                    return;
                }

                if (currentAllyHp <= 1 && teamRetryCount < 2 && btnTeam) {
                    btnTeam.click();
                    return;
                }

                const moveButtons = document.querySelectorAll('button.battle-move-button');
                
                if (btnFight || moveButtons.length > 0 || enemyHpEl) {
                    let currentEnemyHp = 999;
                    if (enemyHpEl) currentEnemyHp = parseInt(enemyHpEl.innerText.split('/')[0]);
                    
                    if (currentEnemyHp === 0 || !enemyHpEl) {
                        teamRetryCount = 0;
                        pressKey(' '); 
                    } else {
                        if (currentAllyHp <= 1 && btnRun) {
                            btnRun.click();
                        } else {
                            if (moveButtons.length > 0) {
                                let validMove = null;
                                for (let moveBtn of moveButtons) {
                                    if (moveBtn.classList.contains('battle-move-button--exhausted')) continue;
                                    
                                    const text = moveBtn.innerText || '';
                                    const ppMatch = text.match(/(\d+)\/(\d+)/);
                                    if (ppMatch) {
                                        const currentPp = parseInt(ppMatch[1]);
                                        if (currentPp > 0) {
                                            validMove = moveBtn;
                                            break;
                                        }
                                    }
                                }

                                if (validMove) {
                                    validMove.click();
                                } else {
                                    console.log("⚠️ ¡Ataques agotados! Huyendo...");
                                    if (btnRun) btnRun.click();
                                }
                            } else if (btnFight) {
                                btnFight.click();
                            }
                        }
                    }
                } else {
                    teamRetryCount = 0;
                    const nextMove = LATERAL_PATH[walkStep % LATERAL_PATH.length];
                    pressKey(nextMove, 100);
                    walkStep++; 
                }
            }, 500); 
            
            running = true;
            console.log("▶️ Bot activado.");
            updateButtonUI(true);
        }
    }

    function pressKey(keyName, duration = 100) {
        const codeName = (keyName === ' ') ? 'Space' : keyName;
        const eventDown = new KeyboardEvent('keydown', { key: keyName, code: codeName, bubbles: true });
        const eventUp = new KeyboardEvent('keyup', { key: keyName, code: codeName, bubbles: true });
        document.dispatchEvent(eventDown);
        setTimeout(() => document.dispatchEvent(eventUp), duration);
    }

    function createFloatingButton() {
        if (document.getElementById('lumena-bot-toggle-btn')) return;
        const btn = document.createElement('button');
        btn.id = 'lumena-bot-toggle-btn';
        btn.innerText = '🤖 Bot: OFF';
        btn.style.position = 'fixed';
        btn.style.bottom = '20px';
        btn.style.right = '20px';
        btn.style.zIndex = '999999';
        btn.style.padding = '10px 15px';
        btn.style.backgroundColor = '#e74c3c';
        btn.style.color = 'white';
        btn.style.border = 'none';
        btn.style.borderRadius = '8px';
        btn.style.fontWeight = 'bold';
        btn.style.cursor = 'pointer';
        btn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
        
        btn.onclick = toggleBot;
        document.body.appendChild(btn);
    }

    function updateButtonUI(isActive) {
        const btn = document.getElementById('lumena-bot-toggle-btn');
        if (btn) {
            if (isActive) {
                btn.innerText = '🤖 Bot: ON';
                btn.style.backgroundColor = '#2ecc71';
            } else {
                btn.innerText = '🤖 Bot: OFF';
                btn.style.backgroundColor = '#e74c3c';
            }
        }
    }

    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'b' && document.activeElement.tagName !== 'INPUT') {
            toggleBot();
        }
    });

    window.addEventListener('load', () => {
        setTimeout(createFloatingButton, 2000);
    });

    setTimeout(createFloatingButton, 3000);

})();