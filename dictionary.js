// THE BLACK Dictionary
document.addEventListener('DOMContentLoaded', function() {
    const wordInput = document.getElementById('word-input');
    const searchBtn = document.getElementById('search-btn');
    const definitionOutput = document.getElementById('definition-output');
    const languageSelect = document.getElementById('language-select');

    // Event listener for the search button
    searchBtn.addEventListener('click', searchWord);
    
    // Event listener for Enter key in the input field
    wordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchWord();
        }
    });

    // Event listener for language selection change
    languageSelect.addEventListener('change', function() {
        const word = wordInput.value.trim();
        if (word) {
            searchWord();
        }
    });

    function searchWord() {
        const word = wordInput.value.trim();
        const language = languageSelect.value;
        
        if (!word) {
            showError('Please enter a word to search.');
            return;
        }

        // Show loading state
        definitionOutput.innerHTML = '<div class="loading">Searching for "' + word + '" in ' + languageSelect.options[languageSelect.selectedIndex].text + '...</div>';

        // Use Free Dictionary API (no API key required)
        // Note: The Free Dictionary API primarily supports English, but we'll try to use the language parameter
        // For non-English words, we'll need to search in English but look for translations
        fetch(`https://api.dictionaryapi.dev/api/v2/entries/${language}/${word}`)
            .then(response => {
                if (!response.ok) {
                    // If the specific language fails, try English as fallback
                    if (language !== 'en') {
                        return fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error('Word not found');
                                }
                                return response.json();
                            })
                            .then(data => {
                                // Add a note that this is an English definition
                                data[0].note = `Note: This is the English definition for "${word}".`;
                                return data;
                            });
                    }
                    throw new Error('Word not found');
                }
                return response.json();
            })
            .then(data => {
                displayDefinition(data, language);
            })
            .catch(error => {
                showError('Word not found. Please check the spelling or try another word.');
                console.error('Error:', error);
            });
    }

    function displayDefinition(data, language) {
        const wordData = data[0];
        let html = `
            <div class="word-header">
                <h3>${wordData.word}</h3>
                ${wordData.phonetic ? `<p class="phonetic">${wordData.phonetic}</p>` : ''}
                ${wordData.note ? `<p class="note">${wordData.note}</p>` : ''}
            </div>
        `;

        // Display meanings
        if (wordData.meanings) {
            wordData.meanings.forEach(meaning => {
                html += `
                    <div class="meaning">
                        <h4>${meaning.partOfSpeech}</h4>
                        <ul class="definitions">
                `;
                
                meaning.definitions.forEach((def, index) => {
                    html += `
                        <li>
                            <strong>${index + 1}.</strong> ${def.definition}
                            ${def.example ? `<br><em>Example: "${def.example}"</em>` : ''}
                        </li>
                    `;
                });
                
                html += `
                        </ul>
                    </div>
                `;
            });
        }

        // Display translations if available
        if (wordData.translations) {
            html += `
                <div class="meaning">
                    <h4>Translations</h4>
                    <ul class="definitions">
            `;
            
            wordData.translations.forEach((translation, index) => {
                html += `
                    <li>
                        <strong>${index + 1}.</strong> ${translation.text} (${translation.lang})
                    </li>
                `;
            });
            
            html += `
                    </ul>
                </div>
            `;
        }

        // Display audio pronunciation if available
        if (wordData.phonetics && wordData.phonetics.length > 0) {
            const audio = wordData.phonetics.find(p => p.audio);
            if (audio) {
                html += `
                    <div class="audio-section">
                        <h4>Pronunciation</h4>
                        <audio controls>
                            <source src="${audio.audio}" type="audio/mpeg">
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                `;
            }
        }

        definitionOutput.innerHTML = html;
    }

    function showError(message) {
        definitionOutput.innerHTML = `<div class="error">${message}</div>`;
    }
});
