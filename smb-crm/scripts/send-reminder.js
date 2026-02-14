#!/usr/bin/env node
/**
 * Invoice Reminder - Send payment reminders via WhatsApp or Email
 * 
 * FLEXIBLE MESSAGING: Templates are samples. Agent should customize
 * based on customer relationship, amount, and business context.
 * See: references/reminder-guidelines.md
 * 
 * Usage:
 *   node send-reminder.js --list                     # List deudores
 *   node send-reminder.js --to "Juan García" --whatsapp
 *   node send-reminder.js --to "Juan García" --whatsapp --message "Custom message here"
 *   node send-reminder.js --to "Juan García" --both
 *   node send-reminder.js --all --whatsapp --dry-run # Preview all
 */

const { execSync } = require('child_process');
const { getDeudores, searchCustomers, updateCustomer } = require('../lib/supabase');

// Default message templates (Spanish) - SAMPLES, agent should customize!
// See: references/reminder-guidelines.md
const TEMPLATES = {
  whatsapp: {
    // Stage 1: Friendly (3-7 days)
    1: `Hola {nombre}! 👋

Recordatorio: tienes un saldo de {saldo} con {business}.

¿Ya lo cubriste? Ignora este mensaje.
¿Dudas? Responde aquí.

¡Gracias! 🙏`,
    // Stage 2: Professional (14-21 days)
    2: `{nombre}, tu saldo de {saldo} con {business} está pendiente.

Queremos ayudarte a resolverlo. ¿Necesitas opciones de pago?

Escríbenos para encontrar una solución.`,
    // Stage 3: Urgent (30+ days)
    3: `{nombre}, tu saldo de {saldo} requiere atención pronta.

Contáctanos hoy para evitar interrupción de servicio.

Queremos seguir atendiéndote. 🙏`
  },
  email: {
    subject: {
      1: 'Recordatorio amigable - {business}',
      2: 'Saldo pendiente - {business}',
      3: 'Acción requerida: Saldo pendiente - {business}'
    },
    body: {
      1: `Hola {nombre},

Te recordamos que tienes un saldo de {saldo} con {business}.

Si ya lo cubriste, ignora este mensaje.

¿Dudas? Responde a este correo.

¡Gracias!
{business}`,
      2: `{nombre},

Tu saldo de {saldo} está pendiente desde {ultima_compra}.

Queremos ayudarte a resolverlo. ¿Necesitas opciones de pago?

Responde a este correo y encontramos una solución.

Saludos,
{business}`,
      3: `{nombre},

Tu saldo de {saldo} con {business} requiere atención pronta.

Por favor contáctanos hoy para evitar interrupción de servicio.

Queremos seguir atendiéndote.

{business}`
    }
  }
};

function formatMoney(amount) {
  if (typeof amount === 'string' && amount.includes('{')) return amount; // Template placeholder
  const num = parseFloat(amount) || 0;
  return `$${num.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
}

function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('es-MX');
}

function fillTemplate(template, customer, businessName) {
  return template
    .replace(/{nombre}/g, customer.nombre || 'Cliente')
    .replace(/{saldo}/g, customer.saldo_pendiente || 0)
    .replace(/{business}/g, businessName)
    .replace(/{ultima_compra}/g, formatDate(customer.ultima_compra))
    .replace(/\$\{formatMoney\('\{saldo\}'\)\}/g, formatMoney(customer.saldo_pendiente));
}

function sendWhatsApp(phone, message) {
  if (!phone) throw new Error('No phone number');
  
  // Clean phone number - remove spaces, dashes, etc
  let cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // Remove leading + if present
  cleanPhone = cleanPhone.replace(/^\+/, '');
  
  // Smart country code detection:
  // - If starts with 1 and is 11 digits: US/Canada (keep as is)
  // - If starts with 52 and is 12 digits: Mexico (keep as is)
  // - If 10 digits: assume Mexico, add 52
  // - Otherwise: keep as is
  if (cleanPhone.length === 10 && !cleanPhone.startsWith('1')) {
    cleanPhone = '52' + cleanPhone; // Mexico local number
  }
  
  const jid = `${cleanPhone}@s.whatsapp.net`;
  
  const cmd = `wacli send text --to "${jid}" --message "${message.replace(/"/g, '\\"')}"`;
  const result = execSync(cmd, { encoding: 'utf-8' });
  return { ok: true, jid, result: result.trim() };
}

function sendEmail(email, subject, body) {
  if (!email) throw new Error('No email address');
  
  // Use gog gmail send
  const cmd = `gog gmail send --to "${email}" --subject "${subject.replace(/"/g, '\\"')}" --body "${body.replace(/"/g, '\\"')}" --json`;
  
  try {
    const result = execSync(cmd, { encoding: 'utf-8' });
    return { ok: true, email, result: JSON.parse(result) };
  } catch (error) {
    return { ok: false, email, error: error.message };
  }
}

async function sendReminder(customer, options) {
  const { whatsapp, email, businessName, dryRun, customMessage, stage = 1 } = options;
  const results = { customer: customer.nombre, sent: [] };
  
  if (whatsapp && customer.telefono) {
    // Use custom message if provided, otherwise use staged template
    const templateBody = customMessage || TEMPLATES.whatsapp[stage] || TEMPLATES.whatsapp[1];
    const message = fillTemplate(templateBody, customer, businessName);
    
    if (dryRun) {
      results.sent.push({ channel: 'whatsapp', to: customer.telefono, preview: message.slice(0, 100) + '...' });
    } else {
      try {
        const wa = sendWhatsApp(customer.telefono, message);
        results.sent.push({ channel: 'whatsapp', to: customer.telefono, ok: true });
      } catch (err) {
        results.sent.push({ channel: 'whatsapp', to: customer.telefono, ok: false, error: err.message });
      }
    }
  }
  
  if (email && customer.email) {
    const subjectTemplate = TEMPLATES.email.subject[stage] || TEMPLATES.email.subject[1];
    const bodyTemplate = customMessage || TEMPLATES.email.body[stage] || TEMPLATES.email.body[1];
    const subject = fillTemplate(subjectTemplate, customer, businessName);
    const body = fillTemplate(bodyTemplate, customer, businessName);
    
    if (dryRun) {
      results.sent.push({ channel: 'email', to: customer.email, preview: subject });
    } else {
      try {
        const em = sendEmail(customer.email, subject, body);
        results.sent.push({ channel: 'email', to: customer.email, ok: em.ok });
      } catch (err) {
        results.sent.push({ channel: 'email', to: customer.email, ok: false, error: err.message });
      }
    }
  }
  
  // Log reminder in customer notes
  if (!dryRun && results.sent.some(s => s.ok !== false)) {
    const now = new Date().toISOString().split('T')[0];
    const channels = results.sent.filter(s => s.ok !== false).map(s => s.channel).join('+');
    const newNote = `[${now}] Recordatorio enviado (${channels})`;
    const updatedNotes = customer.notas 
      ? `${customer.notas}\n${newNote}`
      : newNote;
    
    try {
      await updateCustomer(customer.id, { notas: updatedNotes });
      results.logged = true;
    } catch (err) {
      results.logged = false;
    }
  }
  
  return results;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    businessName: process.env.BUSINESS_NAME || 'Tu Negocio'
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--list':
        options.list = true;
        break;
      case '--to':
        options.to = args[++i];
        break;
      case '--all':
        options.all = true;
        break;
      case '--whatsapp':
      case '-w':
        options.whatsapp = true;
        break;
      case '--email':
      case '-e':
        options.email = true;
        break;
      case '--both':
        options.whatsapp = true;
        options.email = true;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--business':
        options.businessName = args[++i];
        break;
      case '--min-amount':
        options.minAmount = parseFloat(args[++i]);
        break;
      case '--message':
      case '-m':
        options.customMessage = args[++i];
        break;
      case '--stage':
        options.stage = parseInt(args[++i], 10); // 1=friendly, 2=professional, 3=urgent
        break;
      case '--help':
      case '-h':
        console.log(`
Invoice Reminder - Send payment reminders

Usage:
  node send-reminder.js [options]

Options:
  --list              List all deudores (customers with balance)
  --to <name>         Send to specific customer (by name)
  --all               Send to all deudores
  --whatsapp, -w      Send via WhatsApp
  --email, -e         Send via Email  
  --both              Send via both channels
  --message, -m       Custom message (use {nombre}, {saldo}, {business})
  --stage <1-3>       Template stage: 1=friendly, 2=professional, 3=urgent
  --dry-run           Preview without sending
  --business <name>   Business name for templates
  --min-amount <n>    Only customers with balance >= n

Examples:
  node send-reminder.js --list
  node send-reminder.js --to "Juan García" --whatsapp
  node send-reminder.js --to "Juan" -w -m "Hola {nombre}, ¿todo bien? Tu saldo es {saldo}"
  node send-reminder.js --to "Juan García" --both --stage 2
  node send-reminder.js --all --whatsapp --min-amount 500 --dry-run

See: references/reminder-guidelines.md for best practices
`);
        process.exit(0);
    }
  }
  
  return options;
}

async function main() {
  const options = parseArgs();
  
  // List mode
  if (options.list) {
    const deudores = await getDeudores();
    console.log(`\n📋 Deudores (${deudores.length} customers with balance):\n`);
    
    for (const d of deudores) {
      const phone = d.telefono ? '📱' : '  ';
      const email = d.email ? '📧' : '  ';
      console.log(`${phone}${email} ${d.nombre.padEnd(25)} ${formatMoney(d.saldo_pendiente).padStart(12)}`);
    }
    
    const total = deudores.reduce((sum, d) => sum + (parseFloat(d.saldo_pendiente) || 0), 0);
    console.log(`\n   Total pendiente: ${formatMoney(total)}`);
    console.log(`\n📱 = has phone, 📧 = has email`);
    return;
  }
  
  // Need at least one channel
  if (!options.whatsapp && !options.email) {
    console.error('Error: Specify --whatsapp, --email, or --both');
    process.exit(1);
  }
  
  // Get customers to remind
  let customers = [];
  
  if (options.to) {
    customers = await searchCustomers(options.to);
    customers = customers.filter(c => c.saldo_pendiente > 0);
    if (customers.length === 0) {
      console.error(`No deudor found matching "${options.to}"`);
      process.exit(1);
    }
  } else if (options.all) {
    customers = await getDeudores();
  } else {
    console.error('Error: Specify --to <name> or --all');
    process.exit(1);
  }
  
  // Filter by min amount
  if (options.minAmount) {
    customers = customers.filter(c => c.saldo_pendiente >= options.minAmount);
  }
  
  if (customers.length === 0) {
    console.log('No customers to remind.');
    return;
  }
  
  console.log(`\n${options.dryRun ? '🔍 DRY RUN - ' : ''}Sending reminders to ${customers.length} customer(s)...\n`);
  
  // Send reminders
  const results = [];
  for (const customer of customers) {
    const result = await sendReminder(customer, options);
    results.push(result);
    
    // Print result
    const status = result.sent.map(s => {
      if (options.dryRun) return `${s.channel}: ${s.to}`;
      return s.ok !== false ? `✅ ${s.channel}` : `❌ ${s.channel}: ${s.error}`;
    }).join(', ');
    
    console.log(`${result.customer}: ${status}`);
  }
  
  // Summary
  const sent = results.flatMap(r => r.sent).filter(s => s.ok !== false);
  console.log(`\n📊 Summary: ${sent.length} reminder(s) ${options.dryRun ? 'would be ' : ''}sent`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
