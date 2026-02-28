const twilio = require('twilio');

async function makeSybilVoiceCall(to) {
    // Credentials from environment variables
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const voiceUrl = process.env.VOICE_WEBHOOK_URL || 'https://your-server.com/voice';
    const from = process.env.TWILIO_PHONE_NUMBER;
    
    if (!accountSid || !authToken || !from) {
        console.error('❌ Missing Twilio credentials. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER');
        return;
    }
    
    const client = twilio(accountSid, authToken);

    try {
        console.log(`📞 Iniciando llamada VULKN vía SYBIL a ${to}...`);
        
        const call = await client.calls.create({
            url: voiceUrl,
            to: to,
            from: from
        });

        console.log(`✅ Llamada lanzada. SID: ${call.sid}`);
        return call.sid;
    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    }
}

// Export for use as module
module.exports = { makeSybilVoiceCall };

// CLI usage
if (require.main === module) {
    const to = process.argv[2];
    if (!to) {
        console.log('Usage: node sybil-call.js +1234567890');
        process.exit(1);
    }
    makeSybilVoiceCall(to);
}
