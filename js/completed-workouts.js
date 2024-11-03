class CompletedWorkoutsManager {
    constructor() {
        this.completedWorkouts = this.loadCompletedWorkouts();
        this.renderCompletedWorkouts();
        
        // Aggiungi l'event listener per il pulsante di esportazione
        const exportBtn = document.getElementById('exportCSV');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportToExcel());
        }
    }

    setupEventListeners() {
        const exportBtn = document.getElementById('exportCSV');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportToCSV());
        }
    }

    exportToCSV() {
        // Crea l'header del CSV
        let csvContent = 'Data,Nome Allenamento,Esercizio,Serie,Peso (KG),Ripetizioni,Note\n';

        // Aggiungi i dati di ogni allenamento
        this.completedWorkouts.forEach(workout => {
            const date = new Date(workout.completedAt).toLocaleDateString('it-IT');
            
            workout.esercizi.forEach(esercizio => {
                // Per ogni set dell'esercizio
                if (esercizio.sets && esercizio.sets.length > 0) {
                    esercizio.sets.forEach((set, index) => {
                        const row = [
                            date,
                            workout.nome,
                            esercizio.nome,
                            `Serie ${index + 1}`,
                            set.weight || '',
                            set.reps || '',
                            (esercizio.note || '').replace(/,/g, ';') // Sostituisce le virgole con punto e virgola nelle note
                        ];
                        csvContent += row.join(',') + '\n';
                    });
                } else {
                    // Se non ci sono sets, crea comunque una riga con i dati dell'esercizio
                    const row = [
                        date,
                        workout.nome,
                        esercizio.nome,
                        '',
                        '',
                        '',
                        (esercizio.note || '').replace(/,/g, ';')
                    ];
                    csvContent += row.join(',') + '\n';
                }
            });
        });

        // Crea il blob e scarica il file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', 'storico_allenamenti.csv');
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

        console.log('Allenamenti completati:', this.completedWorkouts);

        const sortedWorkouts = [...this.completedWorkouts].sort((a, b) => {
            return new Date(b.completedAt) - new Date(a.completedAt);
        });

        sortedWorkouts.forEach((workout, index) => {
            console.log('Rendering workout:', workout);
            
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
                    ${workout.esercizi.map(esercizio => {
                        console.log('Rendering esercizio:', esercizio);
                        return `
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
                                ${esercizio.note ? `
                                    <div class="exercise-notes">
                                        <div class="notes-header">
                                            <span class="material-icons">notes</span>
                                            <span>Note:</span>
                                        </div>
                                        <p class="notes-content">${esercizio.note}</p>
                                    </div>
                                ` : ''}
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
                        `;
                    }).join('')}
                </div>
            `;

            container.appendChild(card);
        });
    }

    editWorkout(index) {
        event.stopPropagation(); // Previene l'espansione della card
        const workout = this.completedWorkouts[index];
        
        const form = document.createElement('div');
        form.className = 'modal-overlay';
        
        // Converti la data in formato YYYY-MM-DD per l'input type="date"
        const workoutDate = new Date(workout.completedAt);
        const formattedDate = workoutDate.toISOString().split('T')[0];
        
        form.innerHTML = `
            <div class="modal-content">
                <div class="form-group">
                    <label for="editWorkoutName">Nome Allenamento</label>
                    <input type="text" id="editWorkoutName" value="${workout.nome}" required>
                </div>
                <div class="form-group">
                    <label for="editWorkoutDate">Data</label>
                    <input type="date" 
                           id="editWorkoutDate" 
                           value="${formattedDate}"
                           required>
                </div>
                <div class="form-group">
                    <label for="editWorkoutNotes">Note</label>
                    <textarea id="editWorkoutNotes">${workout.note || ''}</textarea>
                </div>
                
                <h3>Esercizi</h3>
                ${workout.esercizi.map((esercizio, exIndex) => `
                    <div class="exercise-edit-item">
                        <div class="form-group">
                            <label for="editExerciseName_${exIndex}">Nome Esercizio</label>
                            <input type="text" 
                                   id="editExerciseName_${exIndex}" 
                                   value="${esercizio.nome}"
                                   required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="editExerciseSets_${exIndex}">Serie</label>
                                <input type="number" 
                                       id="editExerciseSets_${exIndex}" 
                                       value="${esercizio.serie}"
                                       min="1"
                                       required>
                            </div>
                            <div class="form-group">
                                <label for="editExerciseRest_${exIndex}">Recupero (sec)</label>
                                <input type="number" 
                                       id="editExerciseRest_${exIndex}" 
                                       value="${esercizio.recupero}"
                                       min="0"
                                       step="15"
                                       required>
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
                                ${Array(esercizio.serie).fill().map((_, setIndex) => `
                                    <tr>
                                        <td>${setIndex + 1}</td>
                                        <td>
                                            <input type="number" 
                                                   id="editWeight_${exIndex}_${setIndex}" 
                                                   value="${esercizio.sets[setIndex]?.weight || ''}"
                                                   min="0"
                                                   step="0.5">
                                        </td>
                                        <td>
                                            <input type="number" 
                                                   id="editReps_${exIndex}_${setIndex}" 
                                                   value="${esercizio.sets[setIndex]?.reps || ''}"
                                                   min="0">
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `).join('')}
                
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Annulla</button>
                    <button type="submit" class="btn-primary">Salva</button>
                </div>
            </div>
        `;

        form.onsubmit = (e) => {
            e.preventDefault();
            
            // Aggiorna i dati dell'allenamento
            workout.nome = document.getElementById('editWorkoutName').value;
            workout.note = document.getElementById('editWorkoutNotes').value;
            // Aggiorna la data
            workout.completedAt = new Date(document.getElementById('editWorkoutDate').value).toISOString();
            
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

    exportToExcel() {
        // Organizziamo prima i dati per tipo di allenamento e esercizio
        const workoutTypes = {};

        this.completedWorkouts.forEach(workout => {
            if (!workoutTypes[workout.nome]) {
                workoutTypes[workout.nome] = {};
            }

            workout.esercizi.forEach(esercizio => {
                if (!workoutTypes[workout.nome][esercizio.nome]) {
                    workoutTypes[workout.nome][esercizio.nome] = [];
                }

                workoutTypes[workout.nome][esercizio.nome].push({
                    data: new Date(workout.completedAt).toLocaleDateString('it-IT'),
                    serie: esercizio.serie,
                    recupero: esercizio.recupero,
                    sets: esercizio.sets || [],
                    note: esercizio.note || ''
                });
            });
        });

        // Creiamo il workbook
        const wb = XLSX.utils.book_new();

        // Per ogni tipo di allenamento, creiamo un foglio
        Object.entries(workoutTypes).forEach(([workoutName, exercises]) => {
            const worksheetData = [];

            // Per ogni esercizio in questo tipo di allenamento
            Object.entries(exercises).forEach(([exerciseName, sessions]) => {
                // Aggiungiamo il nome dell'esercizio come intestazione
                worksheetData.push([exerciseName]);
                worksheetData.push(['']); // Riga vuota per spaziatura

                // Creiamo l'header della tabella
                const headerRow = ['Serie'];
                sessions.forEach(session => {
                    headerRow.push(`Peso (${session.data})`, `Rep (${session.data})`);
                });
                worksheetData.push(headerRow);

                // Aggiungiamo i dati delle serie
                for (let i = 0; i < Math.max(...sessions.map(s => s.serie)); i++) {
                    const row = [(i + 1).toString()];
                    sessions.forEach(session => {
                        const set = session.sets[i] || {};
                        row.push(set.weight || '-', set.reps || '-');
                    });
                    worksheetData.push(row);
                }

                // Aggiungiamo le note se presenti
                sessions.forEach((session, index) => {
                    if (session.note) {
                        worksheetData.push([`Note (${session.data}):`, session.note]);
                    }
                });

                // Aggiungiamo righe vuote tra gli esercizi
                worksheetData.push([''], ['']);
            });

            // Creiamo il foglio per questo tipo di allenamento
            const ws = XLSX.utils.aoa_to_sheet(worksheetData);

            // Applichiamo lo stile
            const range = XLSX.utils.decode_range(ws['!ref']);
            for (let R = range.s.r; R <= range.e.r; R++) {
                for (let C = range.s.c; C <= range.e.c; C++) {
                    const cell_address = {c: C, r: R};
                    const cell_ref = XLSX.utils.encode_cell(cell_address);
                    if (!ws[cell_ref]) continue;

                    // Stile per le intestazioni degli esercizi
                    if (R === 0 || (worksheetData[R] && worksheetData[R].length === 1)) {
                        ws[cell_ref].s = {
                            font: { bold: true, size: 14 },
                            fill: { fgColor: { rgb: "E0E0E0" } }
                        };
                    }
                    // Stile per l'header della tabella
                    else if (worksheetData[R] && worksheetData[R][0] === 'Serie') {
                        ws[cell_ref].s = {
                            font: { bold: true },
                            fill: { fgColor: { rgb: "F5F5F5" } }
                        };
                    }
                }
            }

            // Impostiamo la larghezza delle colonne
            ws['!cols'] = Array(range.e.c + 1).fill({ wch: 15 });

            XLSX.utils.book_append_sheet(wb, ws, workoutName);
        });

        // Salviamo il file
        XLSX.writeFile(wb, 'Storico_Allenamenti.xlsx');
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