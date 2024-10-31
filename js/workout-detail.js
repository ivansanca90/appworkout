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
            const card = document.createElement('div');
            card.className = 'exercise-card';
            
            // Creiamo la tabella delle serie
            let seriesRows = '';
            for (let i = 1; i <= esercizio.serie; i++) {
                seriesRows += `
                    <tr>
                        <td>
                            <div class="series-number">${i}</div>
                        </td>
                        <td>
                            <input type="number" 
                                   class="weight-input" 
                                   placeholder="KG"
                                   min="0"
                                   step="0.5">
                        </td>
                        <td>
                            <input type="number" 
                                   class="reps-input" 
                                   placeholder="Reps"
                                   min="1">
                        </td>
                    </tr>
                `;
            }

            card.innerHTML = `
                <div class="exercise-header">
                    <h3 class="exercise-title">${esercizio.nome}</h3>
                    <div class="exercise-actions">
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
                    <div class="info-box rest-label" onclick="workoutDetailManager.startRecoveryTimer(${esercizio.recupero})">
                        <div class="info-icon">
                            <span class="material-icons">timer</span>
                        </div>
                        <span class="info-text">${esercizio.recupero}s Recupero</span>
                    </div>
                    <div class="info-box weight-history-label">
                        <div class="info-icon circle">
                            <span class="material-icons">bar_chart</span>
                        </div>
                        <span class="info-text">Storico pesi</span>
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
            recupero: parseInt(form.elements.exerciseRest.value),
            pesi: [], // Array per salvare i pesi
            ripetizioni: [] // Array per salvare le ripetizioni
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
                esercizi: this.workout.esercizi.map(esercizio => {
                    // Raccogli i pesi e le ripetizioni dai campi input
                    const pesi = [];
                    const ripetizioni = [];
                    
                    // Seleziona tutte le righe della tabella per questo esercizio
                    const rows = document.querySelectorAll(`.series-table tr:not(:first-child)`);
                    
                    rows.forEach(row => {
                        const weightInput = row.querySelector('.weight-input');
                        const repsInput = row.querySelector('.reps-input');
                        
                        pesi.push(weightInput ? weightInput.value || '-' : '-');
                        ripetizioni.push(repsInput ? repsInput.value || '-' : '-');
                    });

                    return {
                        id: esercizio.id,
                        nome: esercizio.nome,
                        serie: esercizio.serie,
                        recupero: esercizio.recupero,
                        pesi: pesi,
                        ripetizioni: ripetizioni
                    };
                })
            };

            // Carica gli allenamenti completati esistenti
            let completedWorkouts = [];
            try {
                const saved = localStorage.getItem('completedWorkouts');
                completedWorkouts = saved ? JSON.parse(saved) : [];
            } catch (e) {
                console.error('Errore nel caricamento degli allenamenti completati:', e);
                completedWorkouts = [];
            }

            // Verifica che completedWorkouts sia un array
            if (!Array.isArray(completedWorkouts)) {
                completedWorkouts = [];
            }
            
            // Aggiungi il nuovo allenamento completato
            completedWorkouts.push(completedWorkout);
            
            // Salva nel localStorage
            try {
                localStorage.setItem('completedWorkouts', JSON.stringify(completedWorkouts));
                console.log('Allenamento salvato:', completedWorkout); // Debug
                console.log('Tutti gli allenamenti:', completedWorkouts); // Debug
            } catch (e) {
                console.error('Errore nel salvataggio dell\'allenamento:', e);
                this.showNotification('Errore nel salvataggio dell\'allenamento', 'error');
                return;
            }

            this.showNotification('Allenamento completato con successo!', 'success');

            // Reindirizza alla pagina degli allenamenti completati
            setTimeout(() => {
                window.location.href = 'completed-workouts.html';
            }, 1500);
        }
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