import admin from 'firebase-admin';

// Esta é a "chave secreta" que configuramos na Vercel.
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

// Conecta-se ao seu projeto Firebase de forma segura.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Esta é a função principal que a Vercel vai executar.
export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    // Pega os dados que a Cakto enviou.
    const { event, data } = request.body;
    const email = data && data.customer ? data.customer.email : null;

    console.log(`Webhook da Cakto recebido: Email - ${email}, Evento - ${event}`);

    // --- AQUI ESTÁ A NOVA LÓGICA ---
    // Verifica se o evento é um dos que nos interessam.
    const isApprovedEvent = event === 'purchase.approved'; // Compra real aprovada
    const isTestEvent = event === 'pix_created'; // PIX gerado (para nosso teste)

    if (isApprovedEvent || isTestEvent) {
      if (!email) {
        console.error(`Webhook '${event}' recebido, mas sem e-mail do cliente.`);
        return response.status(400).json({ error: 'E-mail não fornecido no webhook.' });
      }

      // Procura o usuário no seu banco de dados pelo e-mail.
      const usersRef = db.collection('usuarios');
      const snapshot = await usersRef.where('email', '==', email).limit(1).get();

      if (snapshot.empty) {
        console.log(`Usuário com o e-mail ${email} não foi encontrado.`);
        return response.status(200).json({ message: 'Webhook recebido, usuário não encontrado.' });
      }

      // ATUALIZA O PLANO DO USUÁRIO PARA PREMIUM!
      const userDoc = snapshot.docs[0];
      await userDoc.ref.update({ plano: 'premium' });

      // Registra qual evento causou a atualização
      const logMessage = `SUCESSO via evento '${event}': Usuário ${email} atualizado para o plano Premium.`;
      console.log(logMessage);
      return response.status(200).json({ message: 'Plano do usuário atualizado com sucesso.' });

    } else {
      // Se o evento não for um dos que esperamos, apenas registramos e ignoramos.
      console.log(`Webhook da Cakto ignorado com evento: ${event}`);
      return response.status(200).json({ message: 'Webhook recebido, mas evento ignorado.' });
    }

  } catch (error) {
    console.error('ERRO GERAL NO WEBHOOK:', error);
    return response.status(500).json({ error: 'Erro interno do servidor.' });
  }
}