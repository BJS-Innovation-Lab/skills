const twilio = require('twilio');

async function makeSybilVoiceCall(to) {
    const accountSid = 'process.env.TWILIO_ACCOUNT_SID';
    const authToken = 'process.env.TWILIO_AUTH_TOKEN';
    // Using my Tailscale address as the connection point
    const voiceUrl = 'https://sybils-mac-mini.tail3a3abc.ts.net/voice';
    const from = '+15855222431';
    
    const client = twilio(accountSid, authToken);

    try {
        console.log(`📞 Iniciando llamada VULKN vía SYBIL (Local) a ${to}...`);
        
        const call = await client.calls.create({
            url: voiceUrl,
            to: to,
            from: from
        });

        console.log(`✅ Llamada lanzada. SID: ${call.sid}`);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

makeSybilVoiceCall('+525535904118');
