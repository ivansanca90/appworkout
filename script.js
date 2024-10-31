document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('formModal');
    const openBtn = document.getElementById('openFormBtn');
    const closeBtn = document.querySelector('.close-btn');
    const form = document.getElementById('workoutForm');
    const workoutList = document.querySelector('.workout-list');

    // Carica gli allenamenti salvati
    loadWorkouts();

    // FUNZIONI DI SALVATAGGIO E CARICAMENTO
    function saveWorkouts() {
        const workouts = [];
        const items = document.querySelectorAll('.workout-item');
        
        items.forEach(item => {
            const workout = {
                giorno: item.querySelector('.day-tag').textContent.replace('GIORNO ', ''),
                tipo: item.querySelector('h2').textContent,
                esercizi: item.querySelector('p').textContent.split(' ')[0]
            };
            workouts.push(workout);
        });

        localStorage.setItem('workouts', JSON.stringify(workouts));
        console.log('Salvati:', workouts); // Debug
    }

    function loadWorkouts() {
        const workouts = JSON.parse(localStorage.getItem('workouts') || '[]');
        console.log('Caricati:', workouts); // Debug

        if (workouts.length === 0) {
            workoutList.innerHTML = `
                <div class="empty-state">
                    Clicca sul pulsante + per aggiungere il tuo allenamento
                </div>`;
            return;
        }

        workoutList.innerHTML = workouts.map(w => createWorkoutHTML(w)).join('');
    }

    // Modifica la parte del template che genera la freccia
    function createWorkoutHTML(workout) {
        return `
            <div class="workout-item">
                <div class="workout-header">
                    <div class="day-tag">GIORNO ${workout.giorno}</div>
                    <div class="action-buttons">
                        <button class="action-btn">Modifica</button>
                        <button class="action-btn delete">Elimina</button>
                    </div>
                </div>
                <div class="workout-content">
                    <div class="workout-text">
                        <h2>${workout.tipo}</h2>
                        <p>${workout.esercizi} esercizi</p>
                    </div>
                    <div class="arrow"></div>
                </div>
            </div>
        `;
    }

    // GESTIONE MODALE
    openBtn.addEventListener('click', () => modal.classList.add('active'));
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        form.reset();
    });

    // GESTIONE FORM
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const giorno = document.getElementById('giorno').value;
        const tipo = document.getElementById('tipo').value;
        const esercizi = document.getElementById('esercizi').value;

        const emptyState = workoutList.querySelector('.empty-state');
        if (emptyState) emptyState.remove();

        workoutList.insertAdjacentHTML('beforeend', `
            <div class="workout-item">
                <div class="workout-header">
                    <div class="day-tag">GIORNO ${giorno}</div>
                    <div class="action-buttons">
                        <button class="action-btn">Modifica</button>
                        <button class="action-btn delete">Elimina</button>
                    </div>
                </div>
                <div class="workout-content">
                    <div class="workout-text">
                        <h2>${tipo}</h2>
                        <p>${esercizi} esercizi</p>
                    </div>
                    <div class="arrow">→</div>
                </div>
            </div>
        `);

        saveWorkouts(); // Salva dopo l'aggiunta
        
        modal.classList.remove('active');
        form.reset();
    });

    // GESTIONE MODIFICA ED ELIMINA
    document.addEventListener('click', function(e) {
        if (e.target.textContent === 'Elimina') {
            if (confirm('Sei sicuro di voler eliminare questo allenamento?')) {
                e.target.closest('.workout-item').remove();
                saveWorkouts(); // Salva dopo l'eliminazione

                if (!document.querySelector('.workout-item')) {
                    workoutList.innerHTML = `
                        <div class="empty-state">
                            Clicca sul pulsante + per aggiungere il tuo allenamento
                        </div>`;
                }
            }
        }

        if (e.target.textContent === 'Modifica') {
            const item = e.target.closest('.workout-item');
            
            document.getElementById('giorno').value = item.querySelector('.day-tag').textContent.replace('GIORNO ', '');
            document.getElementById('tipo').value = item.querySelector('h2').textContent;
            document.getElementById('esercizi').value = item.querySelector('p').textContent.split(' ')[0];

            // Rimuovi il vecchio elemento e salva
            item.remove();
            saveWorkouts();
            
            modal.classList.add('active');
        }
    });

    // Aggiungi questo evento per gestire il click sull'allenamento
    workoutList.addEventListener('click', function(e) {
        const workoutItem = e.target.closest('.workout-item');
        if (workoutItem && !e.target.classList.contains('action-btn')) {
            // Recupera l'indice dell'allenamento
            const index = Array.from(workoutList.children).indexOf(workoutItem);
            window.location.href = `workout-detail.html?id=${index}`;
        }
    });
});