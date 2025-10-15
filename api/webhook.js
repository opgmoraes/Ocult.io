import admin from 'firebase-admin';

// Esta é a "chave secreta" que vamos configurar na Vercel.
// O código vai ler as variáveis de ambiente que você criar.
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // A Vercel lida com a formatação da chave privada corretamente
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
};

// Conecta-se ao seu projeto Firebase de forma segura
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Esta é a função principal que a Vercel vai executar
export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const { customer, status } = request.body;
    const email = customer ? customer.email : null;

    console.log(`Webhook recebido: Email - ${email}, Status - ${status}`);

    if (status === 'paid') {
      if (!email) {
        return response.status(400).json({ error: 'E-mail não fornecido.' });
      }

      const usersRef = db.collection('usuarios');
      const snapshot = await usersRef.where('email', '==', email).limit(1).get();

      if (snapshot.empty) {
        console.log(`Usuário com o e-mail ${email} não foi encontrado.`);
        return response.status(200).json({ message: 'Webhook recebido, mas o usuário não foi encontrado.' });
      }

      const userDoc = snapshot.docs[0];
      await userDoc.ref.update({ plano: 'premium' });

      console.log(`SUCESSO: Usuário ${email} atualizado para o plano Premium.`);
      return response.status(200).json({ message: 'Plano do usuário atualizado com sucesso.' });
    } else {
      console.log(`Webhook ignorado com status: ${status}`);
      return response.status(200).json({ message: 'Webhook recebido, mas ignorado.' });
    }

  } catch (error) {
    console.error('ERRO GERAL NO WEBHOOK:', error);
    return response.status(500).json({ error: 'Erro interno do servidor.' });
  }
}