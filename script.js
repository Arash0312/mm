let GAME_SETTINGS = {
    minBombHits: Math.floor(Math.random() * 2),
    minIceHits: Math.floor(Math.random() * 2) + 2,
    flowerSkipPercentage: Math.floor(Math.random() * 11) + 15,
    minDelayMs: 2000,
    maxDelayMs: 5000,
    autoClickPlay: false
};

let isGamePaused = false;

try {
    let gameStats = {
        score: 0,
        bombHits: 0,
        iceHits: 0,
        flowersSkipped: 0,
        isGameOver: false,
    };

    const originalPush = Array.prototype.push;
    Array.prototype.push = function (...items) {
        if (!isGamePaused) {
            items.forEach(item => handleGameElement(item));
        }
        return originalPush.apply(this, items);
    };

    function handleGameElement(element) {
        if (!element || !element.item) return;

        const { type } = element.item;
        switch (type) {
            case "CLOVER":
                processFlower(element);
                break;
            case "BOMB":
                processBomb(element);
                break;
            case "FREEZE":
                processIce(element);
                break;
        }
    }

    function processFlower(element) {
        const shouldSkip = Math.random() < (GAME_SETTINGS.flowerSkipPercentage / 100);
        if (shouldSkip) {
            gameStats.flowersSkipped++;
        } else {
            gameStats.score++;
            clickElement(element);
        }
    }

    function processBomb(element) {
        if (gameStats.bombHits < GAME_SETTINGS.minBombHits) {
            gameStats.score = 0;
            clickElement(element);
            gameStats.bombHits++;
        }
    }

    function processIce(element) {
        if (gameStats.iceHits < GAME_SETTINGS.minIceHits) {
            clickElement(element);
            gameStats.iceHits++;
        }
    }

    function clickElement(element) {
        element.onClick(element);
        element.isExplosion = true;
        element.addedAt = performance.now();
    }

    function checkGameCompletion() {
        const rewardElement = document.querySelector('#app > div > div > div.content > div.reward');
        if (rewardElement && !gameStats.isGameOver) {
            gameStats.isGameOver = true;
            resetGameStats();
        }
    }

    function resetGameStats() {
        gameStats = {
            score: 0,
            bombHits: 0,
            iceHits: 0,
            flowersSkipped: 0,
            isGameOver: false,
        };
    }

    function getNewGameDelay() {
        return Math.floor(Math.random() * (GAME_SETTINGS.maxDelayMs - GAME_SETTINGS.minDelayMs + 1) + GAME_SETTINGS.minDelayMs);
    }

    function checkAndClickPlayButton() {
        const playButtons = document.querySelectorAll('button.kit-button.is-large.is-primary, a.play-btn[href="/game"]');

        playButtons.forEach(button => {
            if (!isGamePaused && GAME_SETTINGS.autoClickPlay && /Play/.test(button.textContent)) {
                setTimeout(() => {
                    button.click();
                    gameStats.isGameOver = false;
                }, getNewGameDelay());
            }
        });
    }

    function continuousPlayButtonCheck() {
        checkAndClickPlayButton();
        setTimeout(continuousPlayButtonCheck, 1000);
    }

    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                checkGameCompletion();
            }
        }
    });

    const appElement = document.querySelector('#app');
    if (appElement) {
        observer.observe(appElement, { childList: true, subtree: true });
    }

    continuousPlayButtonCheck();

    const settingsMenu = document.createElement('div');
    settingsMenu.className = 'settings-menu';
    settingsMenu.style.display = 'none';

    const menuTitle = document.createElement('h3');
    menuTitle.className = 'settings-title';
    menuTitle.textContent = 'Blum Autoclicker';

    const closeButton = document.createElement('button');
    closeButton.className = 'settings-close-button';
    closeButton.textContent = '×';
    closeButton.onclick = () => {
        settingsMenu.style.display = 'none';
    };

    menuTitle.appendChild(closeButton);
    settingsMenu.appendChild(menuTitle);
    
    function updateSettingsMenu() {
        document.getElementById('flowerSkipPercentage').value = GAME_SETTINGS.flowerSkipPercentage;
        document.getElementById('flowerSkipPercentageDisplay').textContent = GAME_SETTINGS.flowerSkipPercentage;
        document.getElementById('minIceHits').value = GAME_SETTINGS.minIceHits;
        document.getElementById('minIceHitsDisplay').textContent = GAME_SETTINGS.minIceHits;
        document.getElementById('minBombHits').value = GAME_SETTINGS.minBombHits;
        document.getElementById('minBombHitsDisplay').textContent = GAME_SETTINGS.minBombHits;
        document.getElementById('minDelayMs').value = GAME_SETTINGS.minDelayMs;
        document.getElementById('minDelayMsDisplay').textContent = GAME_SETTINGS.minDelayMs;
        document.getElementById('maxDelayMs').value = GAME_SETTINGS.maxDelayMs;
        document.getElementById('maxDelayMsDisplay').textContent = GAME_SETTINGS.maxDelayMs;
        document.getElementById('autoClickPlay').checked = GAME_SETTINGS.autoClickPlay;
    }

    settingsMenu.appendChild(createSettingElement('Flower Skip (%)', 'flowerSkipPercentage', 'range', 0, 100, 1,
        'EN: Percentage probability of skipping a flower.<br>' +
        'RU: Вероятность пропуска цветка в процентах.'));
    settingsMenu.appendChild(createSettingElement('Minimum Ice Hits', 'minIceHits', 'range', 0, 10, 1,
        'EN: Minimum times the ice must be clicked.<br>' +
        'RU: Минимальное количество кликов по льду.'));
    settingsMenu.appendChild(createSettingElement('Minimum Bomb Hits', 'minBombHits', 'range', 0, 10, 1,
        'EN: Minimum times the bomb must be clicked.<br>' +
        'RU: Минимальное количество кликов по бомбе.'));
    settingsMenu.appendChild(createSettingElement('Minimum Delay (ms)', 'minDelayMs', 'number', 0, 10000, 100,
        'EN: Minimum delay between actions.<br>' +
        'RU: Минимальная задержка между действиями.'));
    settingsMenu.appendChild(createSettingElement('Maximum Delay (ms)', 'maxDelayMs', 'number', 0, 10000, 100,
        'EN: Maximum delay between actions.<br>' +
        'RU: Максимальная задержка между действиями.'));
    settingsMenu.appendChild(createSettingElement('Auto Click Play', 'autoClickPlay', 'checkbox', 0, 1, 1,
        'EN: Automatically click the play button.<br>' +
        'RU: Автоматически нажимать кнопку воспроизведения.'));
    
    function createSettingElement(labelText, id, type, min, max, step, description) {
        const settingContainer = document.createElement('div');
        const label = document.createElement('label');
        label.textContent = labelText;
        const input = document.createElement('input');
        input.type = type;
        input.id = id;
        if (type === 'range' || type === 'number') {
            input.min = min;
            input.max = max;
            input.step = step;
            input.oninput = (e) => {
                GAME_SETTINGS[id] = parseFloat(e.target.value);
                document.getElementById(id + 'Display').textContent = e.target.value;
            };
        } else if (type === 'checkbox') {
            input.onchange = (e) => {
                GAME_SETTINGS[id] = e.target.checked;
            };
        }
        const span = document.createElement('span');
        span.id = id + 'Display';
        settingContainer.appendChild(label);
        settingContainer.appendChild(input);
        settingContainer.appendChild(span);
        const descriptionDiv = document.createElement('div');
        descriptionDiv.innerHTML = description;
        settingContainer.appendChild(descriptionDiv);
        return settingContainer;
    }

    document.body.appendChild(settingsMenu);

    const toggleSettingsButton = document.createElement('button');
    toggleSettingsButton.textContent = 'Toggle Settings';
    toggleSettingsButton.onclick = () => {
        settingsMenu.style.display = settingsMenu.style.display === 'none' ? 'block' : 'none';
        updateSettingsMenu();
    };
    document.body.appendChild(toggleSettingsButton);

    const pauseResumeButton = document.querySelector('.pause-resume-btn');
    pauseResumeButton.onclick = () => {
        isGamePaused = !isGamePaused;
        pauseResumeButton.textContent = isGamePaused ? 'Resume' : 'Pause';
    };

    const socialButtons = document.createElement('div');
    socialButtons.className = 'social-buttons';
    const links = [
        { href: 'https://github.com/mudachyo/Blum', text: 'GitHub' },
        { href: 'https://t.me/shopalenka', text: 'Telegram Channel' },
        { href: 'https://mudachyo.codes/donate/', text: 'Donate' }
    ];
    links.forEach(link => {
        const button = document.createElement('a');
        button.href = link.href;
        button.target = '_blank';
        button.className = 'social-button';
        button.textContent = link.text;
        socialButtons.appendChild(button);
    });
    document.body.appendChild(socialButtons);
} catch (e) {
    console.error(e);
}
