const twilio = require('twilio');

async function makeOutboundCall(to, initialMessage) {
    const accountSid = 'process.env.TWILIO_ACCOUNT_SID';
    const authToken = 'process.env.TWILIO_AUTH_TOKEN';
    const gatewayToken = 'ba7813c2aece66b6f7757d3f84eb85c43da163208512a49ba34692485541d316';
    const from = '+15855222431';
    
    const client = twilio(accountSid, authToken);

    try {
        console.log(`📞 Iniciando llamada con bypass de seguridad a ${to}...`);
        
        const call = await client.calls.create({
            twiml: `<Response>
                      <Say voice="Polly.Mia">${initialMessage}</Say>
                      <Connect>
                        <Stream url="wss://sam-fresh-production.up.railway.app/voice-stream?token=${gatewayToken}" />
                      </Connect>
                    </Response>`,
            to: to,
            from: from
        });

        console.log(`✅ Llamada autorizada enviada. SID: ${call.sid}`);
        return call.sid;
    } catch (error) {
        console.error('❌ Error al iniciar la llamada:', error.message);
        throw error;
    }
}

const to = process.argv[2] || '+525535904118';
const msg = process.argv[3] || 'Hola Johan, ya inyecté la llave de seguridad. Ahora el canal debería estar abierto para que hablemos. ¿Me recibes bien?';

makeOutboundCall(to, msg);
