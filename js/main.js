class WorkoutManager {
    constructor() {
        this.allenamenti = [];
        this.init();
    }

    init() {
        this.loadWorkouts();
        document.getElementById('aggiungiAllenamento').addEventListener('click', () => {
            this.createWorkout();
        });
        document.getElementById('storicoAllenamenti').addEventListener('click', function() {
            window.location.href = 'completed-workouts.html';
        });
    }

    // Funzione per modificare un allenamento
    editWorkout(id) {
        const allenamento = this.allenamenti.find(a => a.id === id);
        if (!allenamento) return;

        // Creiamo un prompt personalizzato per la modifica
        const nuovoNome = prompt('Modifica il nome dell\'allenamento:', allenamento.nome);
        
        if (nuovoNome !== null && nuovoNome.trim() !== '') {
            allenamento.nome = nuovoNome.trim();
            this.saveWorkouts();
            this.renderWorkouts();

            // Mostra notifica di successo
            this.showNotification('Allenamento modificato con successo!', 'success');
        }
    }

    // Funzione per duplicare un allenamento
    duplicateWorkout(id) {
        const allenamentoDaCopiare = this.allenamenti.find(a => a.id === id);
        if (!allenamentoDaCopiare) return;

        const nuovoAllenamento = {
            id: Date.now(), // Nuovo ID univoco
            nome: `${allenamentoDaCopiare.nome} (copia)`,
            esercizi: [...allenamentoDaCopiare.esercizi] // Copia gli esercizi se presenti
        };

        this.allenamenti.push(nuovoAllenamento);
        this.saveWorkouts();
        this.renderWorkouts();

        // Mostra notifica di successo
        this.showNotification('Allenamento duplicato con successo!', 'success');
    }

    // Funzione per eliminare un allenamento
    deleteWorkout(id) {
        if (confirm('Sei sicuro di voler eliminare questo allenamento?')) {
            this.allenamenti = this.allenamenti.filter(a => a.id !== id);
            this.saveWorkouts();
            this.renderWorkouts();

            // Mostra notifica di successo
            this.showNotification('Allenamento eliminato con successo!', 'warning');
        }
    }

    // Funzione per mostrare notifiche
    showNotification(message, type = 'success') {
        // Rimuovi eventuali notifiche esistenti
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notif => notif.remove());

        // Crea la nuova notifica
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Aggiungi icona in base al tipo
        const icon = type === 'success' ? '✓' : '!';
        notification.innerHTML = `
            <span style="margin-right: 8px; font-weight: bold;">${icon}</span>
            ${message}
        `;

        // Aggiungi al DOM
        document.body.appendChild(notification);

        // Rimuovi la notifica
        setTimeout(() => {
            notification.classList.add('hiding');
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 2500);
    }

    // Funzioni esistenti...
    loadWorkouts() {
        const savedWorkouts = localStorage.getItem('allenamenti');
        if (savedWorkouts) {
            this.allenamenti = JSON.parse(savedWorkouts);
            this.renderWorkouts();
        }
    }

    saveWorkouts() {
        localStorage.setItem('allenamenti', JSON.stringify(this.allenamenti));
    }

    createWorkout() {
        const nuovoNome = prompt('Inserisci il nome del nuovo allenamento:');
        
        if (nuovoNome && nuovoNome.trim() !== '') {
            const nuovoAllenamento = {
                id: Date.now(),
                nome: nuovoNome.trim(),
                esercizi: []
            };

            this.allenamenti.push(nuovoAllenamento);
            this.saveWorkouts();
            this.renderWorkouts();

            // Mostra notifica di successo
            this.showNotification('Nuovo allenamento creato!', 'success');
        }
    }

    renderWorkouts() {
        const container = document.getElementById('listaAllenamenti');
        container.innerHTML = '';

        if (this.allenamenti.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h2>Nessun allenamento presente</h2>
                    <p>Clicca su "+ Nuovo Allenamento" per iniziare</p>
                </div>
            `;
            return;
        }
        
        this.allenamenti.forEach(allenamento => {
            const card = document.createElement('div');
            card.className = 'workout-card';
            card.style.cursor = 'pointer';
            
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.action-icons')) {
                    window.location.href = `workout-detail.html?id=${allenamento.id}`;
                }
            });
            
            card.innerHTML = `
                <div class="workout-info">
                    <h3>${allenamento.nome}</h3>
                    <div class="action-icons">
                        <button class="icon-button edit" onclick="workoutManager.editWorkout(${allenamento.id})" title="Modifica">
                            <span class="material-icons">edit</span>
                        </button>
                        <button class="icon-button duplicate" onclick="workoutManager.duplicateWorkout(${allenamento.id})" title="Duplica">
                            <span class="material-icons">content_copy</span>
                        </button>
                        <button class="icon-button delete" onclick="workoutManager.deleteWorkout(${allenamento.id})" title="Elimina">
                            <span class="material-icons">delete_outline</span>
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }
}

// Inizializzazione
const workoutManager = new WorkoutManager(); 