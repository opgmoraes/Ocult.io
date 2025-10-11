// Suas chaves do Firebase.
const firebaseConfig = {
  apiKey: "AIzaSyBvHg_emkllhmA8L4QIFTgSPDllCYzJO2Q",
  authDomain: "sorteador-amigo-secreto-96571.firebaseapp.com",
  projectId: "sorteador-amigo-secreto-96571",
  storageBucket: "sorteador-amigo-secreto-96571.appspot.com",
  messagingSenderId: "160808535735",
  appId: "1:160808535735:web:1933b6a83c92fe3e0bef32",
  measurementId: "G-JXN4HK93X3"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();
const auth = firebase.auth();
const db = firebase.firestore();

// --- FUNÇÃO DE NOTIFICAÇÃO GLOBAL ---
function showNotification(message, type) {
    const notification = document.getElementById('global-notification');
    if (notification) {
        notification.textContent = message;
        notification.className = 'show ' + type;
        setTimeout(() => {
            notification.className = notification.className.replace('show', '');
        }, 4000);
    }
}

// --- FUNÇÕES DE MODAL ESTILIZADO (SUBSTITUTOS DE CONFIRM E PROMPT) ---
function showCustomConfirm(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('action-modal');
        const modalText = document.getElementById('action-modal-text');
        const input = document.getElementById('action-modal-input');
        const okButton = document.getElementById('action-modal-ok');
        const cancelButton = document.getElementById('action-modal-cancel');
        if (!modal) { return resolve(confirm(message)); }
        modalText.textContent = message;
        input.style.display = 'none';
        modal.style.display = 'flex';
        const newOkButton = okButton.cloneNode(true);
        okButton.parentNode.replaceChild(newOkButton, okButton);
        const newCancelButton = cancelButton.cloneNode(true);
        cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
        newOkButton.onclick = () => { modal.style.display = 'none'; resolve(true); };
        newCancelButton.onclick = () => { modal.style.display = 'none'; resolve(false); };
    });
}

function showCustomPrompt(message, type = 'text') {
    return new Promise((resolve) => {
        const modal = document.getElementById('action-modal');
        const modalText = document.getElementById('action-modal-text');
        const input = document.getElementById('action-modal-input');
        const okButton = document.getElementById('action-modal-ok');
        const cancelButton = document.getElementById('action-modal-cancel');
        if (!modal) { return resolve(prompt(message)); }
        modalText.textContent = message;
        input.style.display = 'block';
        input.type = type;
        input.value = '';
        modal.style.display = 'flex';
        input.focus();
        const newOkButton = okButton.cloneNode(true);
        okButton.parentNode.replaceChild(newOkButton, okButton);
        const newCancelButton = cancelButton.cloneNode(true);
        cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
        const resolveWithValue = () => { modal.style.display = 'none'; resolve(input.value); };
        input.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); resolveWithValue(); } };
        newOkButton.onclick = resolveWithValue;
        newCancelButton.onclick = () => { modal.style.display = 'none'; resolve(null); };
    });
}

// --- LÓGICA CENTRAL ---
document.addEventListener('DOMContentLoaded', () => {
    const pathname = window.location.pathname;
    if (pathname.includes('dashboard.html')) setupDashboardPage();
    else if (pathname.includes('grupo.html')) setupGroupPage();
    else if (pathname.includes('juntar.html')) setupJoinPage();
    setupAuthForms();
});

// --- FUNÇÕES DE SETUP ---
function setupAuthForms() {
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const submitButton = this.querySelector('button[type="submit"]');
            const nome = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const senha = document.getElementById('password').value;
            submitButton.disabled = true;
            submitButton.textContent = 'Criando...';
            auth.createUserWithEmailAndPassword(email, senha)
                .then(userCredential => {
                    return db.collection('usuarios').doc(userCredential.user.uid).set({ nome: nome, email: email, plano: 'gratuito' });
                })
                .then(() => {
                    showNotification('Cadastro realizado com sucesso! Redirecionando...', 'success');
                    setTimeout(() => { window.location.href = 'login.html'; }, 2000);
                })
                .catch(handleAuthError)
                .finally(() => {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Criar Conta';
                });
        });
    }
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const submitButton = this.querySelector('button[type="submit"]');
            const email = document.getElementById('email').value;
            const senha = document.getElementById('password').value;
            submitButton.disabled = true;
            submitButton.textContent = 'Entrando...';
            auth.signInWithEmailAndPassword(email, senha)
                .then(() => {
                    showNotification('Login bem-sucedido! Redirecionando...', 'success');
                    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
                })
                .catch(() => showNotification('E-mail ou senha inválidos.', 'error'))
                .finally(() => {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Entrar';
                });
        });
    }
    const recoverForm = document.getElementById('recover-form');
    if (recoverForm) {
        recoverForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const submitButton = this.querySelector('button[type="submit"]');
            const email = document.getElementById('email').value;
            submitButton.disabled = true;
            submitButton.textContent = 'Enviando...';
            auth.sendPasswordResetEmail(email)
                .then(() => showNotification('E-mail de redefinição de senha enviado com sucesso!', 'success'))
                .catch(() => showNotification('Erro ao enviar e-mail. Verifique se o e-mail está correto.', 'error'))
                .finally(() => {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Enviar Link de Recuperação';
                });
        });
    }
}

function setupDashboardPage() {
    const logoutButton = document.getElementById('logout-button');
    if(logoutButton) logoutButton.addEventListener('click', () => auth.signOut().then(() => window.location.href = 'index.html'));
    auth.onAuthStateChanged(user => {
        if (user) {
            db.collection('usuarios').doc(user.uid).get().then(doc => {
                if (doc.exists) document.getElementById('user-greeting').textContent = `Olá, ${doc.data().nome}!`;
            });
            db.collection('grupos').where('organizadorId', '==', user.uid).orderBy('criadoEm', 'desc')
              .onSnapshot(snapshot => renderGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        } else { window.location.href = 'login.html'; }
    });
    const createGroupForm = document.getElementById('create-group-form');
    const modal = document.getElementById('create-group-modal');
    document.getElementById('open-modal-button').onclick = () => { modal.style.display = 'block'; };
    document.querySelector('.close-button').onclick = () => { modal.style.display = 'none'; };
    window.onclick = (event) => { if (event.target == modal) modal.style.display = 'none'; };
    createGroupForm.addEventListener('submit', function(e) { e.preventDefault(); db.collection('grupos').add({ nome: document.getElementById('group-name').value, dataSorteio: document.getElementById('draw-date').value, faixaPreco: document.getElementById('price-range').value, organizadorId: auth.currentUser.uid, criadoEm: firebase.firestore.FieldValue.serverTimestamp() }).then(() => { modal.style.display = 'none'; this.reset(); }); });
    document.getElementById('grupos-lista').addEventListener('click', async function(e) {
        if (e.target.classList.contains('delete-button')) {
            e.preventDefault();
            const groupCard = e.target.closest('a.grupo-card');
            const groupId = groupCard.dataset.id;
            const groupName = groupCard.querySelector('h3').textContent;
            const confirmed = await showCustomConfirm(`Tem certeza que deseja apagar o grupo "${groupName}"?`);
            if (confirmed) {
                db.collection('grupos').doc(groupId).delete();
            }
        }
    });
}

function setupGroupPage() {
    const logoutButton = document.getElementById('logout-button');
    if(logoutButton) logoutButton.addEventListener('click', () => auth.signOut().then(() => window.location.href = 'index.html'));
    
    const urlParams = new URLSearchParams(window.location.search);
    const groupId = urlParams.get('id');
    const sortearButton = document.getElementById('sortear-button');

    if (groupId) {
        const inviteLink = `${window.location.origin}/juntar.html?id=${groupId}`;
        document.getElementById('invite-link-input').value = inviteLink;
        document.getElementById('copy-link-button').addEventListener('click', () => {
            navigator.clipboard.writeText(inviteLink).then(() => {
                document.getElementById('copy-link-button').textContent = 'Copiado!';
                setTimeout(() => { document.getElementById('copy-link-button').textContent = 'Copiar'; }, 2000);
            });
        });
    }

    auth.onAuthStateChanged(user => {
        if (user && groupId) {
            const groupRef = db.collection('grupos').doc(groupId);
            groupRef.onSnapshot(doc => {
                if (doc.exists && doc.data().organizadorId === user.uid) {
                    const group = doc.data();
                    document.getElementById('group-name-title').textContent = group.nome;
                    const dataSorteio = new Date(group.dataSorteio + 'T12:00:00');
                    document.getElementById('group-draw-date').textContent = dataSorteio.toLocaleDateString('pt-BR');
                    document.getElementById('group-price-range').textContent = group.faixaPreco || '--,--';
                    const hoje = new Date();
                    hoje.setHours(0, 0, 0, 0);
                    if (group.statusSorteio === 'realizado') {
                        sortearButton.style.display = 'none';
                        document.getElementById('draw-result-display').innerHTML = '<p>Sorteio concluído! Avise os participantes para conferirem o resultado com a senha que criaram.</p>';
                    } else if (dataSorteio <= hoje) {
                        sortearButton.disabled = false;
                        sortearButton.textContent = 'Sortear Agora!';
                    } else {
                        sortearButton.disabled = true;
                        sortearButton.textContent = `Aguardando a data do sorteio`;
                    }
                } else {
                    showNotification("Você não é o organizador deste grupo ou o grupo não existe.", "error");
                    setTimeout(() => { window.location.href = 'dashboard.html'; }, 2000);
                }
            });

            db.collection('grupos').doc(groupId).collection('participantes').orderBy('adicionadoEm', 'asc')
              .onSnapshot(snapshot => renderParticipants(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })), groupId));
            
            sortearButton.addEventListener('click', () => realizarSorteio(groupId));
        } else if (!user) {
            window.location.href = 'login.html';
        }
    });
}

function setupJoinPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const groupId = urlParams.get('id');
    const groupNameEl = document.getElementById('join-group-name');
    const instructionsEl = document.getElementById('join-instructions');
    const joinForm = document.getElementById('join-group-form');
    const joinListTitle = document.getElementById('join-list-title');
    const joinDivider = document.getElementById('join-divider');
    
    if (!groupId) {
        groupNameEl.textContent = "Erro";
        instructionsEl.textContent = "ID do grupo não encontrado na URL.";
        return;
    }

    const groupRef = db.collection('grupos').doc(groupId);
    groupRef.get().then(doc => {
        if (!doc.exists) {
            groupNameEl.textContent = "Erro";
            instructionsEl.textContent = "Este grupo não existe.";
            return;
        }
        const groupData = doc.data();
        groupNameEl.textContent = groupData.nome;

        if (groupData.statusSorteio === 'realizado') {
            instructionsEl.textContent = "Sorteio realizado! Clique no seu nome e digite sua senha para ver seu amigo secreto.";
            joinForm.style.display = 'none';
            db.collection('grupos').doc(groupId).collection('participantes').orderBy('nome', 'asc').onSnapshot(snapshot => 
                renderJoinableParticipants(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })), groupId, 'result')
            );
        } else {
            instructionsEl.textContent = "Para participar, digite seu nome e crie uma senha simples.";
            joinForm.style.display = 'block';
            joinListTitle.style.display = 'block';
            joinDivider.style.display = 'block';
            joinForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('join-name').value.trim();
                const password = document.getElementById('join-password').value;
                if(name && password){
                    db.collection('grupos').doc(groupId).collection('participantes').add({
                        nome: name, senha: password, adicionadoEm: firebase.firestore.FieldValue.serverTimestamp()
                    }).then(() => {
                        joinForm.reset();
                        showNotification(`Bem-vindo(a) ao grupo, ${name}!`, 'success');
                    });
                }
            });
            db.collection('grupos').doc(groupId).collection('participantes').orderBy('adicionadoEm', 'asc').onSnapshot(snapshot => 
                renderJoinableParticipants(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })), groupId, 'join')
            );
        }
    });
}

// --- FUNÇÕES DE SORTEIO ---
async function realizarSorteio(groupId) {
    const confirmed = await showCustomConfirm("Tem certeza que deseja realizar o sorteio? Esta ação não pode ser desfeita.");
    if (!confirmed) return;
    const sortearButton = document.getElementById('sortear-button');
    sortearButton.disabled = true;
    sortearButton.textContent = "Sorteando...";
    const snapshot = await db.collection('grupos').doc(groupId).collection('participantes').get();
    if (snapshot.size < 3) {
        showNotification("É preciso ter no mínimo 3 participantes para realizar o sorteio.", "error");
        sortearButton.disabled = false;
        sortearButton.textContent = "Sortear Agora!";
        return;
    }
    const participantsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const givers = [...participantsData];
    let receivers = [...participantsData].sort(() => Math.random() - 0.5);
    let sorteioValido = false;
    let tentativas = 0;
    while(!sorteioValido && tentativas < 100) {
        tentativas++;
        sorteioValido = true;
        for (let i = 0; i < givers.length; i++) {
            if (givers[i].id === receivers[i].id) {
                sorteioValido = false;
                receivers.sort(() => Math.random() - 0.5);
                break;
            }
        }
    }
    if (!sorteioValido) {
        showNotification("Não foi possível gerar um sorteio válido. Tente novamente.", "error");
        sortearButton.disabled = false;
        sortearButton.textContent = "Sortear Agora!";
        return;
    }
    const batch = db.batch();
    for (let i = 0; i < givers.length; i++) {
        const sorteioDocRef = db.collection('grupos').doc(groupId).collection('sorteio').doc(givers[i].id);
        batch.set(sorteioDocRef, { tirado: receivers[i].id });
    }
    const groupRef = db.collection('grupos').doc(groupId);
    batch.update(groupRef, { statusSorteio: "realizado" });
    await batch.commit();
    showNotification("Sorteio realizado com sucesso!", "success");
}

// --- FUNÇÕES DE RENDERIZAÇÃO E UTILIDADE ---
function handleAuthError(error) {
    if (error.code === 'auth/email-already-in-use') {
        showNotification('Este e-mail já está em uso.', 'error');
    } else if (error.code === 'auth/weak-password') {
        showNotification('A senha deve ter no mínimo 6 caracteres.', 'error');
    } else {
        showNotification('Ocorreu um erro: ' + error.message, 'error');
    }
}

function renderGroups(groups) {
    const listaContainer = document.getElementById('grupos-lista');
    if (!listaContainer) return;
    listaContainer.innerHTML = '';
    if (groups.length === 0) {
        listaContainer.innerHTML = '<p>Você ainda não criou nenhum grupo. Que tal começar agora?</p>';
        return;
    }
    groups.forEach(group => {
        const groupLink = document.createElement('a');
        groupLink.href = `grupo.html?id=${group.id}`;
        groupLink.className = 'grupo-card';
        groupLink.setAttribute('data-id', group.id);
        const dataSorteio = new Date(group.dataSorteio + 'T12:00:00');
        const dataFormatada = dataSorteio.toLocaleDateString('pt-BR');
        groupLink.innerHTML = `
            <button class="delete-button" title="Apagar grupo">&times;</button>
            <h3>${group.nome}</h3>
            <p>Data do Sorteio: <strong>${dataFormatada}</strong></p>
            <p>Faixa de Preço: <strong>R$ ${group.faixaPreco || 'Não definida'}</strong></p>
        `;
        listaContainer.appendChild(groupLink);
    });
}

function renderParticipants(participants, groupId) {
    const listContainer = document.getElementById('participants-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';
    if (participants.length === 0) {
        listContainer.innerHTML = '<p>Aguardando participantes entrarem pelo link geral.</p>';
    } else {
        participants.forEach(p => {
            const item = document.createElement('div');
            item.className = 'participant-item';
            item.innerHTML = `<span>${p.nome}</span><button class="remove-participant-btn" data-id="${p.id}">&times;</button>`;
            listContainer.appendChild(item);
        });
    }
    listContainer.onclick = async (e) => {
        if (e.target.classList.contains('remove-participant-btn')) {
            e.preventDefault();
            const participantId = e.target.dataset.id;
            const confirmed = await showCustomConfirm("Tem certeza que quer remover este participante?");
            if (confirmed) {
                db.collection('grupos').doc(groupId).collection('participantes').doc(participantId).delete();
            }
        }
    };
}

function renderJoinableParticipants(participants, groupId, mode) {
    const listContainer = document.getElementById('join-participants-list');
    const resultDisplay = document.getElementById('join-result-display');
    if (!listContainer) return;
    listContainer.innerHTML = '';
    
    if (participants.length === 0 && mode === 'join') {
        listContainer.innerHTML = '<p>Ninguém entrou no grupo ainda. Seja o primeiro!</p>';
        return;
    } else if (participants.length === 0 && mode === 'result') {
        listContainer.innerHTML = '<p>Nenhum participante neste grupo.</p>';
        return;
    }

    participants.forEach(p => {
        const item = document.createElement('div');
        item.className = 'join-participant';
        item.textContent = p.nome;
        item.dataset.id = p.id;
        item.dataset.name = p.nome;
        item.dataset.senha = p.senha;
        listContainer.appendChild(item);
    });

    if (mode === 'join') {
        return; 
    }

    listContainer.onclick = async (e) => {
        if (e.target.classList.contains('join-participant')) {
            const participantId = e.target.dataset.id;
            const participantName = e.target.dataset.name;
            
            if (mode === 'result') {
                const storedPassword = e.target.dataset.senha;
                if (!storedPassword) {
                    showNotification(`${participantName}, parece que você não criou uma senha.`, "error");
                    return;
                }
                const inputPassword = await showCustomPrompt(`Olá, ${participantName}! Digite a senha que você criou para este grupo:`, 'password');
                if (inputPassword === storedPassword) {
                    const sorteioRef = db.collection('grupos').doc(groupId).collection('sorteio').doc(participantId);
                    const sorteioDoc = await sorteioRef.get();
                    if (sorteioDoc.exists) {
                        const receiverId = sorteioDoc.data().tirado;
                        const receiverDoc = await db.collection('grupos').doc(groupId).collection('participantes').doc(receiverId).get();
                        document.getElementById('join-instructions').textContent = "Guarde bem o seu segredo!";
                        listContainer.style.display = 'none';
                        resultDisplay.style.display = 'block';
                        resultDisplay.innerHTML = `<p class="result-text">Você tirou:</p><span class="result-name">${receiverDoc.data().nome}</span>`;
                    } else {
                        showNotification('Seu resultado do sorteio ainda não foi encontrado.', 'error');
                    }
                } else if (inputPassword !== null) {
                    showNotification("Senha incorreta!", "error");
                }
            }
        }
    };
}