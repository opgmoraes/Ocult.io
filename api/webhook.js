// Importa a ferramenta do Firebase para servidores
import admin from 'firebase-admin';

// Esta é a "chave secreta" que vamos configurar na Vercel.
// O código vai ler as variáveis de ambiente que você criar.
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

// Conecta-se ao seu projeto Firebase de forma segura
// A verificação "admin.apps.length" garante que a conexão só aconteça uma vez.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Esta é a função principal que a Vercel vai executar
export default async function handler(request, response) {
  // 1. Apenas aceita requisições do tipo POST (padrão de webhooks)
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    // 2. Pega os dados que a TriboPay enviou (e-mail do cliente e status da compra)
    const { customer, status } = request.body;
    const email = customer ? customer.email : null;

    // Log para depuração (você poderá ver isso nos logs da Vercel)
    console.log(`Webhook recebido: Email - ${email}, Status - ${status}`);

    // 3. A CONDIÇÃO MAIS IMPORTANTE: Só faz algo se o status for "paid" (Pago)
    if (status === 'paid') {
      if (!email) {
        console.error("Webhook 'paid' recebido, mas sem e-mail do cliente.");
        return response.status(400).json({ error: 'E-mail não fornecido.' });
      }

      // 4. Procura o usuário no seu banco de dados pelo e-mail
      const usersRef = db.collection('usuarios');
      const snapshot = await usersRef.where('email', '==', email).limit(1).get();

      if (snapshot.empty) {
        console.log(`Usuário com o e-mail ${email} não foi encontrado no banco de dados.`);
        // Mesmo assim, respondemos com sucesso para a TriboPay não tentar de novo.
        return response.status(200).json({ message: 'Webhook recebido, mas o usuário não foi encontrado.' });
      }

      // 5. ATUALIZA O PLANO DO USUÁRIO PARA PREMIUM!
      const userDoc = snapshot.docs[0];
      await userDoc.ref.update({ plano: 'premium' });

      console.log(`SUCESSO: Usuário ${email} atualizado para o plano Premium.`);
      return response.status(200).json({ message: 'Plano do usuário atualizado com sucesso.' });
    } else {
      // Se o status não for "paid" (ex: "canceled", "refunded"), apenas registramos e ignoramos.
      console.log(`Webhook ignorado com status: ${status}`);
      return response.status(200).json({ message: 'Webhook recebido, mas ignorado.' });
    }

  } catch (error) {
    console.error('ERRO GERAL NO WEBHOOK:', error);
    return response.status(500).json({ error: 'Erro interno do servidor.' });
  }
}