let cardCount = 0;
const cardsContainer = document.getElementById('cardsContainer');
let promptData = {};

// Load data from JSON files
async function loadData() {
    try {
        const [actors, modifiers, motivators, elements, conflicts] = await Promise.all([
            fetch('actors.json').then(res => res.json()),
            fetch('modifiers.json').then(res => res.json()),
            fetch('motivators.json').then(res => res.json()),
            fetch('elements.json').then(res => res.json()),
            fetch('conflicts.json').then(res => res.json())
        ]);
        promptData = {
            "Actor": actors,
            "Actor Modifier": modifiers,
            "Motivator": motivators,
            "Element": elements,
            "Element Modifier": modifiers,
            "Conflict": conflicts
        };
        initializeCards();
    } catch (error) {
        console.error('Error loading JSON files:', error);
        document.getElementById('promptOutput').innerText = "Error loading prompt data. Check console.";
    }
}

// Function to get the correct article ("a" or "an")
function getArticle(word) {
    const firstLetter = word[0].toLowerCase();
    return ['a', 'e', 'i', 'o', 'u'].includes(firstLetter) ? 'an' : 'a';
}

// Function to add a new card
function addCard(type = null) {
    const cardId = `card-${cardCount++}`;
    const card = document.createElement('div');
    card.className = 'card';
    card.id = cardId;
    card.innerHTML = `
        <select id="select-${cardId}">
            <option value="Actor">Actor</option>
            <option value="Actor Modifier">Actor Modifier</option>
            <option value="Motivator">Motivator</option>
            <option value="Element">Element</option>
            <option value="Element Modifier">Element Modifier</option>
            <option value="Conflict">Conflict</option>
        </select>
        <button onclick="generateCardPrompt('${cardId}')">Try again</button>
        <button class="remove-btn" onclick="removeCard('${cardId}')">X</button>
        <p id="result-${cardId}"></p>
    `;
    if (type) {
        card.querySelector('select').value = type;
    }
    return card;
}

// Function to add a plus button
function addPlusButton() {
    const plusButton = document.createElement('button');
    plusButton.textContent = '+';
    plusButton.className = 'plus-btn';
    plusButton.onclick = function() {
        const newCard = addCard();
        const nextCard = this.nextElementSibling;
        cardsContainer.insertBefore(newCard, this.nextElementSibling);
        if (nextCard && nextCard.className !== 'plus-btn') {
            const newPlus = addPlusButton();
            cardsContainer.insertBefore(newPlus, nextCard);
        }
        generatePrompt();
    };
    return plusButton;
}

// Function to generate a prompt for a specific card
function generateCardPrompt(cardId) {
    const card = document.getElementById(cardId);
    const select = card.querySelector('select');
    const type = select.value;
    if (!promptData[type]) return;
    const items = promptData[type];
    const item = items[Math.floor(Math.random() * items.length)];
    const resultP = card.querySelector('p');
    resultP.innerHTML = `<strong>${type}:</strong> ${item}`;
    generatePrompt();
}

// Function to remove a card and adjust plus buttons
function removeCard(cardId) {
    const card = document.getElementById(cardId);
    const prevSibling = card.previousElementSibling;
    const nextSibling = card.nextElementSibling;
    card.remove();
    if (nextSibling && nextSibling.className === 'plus-btn' && 
        prevSibling && prevSibling.className === 'plus-btn') {
        nextSibling.remove();
    }
    generatePrompt();
}

// Function to generate the full prompt sentence with flexible card combinations
function generatePrompt() {
    const cards = Array.from(cardsContainer.getElementsByClassName('card'));
    let actorPhrases = [];
    let currentActorModifiers = [];
    let motivatorElementPairs = [];
    let currentElementModifiers = [];
    let currentMotivator = null;
    let conflicts = [];

    // Process cards in order
    cards.forEach(card => {
        const select = card.querySelector('select');
        const type = select.value;
        const resultP = card.querySelector('p');
        let item = resultP.textContent.replace(`${type}: `, '').trim();
        if (!item) return;

        if (type === "Actor Modifier") {
            currentActorModifiers.push(item);
        } else if (type === "Actor") {
            const firstWord = currentActorModifiers.length > 0 ? currentActorModifiers[0] : item;
            const article = getArticle(firstWord);
            const actorPhrase = `${article} ${currentActorModifiers.join(' ')} ${item}`.trim();
            actorPhrases.push(actorPhrase);
            currentActorModifiers = [];
        } else if (type === "Motivator") {
            if (currentMotivator) {
                // If there's a pending motivator without an element, pair it with a default
                motivatorElementPairs.push(`${currentMotivator} something`);
            }
            currentMotivator = item;
        } else if (type === "Element Modifier") {
            currentElementModifiers.push(item);
        } else if (type === "Element") {
            const firstElementWord = currentElementModifiers.length > 0 ? currentElementModifiers[0] : item;
            const elementArticle = getArticle(firstElementWord);
            const elementPhrase = `${elementArticle} ${currentElementModifiers.join(' ')} ${item}`.trim();
            if (currentMotivator) {
                motivatorElementPairs.push(`${currentMotivator} ${elementPhrase}`);
                currentMotivator = null;
            } else {
                motivatorElementPairs.push(`does something with ${elementPhrase}`);
            }
            currentElementModifiers = [];
        } else if (type === "Conflict") {
            conflicts.push(item);
        }
    });

    // Handle any unpaired motivator at the end
    if (currentMotivator) {
        motivatorElementPairs.push(`${currentMotivator} something`);
    }

    // Construct the sentence
    const actorsText = actorPhrases.length > 0 ? actorPhrases.join(' and ') : 'someone';
    const motivatorText = motivatorElementPairs.length > 0 
        ? motivatorElementPairs.join(', who ') 
        : 'does something';
    const conflictsText = conflicts.length > 0 ? `but ${conflicts.join(' and ')}` : 'but faces an obstacle';
    const prompt = `${actorsText} ${motivatorText}, ${conflictsText}.`;

    // Capitalize the first letter
    const capitalizedPrompt = prompt.charAt(0).toUpperCase() + prompt.slice(1);
    
    document.getElementById('promptOutput').innerText = capitalizedPrompt;
}

// Function to generate prompts without resetting if more than 5 cards
function generateStandardPrompt() {
    const cards = Array.from(cardsContainer.getElementsByClassName('card'));
    if (cards.length <= 5) {
        cardsContainer.innerHTML = '';
        const initialTypes = ['Actor Modifier', 'Actor', 'Motivator', 'Element', 'Conflict'];
        initialTypes.forEach((type, index) => {
            const card = addCard(type);
            cardsContainer.appendChild(card);
            if (index < initialTypes.length - 1) {
                const plusButton = addPlusButton();
                cardsContainer.appendChild(plusButton);
            }
            generateCardPrompt(card.id);
        });
    } else {
        cards.forEach(card => generateCardPrompt(card.id));
    }
}

// Function to export saved prompts to a TXT file
function exportToTxt() {
    const text = document.getElementById('savedPrompts').value;
    const blob = new Blob([text], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'saved_prompts.txt';
    link.click();
    URL.revokeObjectURL(link.href);
}

// Initialize after data load
function initializeCards() {
    const initialTypes = ['Actor Modifier', 'Actor', 'Motivator', 'Element', 'Conflict'];
    initialTypes.forEach((type, index) => {
        const card = addCard(type);
        cardsContainer.appendChild(card);
        if (index < initialTypes.length - 1) {
            const plusButton = addPlusButton();
            cardsContainer.appendChild(plusButton);
        }
        generateCardPrompt(card.id);
    });
}

// Start the process
loadData();