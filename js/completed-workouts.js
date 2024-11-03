class CompletedWorkoutsManager {
    constructor() {
        this.completedWorkouts = this.loadCompletedWorkouts();
        this.renderCompletedWorkouts();
    }

    loadCompletedWorkouts() {
        try {
            const saved = localStorage.getItem('completedWorkouts');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Errore nel caricamento degli allenamenti:', e);
            return [];
        }
    }

    renderCompletedWorkouts() {
        const container = document.getElementById('completedWorkouts');
        container.innerHTML = '';

        if (this.completedWorkouts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons">fitness_center</span>
                    <p>Nessun allenamento completato</p>
                </div>
            `;
            return;
        }

        this.completedWorkouts.forEach((workout, index) => {
            const card = document.createElement('div');
            card.className = 'completed-workout-card';
            card.id = `workout-${index}`;
            
            const date = new Date(workout.completedAt);
            const formattedDate = date.toLocaleDateString('it-IT', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            card.innerHTML = `
                <div class="workout-header">
                    <div class="workout-info" onclick="toggleWorkout(${index})">
                        <h3 class="workout-title">${workout.nome}</h3>
                        <div class="workout-date">
                            <span class="material-icons">event</span>
                            ${formattedDate}
                        </div>
                    </div>
                    <div class="workout-actions">
                        <button class="icon-button edit" onclick="completedWorkoutsManager.editWorkout(${index})">
                            <span class="material-icons">edit</span>
                        </button>
                        <button class="icon-button delete" onclick="completedWorkoutsManager.deleteWorkout(${index})">
                            <span class="material-icons">delete_outline</span>
                        </button>
                        <span class="material-icons expand-icon" onclick="toggleWorkout(${index})">expand_more</span>
                    </div>
                </div>
                <div id="workout-details-${index}" class="workout-details">
                    <div class="exercise-list">
                        ${workout.esercizi.map(esercizio => `
                            <div class="exercise-item">
                                <div class="exercise-name">${esercizio.nome}</div>
                                <div class="exercise-details">
                                    <span class="detail-item">
                                        <span class="material-icons">repeat</span>
                                        ${esercizio.serie} Serie
                                    </span>
                                    <span class="detail-item">
                                        <span class="material-icons">timer</span>
                                        ${esercizio.recupero}s Recupero
                                    </span>
                                </div>
                                <table class="sets-table">
                                    <thead>
                                        <tr>
                                            <th>Serie</th>
                                            <th>Peso (KG)</th>
                                            <th>Ripetizioni</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${Array.from({length: esercizio.serie}, (_, i) => `
                                            <tr>
                                                <td>${i + 1}</td>
                                                <td>${esercizio.sets?.[i]?.weight || '-'}</td>
                                                <td>${esercizio.sets?.[i]?.reps || '-'}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            container.appendChild(card);
        });
    }

    editWorkout(index) {
        event.stopPropagation(); // Previene l'espansione della card
        const workout = this.completedWorkouts[index];
        
        // Creiamo un form di modifica
        const form = document.createElement('form');
        form.className = 'edit-workout-form';
        
        form.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <h2>Modifica Allenamento</h2>
                    <div class="form-group">
                        <label>Nome Allenamento</label>
                        <input type="text" value="${workout.nome}" id="editWorkoutName">
                    </div>
                    <div class="exercises-list">
                        ${workout.esercizi.map((esercizio, exIndex) => `
                            <div class="exercise-edit-item">
                                <div class="form-group">
                                    <label>Nome Esercizio</label>
                                    <input type="text" value="${esercizio.nome}" 
                                           id="editExerciseName_${exIndex}">
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>Serie</label>
                                        <input type="number" value="${esercizio.serie}" 
                                               id="editExerciseSets_${exIndex}">
                                    </div>
                                    <div class="form-group">
                                        <label>Recupero (s)</label>
                                        <input type="number" value="${esercizio.recupero}" 
                                               id="editExerciseRest_${exIndex}">
                                    </div>
                                </div>
                                <table class="sets-table">
                                    <thead>
                                        <tr>
                                            <th>Serie</th>
                                            <th>Peso (KG)</th>
                                            <th>Ripetizioni</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${Array.from({length: esercizio.serie}, (_, i) => `
                                            <tr>
                                                <td>${i + 1}</td>
                                                <td>
                                                    <input type="number" value="${esercizio.sets?.[i]?.weight || ''}" 
                                                           id="editWeight_${exIndex}_${i}">
                                                </td>
                                                <td>
                                                    <input type="number" value="${esercizio.sets?.[i]?.reps || ''}" 
                                                           id="editReps_${exIndex}_${i}">
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `).join('')}
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                            Annulla
                        </button>
                        <button type="submit" class="btn-primary">
                            Salva Modifiche
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        form.onsubmit = (e) => {
            e.preventDefault();
            
            // Aggiorna i dati dell'allenamento
            workout.nome = document.getElementById('editWorkoutName').value;
            
            workout.esercizi.forEach((esercizio, exIndex) => {
                esercizio.nome = document.getElementById(`editExerciseName_${exIndex}`).value;
                esercizio.serie = parseInt(document.getElementById(`editExerciseSets_${exIndex}`).value);
                esercizio.recupero = parseInt(document.getElementById(`editExerciseRest_${exIndex}`).value);
                
                // Aggiorna i sets
                esercizio.sets = [];
                for (let i = 0; i < esercizio.serie; i++) {
                    esercizio.sets[i] = {
                        weight: document.getElementById(`editWeight_${exIndex}_${i}`).value,
                        reps: document.getElementById(`editReps_${exIndex}_${i}`).value
                    };
                }
            });
            
            // Salva nel localStorage
            localStorage.setItem('completedWorkouts', JSON.stringify(this.completedWorkouts));
            
            // Rimuovi il form e aggiorna la visualizzazione
            form.remove();
            this.renderCompletedWorkouts();
        };
        
        document.body.appendChild(form);
    }

    deleteWorkout(index) {
        event.stopPropagation(); // Previene l'espansione della card
        
        if (confirm('Sei sicuro di voler eliminare questo allenamento?')) {
            // Rimuovi l'allenamento dall'array
            this.completedWorkouts.splice(index, 1);
            
            // Aggiorna il localStorage
            localStorage.setItem('completedWorkouts', JSON.stringify(this.completedWorkouts));
            
            // Aggiorna la visualizzazione
            this.renderCompletedWorkouts();
        }
    }
}

// Funzione globale per il toggle
window.toggleWorkout = function(index) {
    const details = document.getElementById(`workout-details-${index}`);
    const card = document.getElementById(`workout-${index}`);
    const expandIcon = card.querySelector('.expand-icon');
    
    details.classList.toggle('expanded');
    card.classList.toggle('expanded-card');
    expandIcon.style.transform = details.classList.contains('expanded') ? 'rotate(180deg)' : 'rotate(0deg)';
};

// Inizializzazione
const completedWorkoutsManager = new CompletedWorkoutsManager(); 