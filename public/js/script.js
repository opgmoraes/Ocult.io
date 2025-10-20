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

// --- FUNÇÕES DE MODAL ESTILIZADO ---
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
    handleRedirectIntent();
    const pathname = window.location.pathname;
    if (pathname.includes('dashboard.html')) setupDashboardPage();
    else if (pathname.includes('grupo.html')) setupGroupPage();
    else if (pathname.includes('juntar.html')) setupJoinPage();
    else if (pathname.endsWith('/') || pathname.includes('index.html')) setupIndexPage();
    setupAuthForms();
});

// --- FUNÇÕES DE SETUP ---
function handleRedirectIntent() {
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    if (redirect === 'premium') {
        localStorage.setItem('upgradeIntent', 'true');
        const loginRedirectLink = document.getElementById('login-redirect-link');
        if (loginRedirectLink) {
            loginRedirectLink.href = 'login.html?redirect=premium';
        }
    }
}

function setupIndexPage() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const answer = item.querySelector('.faq-answer');
            const isActive = item.classList.contains('active');
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
                otherItem.querySelector('.faq-answer').style.maxHeight = null;
            });
            if (!isActive) {
                item.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });
}

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
    if (localStorage.getItem('upgradeIntent') === 'true') {
        localStorage.removeItem('upgradeIntent');
        window.location.href = 'https://pay.cakto.com.br/sbiiqte_611960';
        return; 
    }

    const logoutButton = document.getElementById('logout-button');
    const openModalButton = document.getElementById('open-modal-button');
    const userPlanBadge = document.getElementById('user-plan-badge');

    if(logoutButton) logoutButton.addEventListener('click', () => auth.signOut().then(() => window.location.href = 'index.html'));
    
    auth.onAuthStateChanged(user => {
        if (user) {
            db.collection('usuarios').doc(user.uid).onSnapshot(userDoc => {
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    document.getElementById('user-greeting').textContent = `Olá, ${userData.nome}!`;
                    const premiumBanner = document.querySelector('.premium-banner');
                    
                    if (userData.plano === 'premium') {
                        userPlanBadge.textContent = 'Premium';
                        userPlanBadge.className = 'plan-badge premium';
                        if (premiumBanner) premiumBanner.style.display = 'none';
                    } else {
                        userPlanBadge.textContent = 'Gratuito';
                        userPlanBadge.className = 'plan-badge free';
                        if (premiumBanner) premiumBanner.style.display = 'grid';
                    }
                }
            });

            db.collection('grupos').where('organizadorId', '==', user.uid).orderBy('criadoEm', 'desc')
              .onSnapshot(async (snapshot) => {
                const userDoc = await db.collection('usuarios').doc(user.uid).get();
                const userPlan = userDoc.exists ? userDoc.data().plano : 'gratuito';

                if (userPlan === 'gratuito' && snapshot.size >= 1) {
                    openModalButton.disabled = true;
                    openModalButton.title = "Usuários do plano gratuito podem criar apenas 1 grupo.";
                    openModalButton.style.opacity = '0.5';
                    openModalButton.style.cursor = 'not-allowed';
                } else {
                    openModalButton.disabled = false;
                    openModalButton.title = "";
                    openModalButton.style.opacity = '1';
                    openModalButton.style.cursor = 'pointer';
                }
                
                const groupsWithCounts = await Promise.all(snapshot.docs.map(async (doc) => {
                    const groupData = { id: doc.id, ...doc.data() };
                    const participantsSnapshot = await db.collection('grupos').doc(doc.id).collection('participantes').get();
                    groupData.participantCount = participantsSnapshot.size;
                    return groupData;
                }));
                renderGroups(groupsWithCounts);
              });
        } else { window.location.href = 'login.html'; }
    });

    const createGroupForm = document.getElementById('create-group-form');
    const modal = document.getElementById('create-group-modal');
    if(openModalButton) openModalButton.onclick = () => { modal.style.display = 'block'; };
    document.querySelector('.close-button').onclick = () => { modal.style.display = 'none'; };
    window.onclick = (event) => { if (event.target == modal) modal.style.display = 'none'; };
    
    createGroupForm.addEventListener('submit', async function(e) { 
        e.preventDefault(); 
        const user = auth.currentUser;
        if (!user) return;
        const userDoc = await db.collection('usuarios').doc(user.uid).get();
        const userPlan = userDoc.exists ? userDoc.data().plano : 'gratuito';
        db.collection('grupos').add({ 
            nome: document.getElementById('group-name').value, 
            dataSorteio: document.getElementById('draw-date').value, 
            faixaPreco: document.getElementById('price-range').value, 
            organizadorId: user.uid, 
            criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            tipo: userPlan,
            regrasExclusao: [] 
        }).then((docRef) => { 
            modal.style.display = 'none'; 
            this.reset(); 
            window.location.href = `grupo.html?id=${docRef.id}`;
        }); 
    });
    
    document.getElementById('grupos-lista').addEventListener('click', async function(e) {
        if (e.target.classList.contains('delete-button')) {
            e.preventDefault();
            const groupCard = e.target.closest('a.grupo-card');
            const groupId = groupCard.dataset.id;
            const groupName = groupCard.querySelector('h3').textContent;
            const confirmed = await showCustomConfirm(`Tem certeza que deseja apagar o grupo "${groupName}"? TODOS os participantes e resultados serão removidos permanentemente.`);
            if (confirmed) {
                showNotification("Apagando grupo e todos os seus dados...", "success");
                try {
                    const groupRef = db.collection('grupos').doc(groupId);
                    const participantsSnapshot = await groupRef.collection('participantes').get();
                    const deleteParticipantsPromises = participantsSnapshot.docs.map(doc => doc.ref.delete());
                    const sorteioSnapshot = await groupRef.collection('sorteio').get();
                    const deleteSorteioPromises = sorteioSnapshot.docs.map(doc => doc.ref.delete());
                    await Promise.all([...deleteParticipantsPromises, ...deleteSorteioPromises]);
                    await groupRef.delete();
                    showNotification(`Grupo "${groupName}" apagado com sucesso!`, "success");
                } catch (error) {
                    console.error("Erro ao apagar o grupo: ", error);
                    showNotification("Ocorreu um erro ao tentar apagar o grupo.", "error");
                }
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
                showNotification("Link copiado para a área de transferência!", "success");
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

                    const rulesSection = document.getElementById('exclusion-rules-section');
                    if (rulesSection) {
                        if (group.tipo === 'premium') {
                            rulesSection.style.display = 'block';
                            renderExclusionRules(group.regrasExclusao || []);
                        } else {
                            rulesSection.style.display = 'none';
                        }
                    }

                    if (group.statusSorteio === 'realizado') {
                        sortearButton.style.display = 'none';
                        if (rulesSection) rulesSection.style.display = 'none';
                        document.getElementById('draw-result-display').innerHTML = '<p>Sorteio concluído! Avise os participantes para conferirem o resultado com a senha que criaram.</p>';
                    } else if (dataSorteio <= hoje) {
                        sortearButton.disabled = false;
                        sortearButton.textContent = 'Sortear Agora!';
                    } else {
                        sortearButton.disabled = true;
                        sortearButton.textContent = `Aguardando a data do sorteio`;
                    }
                } else if(doc.exists) {
                    showNotification("Você não é o organizador deste grupo.", "error");
                    setTimeout(() => { window.location.href = 'dashboard.html'; }, 2000);
                } else {
                    window.location.href = 'dashboard.html';
                }
            });

            db.collection('grupos').doc(groupId).collection('participantes').orderBy('adicionadoEm', 'asc')
              .onSnapshot(async (snapshot) => {
                  const participants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                  const groupDoc = await groupRef.get();
                  const groupType = groupDoc.exists ? groupDoc.data().tipo : 'gratuito';
                  
                  if (groupType === 'gratuito' && participants.length >= 10) {
                      showNotification("Limite de 10 participantes atingido para o plano gratuito.", "error");
                  }
                  
                  renderParticipants(participants, groupId);
                  updateRuleSelectors(participants);
              });
            
            sortearButton.addEventListener('click', () => realizarSorteio(groupId));

            const addRuleForm = document.getElementById('add-rule-form');
            if (addRuleForm) {
                addRuleForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const fromSelect = document.getElementById('rule-from-select');
                    const toSelect = document.getElementById('rule-to-select');
                    const fromId = fromSelect.value;
                    const fromName = fromSelect.options[fromSelect.selectedIndex].text;
                    const toId = toSelect.value;
                    const toName = toSelect.options[toSelect.selectedIndex].text;

                    if (!fromId || !toId) {
                        showNotification("Por favor, selecione dois participantes.", "error");
                        return;
                    }
                    if (fromId === toId) {
                        showNotification("Um participante não pode ser excluído de tirar a si mesmo.", "error");
                        return;
                    }
                    const newRule = { fromId, fromName, toId, toName };
                    groupRef.update({
                        regrasExclusao: firebase.firestore.FieldValue.arrayUnion(newRule)
                    });
                });
            }

            const rulesList = document.getElementById('rules-list');
            if (rulesList) {
                rulesList.addEventListener('click', async (e) => {
                    if (e.target.classList.contains('remove-participant-btn')) {
                        const ruleItem = e.target.closest('.rule-item');
                        const fromId = ruleItem.dataset.from;
                        const toId = ruleItem.dataset.to;
                        const groupDoc = await groupRef.get();
                        const currentRules = groupDoc.data().regrasExclusao || [];
                        const ruleToRemove = currentRules.find(rule => rule.fromId === fromId && rule.toId === toId);
                        if (ruleToRemove) {
                            groupRef.update({
                                regrasExclusao: firebase.firestore.FieldValue.arrayRemove(ruleToRemove)
                            });
                        }
                    }
                });
            }
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

        const myParticipantId = localStorage.getItem(`participant_${groupId}`);
        if (groupData.tipo === 'premium' && myParticipantId && groupData.statusSorteio !== 'realizado') {
            showMyWishlist(groupId, myParticipantId);
        }

        if (groupData.statusSorteio === 'realizado') {
            instructionsEl.textContent = "Sorteio realizado! Clique no seu nome e digite sua senha para ver seu amigo secreto.";
            joinForm.style.display = 'none';
            db.collection('grupos').doc(groupId).collection('participantes').orderBy('nome', 'asc').onSnapshot(snapshot => 
                renderJoinableParticipants(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })), groupId, 'result', groupData.tipo, myParticipantId)
            );
        } else {
            instructionsEl.textContent = "Para participar, digite seu nome e crie uma senha simples.";
            joinForm.style.display = 'block';
            joinListTitle.style.display = 'block';
            joinDivider.style.display = 'block';
            joinForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const groupDoc = await groupRef.get();
                const groupType = groupDoc.exists ? groupDoc.data().tipo : 'gratuito';
                const participantsSnapshot = await db.collection('grupos').doc(groupId).collection('participantes').get();

                if(groupType === 'gratuito' && participantsSnapshot.size >= 10){
                    showNotification("Este grupo atingiu o limite de 10 participantes do plano gratuito.", "error");
                    return;
                }

                const name = document.getElementById('join-name').value.trim();
                const password = document.getElementById('join-password').value;
                if(name && password){
                    db.collection('grupos').doc(groupId).collection('participantes').add({
                        nome: name, senha: password, adicionadoEm: firebase.firestore.FieldValue.serverTimestamp(), desejos: []
                    }).then((docRef) => {
                        joinForm.reset();
                        showNotification(`Bem-vindo(a) ao grupo, ${name}!`, 'success');
                        localStorage.setItem(`participant_${groupId}`, docRef.id);
                        if (groupData.tipo === 'premium') {
                            showMyWishlist(groupId, docRef.id);
                        }
                    });
                }
            });
            db.collection('grupos').doc(groupId).collection('participantes').orderBy('adicionadoEm', 'asc').onSnapshot(snapshot => 
                renderJoinableParticipants(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })), groupId, 'join', groupData.tipo, myParticipantId)
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
    const groupRef = db.collection('grupos').doc(groupId);
    const participantsRef = groupRef.collection('participantes');
    
    const [groupDoc, participantsSnapshot] = await Promise.all([
        groupRef.get(),
        participantsRef.get()
    ]);

    if (participantsSnapshot.size < 3) {
        showNotification("É preciso ter no mínimo 3 participantes para realizar o sorteio.", "error");
        sortearButton.disabled = false;
        sortearButton.textContent = "Sortear Agora!";
        return;
    }
    const participantsData = participantsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const exclusionRules = groupDoc.exists ? groupDoc.data().regrasExclusao || [] : [];
    const givers = [...participantsData];
    let receivers = [...participantsData];
    let sorteioValido = false;
    let tentativas = 0;

    while (!sorteioValido && tentativas < 100) {
        tentativas++;
        sorteioValido = true;
        receivers.sort(() => Math.random() - 0.5); 
        for (let i = 0; i < givers.length; i++) {
            const giverId = givers[i].id;
            const receiverId = receivers[i].id;
            if (giverId === receiverId) {
                sorteioValido = false;
                break;
            }
            for (const rule of exclusionRules) {
                if (rule.fromId === giverId && rule.toId === receiverId) {
                    sorteioValido = false;
                    break;
                }
            }
            if (!sorteioValido) break;
        }
    }
    if (!sorteioValido) {
        showNotification("Não foi possível gerar um sorteio que respeite todas as regras. Tente remover algumas regras ou adicionar mais participantes.", "error");
        sortearButton.disabled = false;
        sortearButton.textContent = "Sortear Agora!";
        return;
    }
    const batch = db.batch();
    for (let i = 0; i < givers.length; i++) {
        const sorteioDocRef = groupRef.collection('sorteio').doc(givers[i].id);
        batch.set(sorteioDocRef, { tirado: receivers[i].id });
    }
    batch.update(groupRef, { statusSorteio: "realizado" });
    await batch.commit();
    showNotification("Sorteio realizado com sucesso!", "success");
}

// --- FUNÇÕES DE LISTA DE DESEJOS ---
function showMyWishlist(groupId, participantId) {
    const wishlistSection = document.getElementById('wishlist-section');
    if (!wishlistSection) return;
    wishlistSection.style.display = 'block';
    const wishlistForm = document.getElementById('wishlist-form');
    const wishInput = document.getElementById('wish-input');
    const myWishlistContainer = document.getElementById('my-wishlist');
    const participantRef = db.collection('grupos').doc(groupId).collection('participantes').doc(participantId);
    participantRef.onSnapshot(doc => {
        const wishes = doc.exists ? doc.data().desejos : [];
        renderMyWishes(wishes);
    });
    wishlistForm.onsubmit = (e) => {
        e.preventDefault();
        const newWish = wishInput.value.trim();
        if (newWish) {
            participantRef.update({
                desejos: firebase.firestore.FieldValue.arrayUnion(newWish)
            }).then(() => {
                wishInput.value = '';
            });
        }
    };
    myWishlistContainer.onclick = (e) => {
        if (e.target.classList.contains('remove-participant-btn')) {
            const wishToRemove = e.target.parentElement.querySelector('span').textContent;
            participantRef.update({
                desejos: firebase.firestore.FieldValue.arrayRemove(wishToRemove)
            });
        }
    };
}

function renderMyWishes(wishes) {
    const myWishlistContainer = document.getElementById('my-wishlist');
    if (!myWishlistContainer) return;
    myWishlistContainer.innerHTML = '';
    if (!wishes || wishes.length === 0) {
        myWishlistContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Você ainda não adicionou nenhuma sugestão.</p>';
        return;
    }
    wishes.forEach(wish => {
        const item = document.createElement('div');
        item.className = 'wish-item';
        item.innerHTML = `<span>${wish}</span><button class="remove-participant-btn">&times;</button>`;
        myWishlistContainer.appendChild(item);
    });
}

// --- FUNÇÕES DE REGRAS DE EXCLUSÃO ---
function updateRuleSelectors(participants) {
    const fromSelect = document.getElementById('rule-from-select');
    const toSelect = document.getElementById('rule-to-select');
    if (!fromSelect || !toSelect) return;
    const currentFromValue = fromSelect.value;
    const currentToValue = toSelect.value;
    fromSelect.innerHTML = '<option value="" disabled selected>De...</option>';
    toSelect.innerHTML = '<option value="" disabled selected>Para...</option>';
    participants.forEach(p => {
        const optionHTML = `<option value="${p.id}">${p.nome}</option>`;
        fromSelect.innerHTML += optionHTML;
        toSelect.innerHTML += optionHTML;
    });
    fromSelect.value = currentFromValue;
    toSelect.value = currentToValue;
}

function renderExclusionRules(rules) {
    const listContainer = document.getElementById('rules-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';
    if (!rules || rules.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Nenhuma regra de exclusão criada.</p>';
        return;
    }
    rules.forEach(rule => {
        const item = document.createElement('div');
        item.className = 'rule-item';
        item.dataset.from = rule.fromId;
        item.dataset.to = rule.toId;
        item.innerHTML = `
            <span><strong>${rule.fromName}</strong> não pode tirar <strong>${rule.toName}</strong></span>
            <button class="remove-participant-btn" title="Remover regra">&times;</button>
        `;
        listContainer.appendChild(item);
    });
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
            <div class="group-info">
                <span class="participant-count">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path fill-rule="evenodd" d="M5.216 14A2.238 2.238 0 0 1 5 13c0-1.355.68-2.5 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/></svg>
                    ${group.participantCount} Participantes
                </span>
            </div>
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

function renderJoinableParticipants(participants, groupId, mode, groupType, myParticipantId) {
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
        const isMe = p.id === myParticipantId;
        item.className = 'join-participant';
        if(isMe) { item.classList.add('is-me'); }
        item.textContent = p.nome + (isMe ? ' (Você)' : '');
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

                        let receiverWishesHTML = '';
                        if (groupType === 'premium' && receiverDoc.data().desejos && receiverDoc.data().desejos.length > 0) {
                            const wishesList = receiverDoc.data().desejos.map(wish => `<li>${wish}</li>`).join('');
                            receiverWishesHTML = `
                                <div class="wishlist-display">
                                    <h4>Lista de Desejos de ${receiverDoc.data().nome}:</h4>
                                    <ul>${wishesList}</ul>
                                </div>
                            `;
                        } else if (groupType === 'premium') {
                            receiverWishesHTML = `
                                <div class="wishlist-display">
                                    <h4>Lista de Desejos de ${receiverDoc.data().nome}:</h4>
                                    <p style="color: var(--text-muted);">Esta pessoa ainda não adicionou sugestões.</p>
                                </div>
                            `;
                        }

                        resultDisplay.innerHTML = `
                            <p class="result-text">Você tirou:</p>
                            <span class="result-name">${receiverDoc.data().nome}</span>
                            ${receiverWishesHTML}
                        `;
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