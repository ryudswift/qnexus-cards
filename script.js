document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const config = {
        playerAge: 42, // As per PRD, for level capping
        ownerId: 'SudoDev' // Static owner ID for MVP
    };

    // --- APPLICATION STATE ---
    // In a full implementation, this would be populated by reading JSON files.
    const state = {
        allCardData: {}, // Will hold full data from individual JSONs (key: cardId)
        db: [],          // Will hold simplified data for dashboard rendering
        playerXP: 0,
        trueLevel: 1,
        currentCardId: null, // ID of card in main modal
        currentQuiz: null    // Data for quiz in progress
    };

    // --- DOM ELEMENT REFERENCES ---
    const syncLibraryBtn = document.getElementById('sync-library-btn');
    const syncStatus = document.getElementById('sync-status');
    const cardLibrary = document.getElementById('card-library');
    const loadingSpinner = document.getElementById('loading-spinner');
    const kpiTotal = document.getElementById('kpi-total-cards');
    const kpiMastered = document.getElementById('kpi-cards-mastered');
    const kpiRate = document.getElementById('kpi-mastery-rate');
    const playerLevelDisplay = document.getElementById('player-level-display');

    // Modal elements
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalSummary = document.getElementById('modal-summary');
    const modalImg = document.getElementById('modal-img');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const flipCardBtn = document.getElementById('flip-card-btn');
    const modalCard = modal.querySelector('.modal-card');
    const modalBackTitle = document.getElementById('modal-back-title');
    const modalBackContent = document.getElementById('modal-back-content');
    const modalActionButtons = document.getElementById('modal-action-buttons');

    // Quiz Modal elements
    const quizModal = document.getElementById('quiz-modal');
    const quizTitle = document.getElementById('quiz-title');
    const quizQuestionsArea = document.getElementById('quiz-questions-area');
    const quizSubmitBtn = document.getElementById('quiz-submit-btn');
    const quizResultText = document.getElementById('quiz-result-text');

    /**
     * Synchronizes the card library by scanning for JSON files in card directories.
     * This implementation works with GitHub Pages by trying to fetch files with predictable names.
     */
    async function simulateFileSync() {
        syncStatus.textContent = 'Scanning directories...';
        
        try {
            // Reset state for clean sync
            state.allCardData = {};
            state.db = [];
            
            // Define the categories to scan
            const categories = ['health', 'relationships', 'wealth'];
            let cardCount = 0;
            
            // Try to fetch our known sample card first
            try {
                const response = await fetch('cards/wealth/[WI]-017-Significant_Income_through_Clipping.json');
                if (response.ok) {
                    const cardData = await response.json();
                    
                    // Add to database
                    state.db.push({
                        id: cardData.id,
                        cardName: cardData.cardName,
                        title: cardData.title,
                        summary: cardData.summary,
                        coverArtUrl: cardData.coverArtUrl,
                        rarityScore: cardData.rarityScore,
                        status: cardData.status || "Not Started",
                        level: cardData.level || 1,
                        category: cardData.category || "wealth",
                        latentAbility: cardData.latentAbility
                    });
                    
                    // Add full data to allCardData for quizzes etc.
                    state.allCardData[cardData.id] = cardData;
                    cardCount++;
                }
            } catch (e) {
                // It's okay if the sample card doesn't exist
            }
            
            // For each category, try to fetch card files with common patterns
            for (const category of categories) {
                // Try different numbering patterns (001 to 050)
                for (let i = 1; i <= 50; i++) {
                    // Format number with leading zeros
                    const num = i.toString().padStart(3, '0');
                    
                    // Try common file naming patterns
                    const fileNames = [
                        `[WI]-${num}-Sample.json`,
                        `[HI]-${num}-Sample.json`,
                        `[RI]-${num}-Sample.json`,
                        `[WI]-${num}.json`,
                        `[HI]-${num}.json`,
                        `[RI]-${num}.json`,
                        `WI-${num}.json`,
                        `HI-${num}.json`,
                        `RI-${num}.json`
                    ];
                    
                    // Try each filename
                    for (const fileName of fileNames) {
                        // Skip the sample file we already tried
                        if (category === 'wealth' && fileName === '[WI]-017-Significant_Income_through_Clipping.json') {
                            continue;
                        }
                        
                        try {
                            const response = await fetch(`cards/${category}/${fileName}`);
                            
                            if (response.ok) {
                                const cardData = await response.json();
                                
                                // Check if this card is already in our database
                                if (!state.db.some(card => card.id === cardData.id)) {
                                    // Add to database
                                    state.db.push({
                                        id: cardData.id,
                                        cardName: cardData.cardName,
                                        title: cardData.title,
                                        summary: cardData.summary,
                                        coverArtUrl: cardData.coverArtUrl,
                                        rarityScore: cardData.rarityScore,
                                        status: cardData.status || "Not Started",
                                        level: cardData.level || 1,
                                        category: cardData.category || category,
                                        latentAbility: cardData.latentAbility
                                    });
                                    
                                    // Add full data to allCardData for quizzes etc.
                                    state.allCardData[cardData.id] = cardData;
                                    cardCount++;
                                }
                            }
                        } catch (e) {
                            // It's okay if a file doesn't exist
                        }
                    }
                }
            }
            
            syncStatus.textContent = `Sync complete. Found ${cardCount} cards.`;
        } catch (error) {
            console.error("Sync error:", error);
            syncStatus.textContent = 'Sync failed. Check console for details.';
        }
        
        setTimeout(() => {
            if (syncStatus.textContent.startsWith('Sync complete') || syncStatus.textContent.startsWith('Sync failed')) {
                syncStatus.textContent = '';
            }
        }, 4000);

        render(); // Render the updated state
    }

    /**
     * Renders all parts of the application based on the current state.
     */
    function render() {
        if (state.db.length > 0) {
            loadingSpinner.style.display = 'none';
        } else {
            // Update spinner message if library is empty
            loadingSpinner.innerHTML = `<p class="text-lg">Click "Sync Library" to begin.</p>`;
        }
        cardLibrary.innerHTML = '';
        calculatePlayerLevel();
        renderDashboard();
        renderCards();
    }

    /**
     * Calculates player level based on mastered cards (Level 3).
     */
    function calculatePlayerLevel() {
        const masteredCards = state.db.filter(card => card.level === 3).length;
        state.playerXP = masteredCards * 100; // 100 XP per mastered card
        state.trueLevel = Math.floor(state.playerXP / 100) + 1; // Start at level 1
    }

    /**
     * Updates the KPI displays and player level on the dashboard.
     */
    function renderDashboard() {
        const totalCards = state.db.length;
        const cardsMastered = state.db.filter(card => card.level === 3).length;
        const masteryRate = totalCards > 0 ? Math.round((cardsMastered / totalCards) * 100) : 0;

        kpiTotal.textContent = totalCards;
        kpiMastered.textContent = cardsMastered;
        kpiRate.textContent = `${masteryRate}%`;

        const displayLevel = Math.min(state.trueLevel, config.playerAge);
        playerLevelDisplay.innerHTML = `
            <div class="font-bold text-2xl text-purple-400">LVL ${displayLevel}</div>
            <div class="text-xs text-gray-500">True Lvl: ${state.trueLevel}</div>
        `;
    }

    /**
     * Renders the Nexus Cards into the library grid.
     */
    function renderCards() {
        state.db.forEach(card => {
            const cardContainer = document.createElement('div');
            cardContainer.className = 'perspective-container';

            // Determine border style based on card level
            let borderClass = 'border border-gray-700'; // Default for Level 1
            if (card.level === 2) borderClass = 'level-2-border';
            if (card.level === 3) borderClass = 'level-3-border';

            cardContainer.innerHTML = `
                <div class="nexus-card w-full aspect-[2.5/3.5] bg-gray-900/60 rounded-lg shadow-xl p-3 flex flex-col justify-between warframe-glare ${borderClass}">
                    <div class="flex justify-between items-start text-xs">
                        <span class="font-bold text-white truncate pr-2">${card.cardName}</span>
                        <span class="font-black text-yellow-400">${card.rarityScore}</span>
                    </div>
                    <div class="flex-grow my-2 flex items-center justify-center">
                        <img src="${card.coverArtUrl}" alt="${card.cardName}" class="max-h-full max-w-full object-contain rounded-md">
                    </div>
                    <div class="text-center text-xs">
                        ${card.level === 3 ?
                            `<span class="font-bold text-yellow-300 tracking-widest">:: MASTERED ::</span>` :
                            `<span class="text-gray-500">Level ${card.level}</span>`
                        }
                    </div>
                </div>
            `;
            cardContainer.addEventListener('click', () => openModal(card.id));
            add3dHoverEffect(cardContainer);
            cardLibrary.appendChild(cardContainer);
        });
    }

    /**
     * Opens the detailed modal for a specific card.
     * @param {string} cardId - The ID of the card to display.
     */
    function openModal(cardId) {
        state.currentCardId = cardId;
        // Find card data in our "database"
        const card = state.db.find(c => c.id === cardId);
        if (!card) {
            console.error("Card not found in DB:", cardId);
            return;
        }

        // Populate Front of Card
        modalTitle.textContent = card.cardName;
        modalSummary.textContent = card.summary;
        modalImg.src = card.coverArtUrl;

        // Populate Back of Card
        modalBackTitle.textContent = `${card.cardName} - Intel`;

        // Determine Latent Ability display
        let latentAbilityHTML = card.level === 3 ?
            `<p class="text-sm text-yellow-300"><span class="font-bold">Latent Ability:</span> ${card.latentAbility}</p>` :
            `<p class="text-sm text-gray-500"><span class="font-bold">Latent Ability:</span> [Locked - Reach Level 3]</p>`;

        modalBackContent.innerHTML = `
            <p class="text-sm"><span class="font-bold">Level:</span> ${card.level} (${card.status})</p>
            <p class="text-sm"><span class="font-bold">Rarity:</span> ${card.rarityScore}</p>
            <p class="text-sm"><span class="font-bold">Category:</span> ${card.category}</p>
            ${latentAbilityHTML}
        `;

        // Populate Action Buttons based on card level
        modalActionButtons.innerHTML = ''; // Clear previous buttons
        if (card.level === 1) {
            const quizBtn = createModalButton('Take Quiz: Level 1', 'bg-green-600', () => startQuiz(card.id, 1));
            modalActionButtons.appendChild(quizBtn);
        } else if (card.level === 2) {
            // Order: Guide first, then Quiz (as in Beta v1.11)
            const guideBtn = createModalButton('View Full Guide', 'bg-blue-600', () => window.open(card.docUrl, '_blank'));
            const quizBtn = createModalButton('Take Quiz: Level 2', 'bg-green-600', () => startQuiz(card.id, 2));
            modalActionButtons.appendChild(guideBtn);
            modalActionButtons.appendChild(quizBtn);
        } else if (card.level === 3) {
            const guideBtn = createModalButton('View Full Guide', 'bg-blue-600', () => window.open(card.docUrl, '_blank'));
            modalActionButtons.appendChild(guideBtn);
        }

        // Reset card flip state and show modal
        modalCard.classList.remove('is-flipped');
        modal.classList.remove('hidden');
    }

    /**
     * Helper function to create styled buttons for the modal.
     * @param {string} text - Button text.
     * @param {string} bgColor - Tailwind background color class.
     * @param {Function} onClick - Click handler function.
     * @returns {HTMLButtonElement} - The created button element.
     */
    function createModalButton(text, bgColor, onClick) {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.className = `${bgColor} hover:opacity-80 text-white font-bold py-2 px-4 rounded-md transition-colors duration-300 flex-1`;
        btn.onclick = onClick;
        return btn;
    }

    /**
     * Closes the main card detail modal.
     */
    function closeModal() {
        modal.classList.add('hidden');
        state.currentCardId = null;
    }

    /**
     * Starts the quiz process for a given card and level.
     * @param {string} cardId - The ID of the card.
     * @param {number} level - The level of the quiz (1 or 2).
     */
    function startQuiz(cardId, level) {
        closeModal(); // Close the main card modal first

        // Get the full card data (which contains quiz questions)
        const fullCardData = state.allCardData[cardId];
        // Select the correct quiz data based on level
        const quizData = level === 1 ? fullCardData.quizLevel1 : fullCardData.quizLevel2;

        if (!quizData || !quizData.questions || quizData.questions.length === 0) {
            alert('Quiz data not found or is empty for this level.');
            return;
        }

        // Store current quiz state
        state.currentQuiz = { cardId, level, questions: quizData.questions };

        // Populate Quiz Modal UI
        quizTitle.textContent = `${fullCardData.cardName} - Quiz Level ${level}`;
        quizQuestionsArea.innerHTML = '';
        quizResultText.textContent = '';
        quizResultText.className = 'text-lg font-semibold'; // Reset result text style
        quizSubmitBtn.disabled = false;

        // Dynamically create quiz questions
        quizData.questions.forEach((q, index) => {
            const questionEl = document.createElement('div');
            questionEl.className = 'mb-6';

            // Create HTML for answer options
            let optionsHTML = q.options.map((opt, i) => `
                <div class="quiz-option p-3 border border-gray-700 rounded-md cursor-pointer hover:bg-gray-700" data-q-index="${index}" data-opt-index="${i}">
                    <span class="font-bold mr-2">${String.fromCharCode(65 + i)}:</span> ${opt}
                </div>
            `).join('');

            questionEl.innerHTML = `
                <p class="font-semibold mb-3">${index + 1}. ${q.text}</p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">${optionsHTML}</div>
            `;
            quizQuestionsArea.appendChild(questionEl);
        });

        // Add interactivity to quiz options (select one per question)
        quizQuestionsArea.querySelectorAll('.quiz-option').forEach(el => {
            el.addEventListener('click', (e) => {
                const qIndex = e.currentTarget.dataset.qIndex;
                // Deselect other options for the same question
                quizQuestionsArea.querySelectorAll(`.quiz-option[data-q-index="${qIndex}"]`).forEach(opt => opt.classList.remove('selected'));
                // Select the clicked option
                e.currentTarget.classList.add('selected');
            });
        });

        // Show the quiz modal
        quizModal.classList.remove('hidden');
    }

    /**
     * Handles the submission and grading of the current quiz.
     */
    function submitQuiz() {
        if (!state.currentQuiz) return;

        const { cardId, level, questions } = state.currentQuiz;
        let score = 0;

        // Grade each question
        questions.forEach((q, qIndex) => {
            // Find all options and the selected one for this question
            const options = quizQuestionsArea.querySelectorAll(`.quiz-option[data-q-index="${qIndex}"]`);
            const selectedOption = quizQuestionsArea.querySelector(`.quiz-option[data-q-index="${qIndex}"].selected`);

            if (!selectedOption) return; // Skip if no answer was selected

            // Get the text of the selected answer
            const selectedAnswerIndex = selectedOption.dataset.optIndex;
            const selectedAnswer = q.options[selectedAnswerIndex];
            const correctAnswer = q.correct;

            // Remove selection highlight for clarity
            options.forEach(opt => opt.classList.remove('selected'));

            // Check if the answer is correct and apply styling
            if (selectedAnswer === correctAnswer) {
                score++;
                selectedOption.classList.add('correct');
            } else {
                selectedOption.classList.add('incorrect');
                // Highlight the correct answer for feedback
                options.forEach(opt => {
                    if (q.options[opt.dataset.optIndex] === correctAnswer) {
                        opt.classList.add('correct');
                    }
                });
            }
        });

        // Disable submit button to prevent multiple submissions
        quizSubmitBtn.disabled = true;

        // Determine pass/fail (e.g., 80% required)
        const passingScore = Math.ceil(questions.length * 0.8);
        const passed = score >= passingScore;

        // Display result
        if (passed) {
            quizResultText.textContent = `Passed! (${score}/${questions.length})`;
            quizResultText.className = 'text-lg font-semibold text-green-400';

            // Update card level in the "database"
            const cardInDb = state.db.find(c => c.id === cardId);
            if (cardInDb) {
                cardInDb.level = level + 1; // Level up
                // Update status based on new level
                if (cardInDb.level === 3) {
                    cardInDb.status = 'Complete';
                } else if (cardInDb.level === 2) {
                    cardInDb.status = 'In Progress';
                }
                console.log(`Card ${cardId} leveled up to ${cardInDb.level}`);
            }

            // After a short delay, close the quiz and refresh the dashboard
            setTimeout(() => {
                quizModal.classList.add('hidden');
                render(); // Re-render to show updated card levels/stats
            }, 2000);

        } else {
            quizResultText.textContent = `Failed. (${score}/${questions.length}). Review and try again!`;
            quizResultText.className = 'text-lg font-semibold text-red-400';

            // Close quiz modal after delay
            setTimeout(() => {
                quizModal.classList.add('hidden');
            }, 2000);
        }
    }

    /**
     * Adds the 3D hover effect to a card element.
     * @param {HTMLElement} container - The perspective container div.
     */
    function add3dHoverEffect(container) {
        const card = container.querySelector('.nexus-card');
        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const { width, height } = rect;
            const rotateX = (y / height - 0.5) * -25; // Invert Y axis
            const rotateY = (x / width - 0.5) * 25;
            card.style.setProperty('--rotateX', `${rotateX}deg`);
            card.style.setProperty('--rotateY', `${rotateY}deg`);
        });
        container.addEventListener('mouseleave', () => {
            card.style.setProperty('--rotateX', '0deg');
            card.style.setProperty('--rotateY', '0deg');
        });
    }

    // --- EVENT LISTENERS & INITIALIZATION ---
    function init() {
        syncLibraryBtn.addEventListener('click', simulateFileSync);
        modalCloseBtn.addEventListener('click', closeModal);
        // Close modal if backdrop is clicked
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
        flipCardBtn.addEventListener('click', () => modalCard.classList.toggle('is-flipped'));

        quizSubmitBtn.addEventListener('click', submitQuiz);
        // Close quiz modal if backdrop is clicked (optional)
        // quizModal.addEventListener('click', (e) => { if (e.target === quizModal) quizModal.classList.add('hidden'); });

        // Initial load - try to sync cards
        simulateFileSync();
    }

    init();
});
