document.addEventListener('DOMContentLoaded', function() {
    const addButton = document.querySelector('.add-exercise-button');
    const modal = document.getElementById('exerciseModal');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const form = document.getElementById('newExerciseForm');
    const mainContainer = document.querySelector('.exercise-container');
    let exercises = [];
    let editingIndex = null;

    // Carica gli esercizi salvati
    loadExercises();

    addButton.addEventListener('click', () => {
        editingIndex = null;
        form.reset();
        modal.style.display = 'block';
    });

    cancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        form.reset();
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const exerciseData = {
            name: form.querySelector('input[placeholder="Nome esercizio"]').value,
            series: form.querySelector('input[placeholder="Serie"]').value,
            reps: form.querySelector('input[placeholder="Ripetizioni"]').value,
            rest: form.querySelector('input[placeholder="Recupero (sec)"]').value
        };

        if (editingIndex !== null) {
            exercises[editingIndex] = exerciseData;
        } else {
            exercises.push(exerciseData);
        }

        saveExercises();
        renderExercises();
        
        modal.style.display = 'none';
        form.reset();
        editingIndex = null;
    });

    function createExerciseElement(exercise, index) {
        const div = document.createElement('div');
        div.className = 'exercise-section';
        div.innerHTML = `
            <div class="exercise-actions">
                <button class="edit-btn" data-index="${index}">✏️</button>
                <button class="delete-btn" data-index="${index}">🗑️</button>
            </div>
            <h1 class="exercise-title">${exercise.name}</h1>
            
            <div class="stats">
                <div class="stat-item">
                    <div class="stat-circle">↻</div>
                    <div class="stat-text">
                        <div class="stat-value">${exercise.series}</div>
                        <div class="stat-label">Serie</div>
                    </div>
                </div>
                <div class="stat-item">
                    <div class="stat-circle">🏋️</div>
                    <div class="stat-text">
                        <div class="stat-value">${exercise.reps}</div>
                        <div class="stat-label">Ripetizioni</div>
                    </div>
                </div>
                <div class="stat-item">
                    <div class="stat-circle">⌛</div>
                    <div class="stat-text">
                        <div class="stat-value">${exercise.rest}<span>sec</span></div>
                        <div class="stat-label">Rec.</div>
                    </div>
                </div>
            </div>

            <button class="history-button">Storico pesi 📈</button>

            <div class="series-section">
                <h2>Serie</h2>
                <div class="series-header">
                    <span>Peso (kg)</span>
                    <span>Ripetizioni</span>
                </div>
                <div class="series-rows">
                    ${Array(parseInt(exercise.series)).fill().map((_, i) => `
                        <div class="series-row">
                            <span class="series-number">${i + 1}</span>
                            <input type="number" placeholder="0.0">
                            <input type="number" placeholder="0">
                        </div>
                    `).join('')}
                </div>
            </div>

            <button class="recovery-button" onclick="startTimer(${exercise.rest})">Recupero: ${exercise.rest}sec ▶</button>
        `;

        // Aggiungi event listeners per edit e delete
        div.querySelector('.edit-btn').addEventListener('click', () => {
            editExercise(index);
        });

        div.querySelector('.delete-btn').addEventListener('click', () => {
            deleteExercise(index);
        });

        return div;
    }

    function editExercise(index) {
        editingIndex = index;
        const exercise = exercises[index];
        
        const inputs = form.querySelectorAll('input');
        inputs[0].value = exercise.name;
        inputs[1].value = exercise.series;
        inputs[2].value = exercise.reps;
        inputs[3].value = exercise.rest;
        
        modal.style.display = 'block';
    }

    function deleteExercise(index) {
        if (confirm('Sei sicuro di voler eliminare questo esercizio?')) {
            exercises.splice(index, 1);
            saveExercises();
            renderExercises();
        }
    }

    function loadExercises() {
        const saved = localStorage.getItem('workoutExercises');
        exercises = saved ? JSON.parse(saved) : [];
        renderExercises();
    }

    function saveExercises() {
        localStorage.setItem('workoutExercises', JSON.stringify(exercises));
    }

    function renderExercises() {
        mainContainer.innerHTML = '';

        if (exercises.length === 0) {
            mainContainer.innerHTML = `
                <div id="empty-state" class="empty-state">
                    <p>Clicca sul pulsante + per aggiungere il tuo allenamento</p>
                </div>`;
        } else {
            exercises.forEach((exercise, index) => {
                mainContainer.appendChild(createExerciseElement(exercise, index));
            });
        }
    }

    let timerInterval;

    function updateTimerSize() {
        const timerCircle = document.querySelector('.timer-circle');
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        if (window.matchMedia("(orientation: landscape)").matches) {
            const size = Math.min(windowHeight * 0.4, 140);
            timerCircle.style.width = `${size}px`;
            timerCircle.style.height = `${size}px`;
        } else {
            const size = Math.min(windowWidth * 0.6, 200);
            timerCircle.style.width = `${size}px`;
            timerCircle.style.height = `${size}px`;
        }
    }

    window.addEventListener('resize', updateTimerSize);
    window.addEventListener('orientationchange', updateTimerSize);

    window.startTimer = function(seconds) {
        const timerContainer = document.querySelector('.timer-container');
        const timerDisplay = document.querySelector('.timer-display');
        const timerProgress = document.querySelector('.timer-progress');
        const endButton = document.querySelector('.end-timer-button');
        
        // Reset precedenti timer
        clearInterval(timerInterval);
        
        // Mostra il timer
        timerContainer.style.display = 'flex';
        
        // Imposta il cerchio SVG
        const circle = document.querySelector('.timer-progress');
        const radius = 45; // Deve corrispondere al valore r nel SVG
        const circumference = radius * 2 * Math.PI;
        
        // Imposta le proprietà iniziali del cerchio
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        circle.style.strokeDashoffset = '0';
        
        let timeLeft = seconds;
        
        function updateTimer() {
            timerDisplay.textContent = timeLeft;
            const progress = timeLeft / seconds;
            const offset = circumference - (progress * circumference);
            circle.style.strokeDashoffset = offset;
            
            if (timeLeft === 0) {
                clearInterval(timerInterval);
                playSound();
                setTimeout(() => {
                    timerContainer.style.display = 'none';
                }, 1000);
            }
            timeLeft--;
        }
        
        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
        
        // Gestione click sul pulsante termina
        endButton.addEventListener('click', () => {
            clearInterval(timerInterval);
            timerContainer.style.display = 'none';
        });

        updateTimerSize();
    }

    function playSound() {
        const audio = new Audio('data:audio/wav;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7xA4Tvh9Rz/y8QADBwMWgQAZG/ILNAARQ4GLTcDeIIIhxGOBAuD7hOfBB3/94gcJ3w+o5/5eIAIAAAVwWgQAVQ2ORaIQwEMAJiDg95G4nQL7mQVWI6GwRcfsZAcsKkJvxgxEjzFUgfHoSQ9Qq7KNwqHw...');
        audio.play();
    }
}); 