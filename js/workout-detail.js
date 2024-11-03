class WorkoutDetailManager {
    constructor() {
        this.workoutId = new URLSearchParams(window.location.search).get('id');
        this.workout = null;
        this.recoveryTimer = new RecoveryTimer();
        this.init();
    }

    init() {
        this.loadWorkout();
        this.setupEventListeners();
    }

    loadWorkout() {
        const workouts = JSON.parse(localStorage.getItem('allenamenti') || '[]');
        this.workout = workouts.find(w => w.id === parseInt(this.workoutId));
        
        if (!this.workout) {
            window.location.href = 'index.html';
            return;
        }

        // Ripristina i dati della sessione se esistono
        if (this.workout.esercizi) {
            this.workout.esercizi.forEach(esercizio => {
                if (!esercizio.sessionData) {
                    esercizio.sessionData = Array(esercizio.serie).fill().map(() => ({
                        weight: '',
                        reps: ''
                    }));
                }
            });
        }

        document.getElementById('workoutTitle').textContent = this.workout.nome;
        this.renderExercises();
    }

    setupEventListeners() {
        const addButton = document.querySelector('.add-exercise-btn');
        if (addButton) {
            addButton.addEventListener('click', () => this.openModal());
        }

        const form = document.getElementById('exerciseForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveExercise();
            });
        }

        const modal = document.getElementById('exerciseModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });

        const closeButtons = document.querySelectorAll('[onclick="closeModal()"]');
        closeButtons.forEach(button => {
            button.onclick = (e) => {
                e.preventDefault();
                this.closeModal();
            };
        });
    }

    renderExercises() {
        const container = document.getElementById('exerciseList');
        container.innerHTML = '';

        if (!this.workout.esercizi || this.workout.esercizi.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Nessun esercizio presente. Aggiungi il tuo primo esercizio!</p>
                </div>
            `;
            return;
        }

        this.workout.esercizi.forEach(esercizio => {
            // Assicuriamoci che esista l'array temporaneo per i dati della sessione
            if (!esercizio.sessionData) {
                esercizio.sessionData = Array(esercizio.serie).fill().map(() => ({
                    weight: '',
                    reps: ''
                }));
            }

            // Creiamo la tabella delle serie con i dati salvati
            let seriesRows = '';
            for (let i = 0; i < esercizio.serie; i++) {
                seriesRows += `
                    <tr>
                        <td>
                            <div class="series-number">${i + 1}</div>
                        </td>
                        <td>
                            <input type="number" 
                                   class="weight-input" 
                                   placeholder="KG"
                                   min="0"
                                   step="0.5"
                                   value="${esercizio.sessionData[i].weight}"
                                   onchange="workoutDetailManager.saveSetData(${esercizio.id}, ${i}, 'weight', this.value)">
                        </td>
                        <td>
                            <input type="number" 
                                   class="reps-input" 
                                   placeholder="Reps"
                                   min="1"
                                   value="${esercizio.sessionData[i].reps}"
                                   onchange="workoutDetailManager.saveSetData(${esercizio.id}, ${i}, 'reps', this.value)">
                        </td>
                    </tr>
                `;
            }

            const card = document.createElement('div');
            card.className = 'exercise-card';
            
            card.innerHTML = `
                <div class="exercise-header">
                    <h3 class="exercise-title">${esercizio.nome}</h3>
                    <div class="exercise-actions">
                        <button class="icon-button weight-history" onclick="workoutDetailManager.showWeightHistory(${esercizio.id})">
                            <span class="material-icons">bar_chart</span>
                        </button>
                        <button class="icon-button edit" onclick="workoutDetailManager.editExercise(${esercizio.id})">
                            <span class="material-icons">edit</span>
                        </button>
                        <button class="icon-button delete" onclick="workoutDetailManager.deleteExercise(${esercizio.id})">
                            <span class="material-icons">delete_outline</span>
                        </button>
                    </div>
                </div>
                <div class="series-info">
                    <div class="info-box series-label">
                        <div class="info-icon">
                            <span class="material-icons">repeat</span>
                        </div>
                        <span class="info-text">${esercizio.serie} Serie</span>
                    </div>
                    <div class="info-box reps-label">
                        <div class="info-icon">
                            <span class="material-icons">fitness_center</span>
                        </div>
                        <span class="info-text">${esercizio.ripetizioni} Reps</span>
                    </div>
                    <div class="info-box rest-label" onclick="workoutDetailManager.startRecoveryTimer(${esercizio.recupero})">
                        <div class="info-icon">
                            <span class="material-icons">timer</span>
                        </div>
                        <span class="info-text">${esercizio.recupero}s Recupero</span>
                    </div>
                </div>
                <table class="series-table">
                    <thead>
                        <tr>
                            <th>Serie</th>
                            <th>Peso</th>
                            <th>Reps</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${seriesRows}
                    </tbody>
                </table>
                <div class="notes-input-container">
                    <div class="notes-header">
                        <span class="material-icons">notes</span>
                        <span>Note</span>
                    </div>
                    <textarea 
                        class="notes-textarea" 
                        placeholder="Aggiungi note per questo esercizio..."
                        onchange="workoutDetailManager.saveNotes(${esercizio.id}, this.value)"
                    >${esercizio.sessionNotes || ''}</textarea>
                </div>
            `;
            container.appendChild(card);
        });
    }

    openModal(exercise = null) {
        const modal = document.getElementById('exerciseModal');
        const form = document.getElementById('exerciseForm');
        
        if (exercise) {
            form.elements.exerciseName.value = exercise.nome;
            form.elements.exerciseSets.value = exercise.serie;
            form.elements.exerciseReps.value = exercise.ripetizioni || 12;
            form.elements.exerciseRest.value = exercise.recupero;
            form.dataset.exerciseId = exercise.id;
        } else {
            form.reset();
            delete form.dataset.exerciseId;
        }
        
        modal.style.display = 'block';
        toggleBodyScroll(true);
    }

    closeModal() {
        const modal = document.getElementById('exerciseModal');
        const form = document.getElementById('exerciseForm');
        
        modal.classList.add('closing');
        
        if (form) {
            form.reset();
        }

        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('closing');
            toggleBodyScroll(false);
        }, 300);
    }

    saveExercise() {
        const form = document.getElementById('exerciseForm');
        const exerciseData = {
            id: form.dataset.exerciseId ? parseInt(form.dataset.exerciseId) : Date.now(),
            nome: form.elements.exerciseName.value,
            serie: parseInt(form.elements.exerciseSets.value),
            ripetizioni: parseInt(form.elements.exerciseReps.value),
            recupero: parseInt(form.elements.exerciseRest.value),
            pesi: [],
        };

        if (!this.workout.esercizi) {
            this.workout.esercizi = [];
        }

        if (form.dataset.exerciseId) {
            const index = this.workout.esercizi.findIndex(e => e.id === parseInt(form.dataset.exerciseId));
            if (index !== -1) {
                this.workout.esercizi[index] = exerciseData;
            }
        } else {
            this.workout.esercizi.push(exerciseData);
        }

        this.saveToLocalStorage();
        this.renderExercises();
        this.closeModal();
        this.showNotification('Esercizio salvato con successo!', 'success');
    }

    deleteExercise(id) {
        if (confirm('Sei sicuro di voler eliminare questo esercizio?')) {
            this.workout.esercizi = this.workout.esercizi.filter(e => e.id !== id);
            this.saveToLocalStorage();
            this.renderExercises();
            this.showNotification('Esercizio eliminato con successo!', 'warning');
        }
    }

    saveToLocalStorage() {
        const workouts = JSON.parse(localStorage.getItem('allenamenti') || '[]');
        const index = workouts.findIndex(w => w.id === this.workout.id);
        if (index !== -1) {
            workouts[index] = this.workout;
            localStorage.setItem('allenamenti', JSON.stringify(workouts));
        }
    }

    showNotification(message, type = 'success') {
        // Se non esiste già un container per le notifiche, crealo
        let notificationContainer = document.querySelector('.notification-container');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.className = 'notification-container';
            document.body.appendChild(notificationContainer);
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span class="material-icons">${type === 'success' ? 'check_circle' : 'error'}</span>
            <span>${message}</span>
        `;

        notificationContainer.appendChild(notification);

        // Rimuovi la notifica dopo 3 secondi
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    startRecoveryTimer(seconds) {
        this.recoveryTimer.showTimer(seconds);
    }

    completeWorkout() {
        if (confirm('Sei sicuro di voler completare questo allenamento?')) {
            // Raccogli tutti i dati dell'allenamento
            const completedWorkout = {
                ...this.workout,
                completedAt: new Date().toISOString(),
                esercizi: this.workout.esercizi.map(esercizio => ({
                    ...esercizio,
                    sets: esercizio.sessionData || [], // Assicuriamoci che i sets esistano
                    notes: esercizio.sessionNotes || '', // Aggiungi le note
                    sessionData: undefined, // Rimuoviamo i dati temporanei
                    sessionNotes: undefined
                }))
            };

            // Salva l'allenamento completato
            let completedWorkouts = JSON.parse(localStorage.getItem('completedWorkouts') || '[]');
            completedWorkouts.push(completedWorkout);
            localStorage.setItem('completedWorkouts', JSON.stringify(completedWorkouts));

            // Debug - verifica i dati salvati
            console.log('Allenamento completato:', completedWorkout);

            // Resetta i dati della sessione nel workout corrente
            this.workout.esercizi.forEach(esercizio => {
                delete esercizio.sessionData;
                delete esercizio.sessionNotes;
            });
            this.saveToLocalStorage();

            this.showNotification('Allenamento completato con successo!', 'success');
            setTimeout(() => {
                window.location.href = 'completed-workouts.html';
            }, 1500);
        }
    }

    editExercise(id) {
        // Trova l'esercizio da modificare
        const exercise = this.workout.esercizi.find(e => e.id === id);
        if (exercise) {
            // Apre il modal con i dati dell'esercizio
            this.openModal(exercise);
        }
    }

    saveSetData(exerciseId, setIndex, field, value) {
        const exercise = this.workout.esercizi.find(e => e.id === exerciseId);
        if (exercise) {
            if (!exercise.sessionData) {
                exercise.sessionData = Array(exercise.serie).fill().map(() => ({
                    weight: '',
                    reps: ''
                }));
            }
            exercise.sessionData[setIndex][field] = value;
            this.saveToLocalStorage();
        }
    }

    saveNotes(exerciseId, notes) {
        const exercise = this.workout.esercizi.find(e => e.id === exerciseId);
        if (exercise) {
            exercise.sessionNotes = notes;
            this.saveToLocalStorage();
        }
    }

    showWeightHistory(exerciseId) {
        const exercise = this.workout.esercizi.find(e => e.id === exerciseId);
        if (!exercise) return;

        // Recupera tutti gli allenamenti completati
        const completedWorkouts = JSON.parse(localStorage.getItem('completedWorkouts') || '[]');
        
        // Trova tutti i dati storici per questo esercizio
        const exerciseHistory = completedWorkouts
            .map(workout => {
                const matchingExercise = workout.esercizi.find(e => e.nome === exercise.nome);
                if (matchingExercise && matchingExercise.sets) {
                    return {
                        date: new Date(workout.completedAt),
                        sets: matchingExercise.sets,
                        notes: matchingExercise.notes
                    };
                }
                return null;
            })
            .filter(Boolean) // Rimuove i null
            .sort((a, b) => b.date - a.date); // Ordina per data decrescente

        // Crea il modal per lo storico
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        const historyContent = `
            <div class="modal-content weight-history-modal">
                <div class="modal-header">
                    <h2>Storico ${exercise.nome}</h2>
                    <button class="close-button" onclick="this.closest('.modal').remove()">
                        <span class="material-icons">close</span>
                    </button>
                </div>
                <div class="history-content">
                    ${exerciseHistory.length === 0 ? `
                        <div class="empty-state">
                            <span class="material-icons">history</span>
                            <p>Nessuno storico disponibile</p>
                        </div>
                    ` : exerciseHistory.map(history => `
                        <div class="history-entry">
                            <div class="history-date">
                                ${history.date.toLocaleDateString('it-IT', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </div>
                            <table class="history-table">
                                <thead>
                                    <tr>
                                        <th>Serie</th>
                                        <th>Peso (KG)</th>
                                        <th>Reps</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${history.sets.map((set, index) => `
                                        <tr>
                                            <td>${index + 1}</td>
                                            <td>${set.weight || '-'}</td>
                                            <td>${set.reps || '-'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                            ${history.notes ? `
                                <div class="history-notes">
                                    <div class="notes-header">
                                        <span class="material-icons">notes</span>
                                        <span>Note</span>
                                    </div>
                                    <p class="notes-content">${history.notes}</p>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        modal.innerHTML = historyContent;
        document.body.appendChild(modal);
        setTimeout(() => modal.style.display = 'block', 0);
    }
}

class RecoveryTimer {
    constructor() {
        this.createTimerOverlay();
        this.timeLeft = 0;
        this.timerId = null;
        this.overlay = document.querySelector('.timer-overlay');
        this.display = document.querySelector('.timer-display');
        this.progressCircle = document.querySelector('.progress-ring-circle');
        this.setupListeners();
    }

    createTimerOverlay() {
        if (!document.querySelector('.timer-overlay')) {
            const timerHTML = `
                <div class="timer-overlay">
                    <div class="timer-container">
                        <h3 class="timer-title">Tempo di Recupero</h3>
                        <div class="timer-progress">
                            <svg class="progress-ring" viewBox="0 0 100 100">
                                <circle class="progress-ring-circle-bg"
                                    cx="50" cy="50" r="46"/>
                                <circle class="progress-ring-circle"
                                    cx="50" cy="50" r="46"
                                    stroke-dasharray="289.027"
                                    stroke-dashoffset="0"/>
                            </svg>
                            <div class="timer-display">00:00</div>
                        </div>
                        <button class="timer-button cancel">Interrompi</button>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', timerHTML);
        }
    }

    setupListeners() {
        const cancelBtn = document.querySelector('.timer-button.cancel');
        cancelBtn.addEventListener('click', () => this.hideTimer());
    }

    showTimer(seconds) {
        this.initialTime = seconds;
        this.timeLeft = seconds;
        this.updateDisplay();
        this.overlay.classList.add('active');
        // Avvia automaticamente il timer
        setTimeout(() => this.startTimer(), 500);
    }

    hideTimer() {
        this.overlay.classList.remove('active');
        this.stopTimer();
    }

    startTimer() {
        if (this.timerId) return;
        
        const restLabel = document.querySelector('.info-box.rest-label');
        restLabel.classList.add('timer-active');
        
        const circumference = 289.027;
        const startTime = Date.now();
        const duration = this.timeLeft * 1000; // Converti in millisecondi
        
        const updateProgress = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.max(0, 1 - (elapsed / duration));
            const offset = circumference * (1 - progress);
            this.progressCircle.style.strokeDashoffset = offset;
            
            if (progress > 0) {
                requestAnimationFrame(updateProgress);
            }
        };
        
        requestAnimationFrame(updateProgress);
        
        this.timerId = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            
            if (this.timeLeft <= 0) {
                this.stopTimer();
                this.hideTimer();
                if (navigator.vibrate) {
                    navigator.vibrate([200, 100, 200]);
                }
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
            const restLabel = document.querySelector('.info-box.rest-label');
            if (restLabel) {
                restLabel.classList.remove('timer-active');
            }
        }
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

// Aggiungi anche gli stili per le notifiche
const style = document.createElement('style');
style.textContent = `
    .notification-container {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
    }

    .notification {
        background: white;
        padding: 12px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 8px;
        animation: slideIn 0.3s ease;
        pointer-events: auto;
    }

    .notification.success {
        border-left: 4px solid #34C759;
    }

    .notification.error {
        border-left: 4px solid #FF3B30;
    }

    .notification .material-icons {
        font-size: 20px;
    }

    .notification.success .material-icons {
        color: #34C759;
    }

    .notification.error .material-icons {
        color: #FF3B30;
    }

    .notification.fade-out {
        animation: slideOut 0.3s ease forwards;
    }

    @keyframes slideIn {
        from {
            transform: translateY(-20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateY(0);
            opacity: 1;
        }
        to {
            transform: translateY(-20px);
            opacity: 0;
        }
    }

    .info-box .info-icon.circle {
        background-color: #E8F5E9; /* sfondo verde chiaro */
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .info-box .info-icon.circle .material-icons {
        color: #4CAF50; /* icona verde */
        font-size: 20px;
    }

    .weight-history-label .info-icon.circle {
        background-color: #E8F9E8; /* sfondo verde chiaro */
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .weight-history-label .info-icon.circle .material-icons {
        color: #00E676; /* verde acceso per l'icona */
        font-size: 20px;
    }
`;
document.head.appendChild(style);

// Inizializzazione
const workoutDetailManager = new WorkoutDetailManager();

function toggleBodyScroll(disable) {
    document.body.style.overflow = disable ? 'hidden' : '';
}

function incrementValue(inputId) {
    const input = document.getElementById(inputId);
    const step = inputId === 'exerciseRest' ? 15 : 1;
    input.value = parseInt(input.value) + step;
}

function decrementValue(inputId) {
    const input = document.getElementById(inputId);
    const step = inputId === 'exerciseRest' ? 15 : 1;
    const newValue = parseInt(input.value) - step;
    if (newValue >= parseInt(input.min)) {
        input.value = newValue;
    }
}

function closeModal() {
    workoutDetailManager.closeModal();
}