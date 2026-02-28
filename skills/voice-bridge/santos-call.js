const twilio = require('twilio');

async function makeSantosVoiceCall(to) {
    const accountSid = 'process.env.TWILIO_ACCOUNT_SID';
    const authToken = 'process.env.TWILIO_AUTH_TOKEN';
    const gatewayToken = 'ba7813c2aece66b6f7757d3f84eb85c43da163208512a49ba34692485541d316';
    const from = '+15855222431';
    
    const client = twilio(accountSid, authToken);

    try {
        console.log(`📞 Iniciando llamada VULKN vía SANTOS a ${to}...`);
        
        const call = await client.calls.create({
            twiml: `<Response>
                      <Connect>
                        <Stream url="wss://santos-vulkn-production.up.railway.app/voice-stream?token=${gatewayToken}" />
                      </Connect>
                      <Pause length="30"/>
                    </Response>`,
            to: to,
            from: from
        });

        console.log(`✅ Llamada lanzada vía Santos. SID: ${call.sid}`);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

makeSantosVoiceCall('+525535904118');
