#!/usr/bin/env node
/**
 * Query interface for SMB CRM
 * Main tool for agent to answer customer questions
 */

const {
  listCustomers,
  getDeudores,
  getTopCustomers,
  getInactiveCustomers,
  searchCustomers,
  getRecentPurchases
} = require('../lib/supabase');

function formatMoney(amount) {
  if (!amount) return '$0';
  return `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
}

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('es-MX');
}

function printCustomers(customers, title) {
  console.log(`\n${title} (${customers.length})`);
  console.log('='.repeat(60));
  
  if (customers.length === 0) {
    console.log('No hay resultados.');
    return;
  }
  
  customers.forEach((c, i) => {
    console.log(`${i + 1}. ${c.nombre}`);
    if (c.telefono) console.log(`   Tel: ${c.telefono}`);
    if (c.saldo_pendiente > 0) console.log(`   Debe: ${formatMoney(c.saldo_pendiente)}`);
    if (c.total_ventas > 0) console.log(`   Total ventas: ${formatMoney(c.total_ventas)}`);
    if (c.ultima_compra) console.log(`   Última compra: ${formatDate(c.ultima_compra)}`);
    if (c.notas) console.log(`   Notas: ${c.notas}`);
    console.log('');
  });
}

function printSummary(customers) {
  const total = customers.length;
  const withPhone = customers.filter(c => c.telefono).length;
  const withDebt = customers.filter(c => c.saldo_pendiente > 0).length;
  const totalDebt = customers.reduce((sum, c) => sum + (c.saldo_pendiente || 0), 0);
  const totalSales = customers.reduce((sum, c) => sum + (c.total_ventas || 0), 0);
  
  console.log('\n📊 Resumen');
  console.log('='.repeat(40));
  console.log(`Total clientes: ${total}`);
  console.log(`Con teléfono: ${withPhone} (${Math.round(withPhone/total*100)}%)`);
  console.log(`Con saldo pendiente: ${withDebt}`);
  console.log(`Total adeudado: ${formatMoney(totalDebt)}`);
  console.log(`Total ventas históricas: ${formatMoney(totalSales)}`);
}

async function run(command, arg) {
  switch (command) {
    case 'list':
    case 'todos':
      const all = await listCustomers({ limit: parseInt(arg) || 50 });
      printCustomers(all, '📋 Todos los Clientes');
      printSummary(all);
      break;
      
    case 'deudores':
    case 'deben':
    case 'owed':
      const deudores = await getDeudores();
      printCustomers(deudores, '💰 Clientes que Deben');
      if (deudores.length > 0) {
        const totalOwed = deudores.reduce((sum, c) => sum + c.saldo_pendiente, 0);
        console.log(`\n💵 Total adeudado: ${formatMoney(totalOwed)}`);
      }
      break;
      
    case 'top':
    case 'mejores':
    case 'best':
      const top = await getTopCustomers(parseInt(arg) || 10);
      printCustomers(top, '⭐ Mejores Clientes (por ventas)');
      break;
      
    case 'inactivos':
    case 'inactive':
      const days = parseInt(arg) || 90;
      const inactive = await getInactiveCustomers(days);
      printCustomers(inactive, `😴 Clientes Inactivos (>${days} días)`);
      break;
      
    case 'search':
    case 'buscar':
      if (!arg) {
        console.log('Uso: query.js search <término>');
        return;
      }
      const results = await searchCustomers(arg);
      printCustomers(results, `🔍 Búsqueda: "${arg}"`);
      break;
      
    case 'recientes':
    case 'recent':
      const recentDays = parseInt(arg) || 30;
      const recent = await getRecentPurchases(recentDays);
      printCustomers(recent, `🕐 Compras Recientes (últimos ${recentDays} días)`);
      break;
      
    case 'stats':
    case 'estadisticas':
      const allForStats = await listCustomers({ limit: 10000 });
      printSummary(allForStats);
      break;
      
    default:
      console.log('SMB CRM Query Tool');
      console.log('==================\n');
      console.log('Comandos:');
      console.log('  list [n]         - Listar todos (máx n)');
      console.log('  deudores         - ¿Quién me debe dinero?');
      console.log('  top [n]          - Mejores clientes por ventas');
      console.log('  inactivos [días] - Clientes sin compras recientes');
      console.log('  search <texto>   - Buscar por nombre/teléfono/email');
      console.log('  recientes [días] - Compras en últimos N días');
      console.log('  stats            - Estadísticas generales');
      console.log('\nEjemplos:');
      console.log('  query.js deudores');
      console.log('  query.js search "García"');
      console.log('  query.js inactivos 60');
  }
}

// CLI
const args = process.argv.slice(2);
run(args[0], args[1]).catch(err => {
  console.error('Query failed:', err.message);
  process.exit(1);
});
