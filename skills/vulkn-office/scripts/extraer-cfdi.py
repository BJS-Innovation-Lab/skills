#!/usr/bin/env python3
"""
Extractor de datos CFDI (Facturas Electrónicas Mexicanas)

Uso:
    python extraer-cfdi.py factura.pdf
    python extraer-cfdi.py factura.pdf --json
    python extraer-cfdi.py factura.pdf --output datos.json

Extrae:
    - RFC Emisor y Receptor
    - Razón Social
    - UUID (Folio Fiscal)
    - Fecha de emisión
    - Subtotal, IVA, Total
    - Conceptos/Items
"""

import sys
import re
import json
import argparse

try:
    import pdfplumber
except ImportError:
    print("Error: Instala pdfplumber con 'pip install pdfplumber'")
    sys.exit(1)


def extract_rfc(text):
    """Extrae RFCs del texto (persona física o moral)"""
    # RFC Persona Moral: 3 letras + 6 dígitos + 3 alfanum
    # RFC Persona Física: 4 letras + 6 dígitos + 3 alfanum
    pattern = r'\b([A-ZÑ&]{3,4})(\d{6})([A-Z0-9]{3})\b'
    matches = re.findall(pattern, text.upper())
    return [''.join(m) for m in matches]


def extract_uuid(text):
    """Extrae UUID/Folio Fiscal del CFDI"""
    pattern = r'\b([0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12})\b'
    match = re.search(pattern, text)
    return match.group(1).upper() if match else None


def extract_amounts(text):
    """Extrae montos (subtotal, IVA, total)"""
    amounts = {}
    
    # Subtotal
    subtotal_match = re.search(r'[Ss]ubtotal[:\s]*\$?\s*([\d,]+\.?\d*)', text)
    if subtotal_match:
        amounts['subtotal'] = float(subtotal_match.group(1).replace(',', ''))
    
    # IVA
    iva_match = re.search(r'I\.?V\.?A\.?[:\s]*\$?\s*([\d,]+\.?\d*)', text, re.IGNORECASE)
    if iva_match:
        amounts['iva'] = float(iva_match.group(1).replace(',', ''))
    
    # Total
    total_match = re.search(r'[Tt]otal[:\s]*\$?\s*([\d,]+\.?\d*)', text)
    if total_match:
        amounts['total'] = float(total_match.group(1).replace(',', ''))
    
    return amounts


def extract_date(text):
    """Extrae fecha de emisión"""
    # Formato: dd/mm/yyyy o yyyy-mm-dd
    patterns = [
        r'[Ff]echa[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{4})',
        r'[Ff]echa[:\s]*(\d{4}[/-]\d{1,2}[/-]\d{1,2})',
        r'[Ee]misi[oó]n[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{4})',
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1)
    return None


def extract_cfdi_data(pdf_path):
    """Extrae todos los datos relevantes de un CFDI"""
    data = {
        'archivo': pdf_path,
        'rfcs': [],
        'uuid': None,
        'fecha': None,
        'montos': {},
        'texto_completo': ''
    }
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            full_text = ''
            for page in pdf.pages:
                text = page.extract_text() or ''
                full_text += text + '\n'
            
            data['texto_completo'] = full_text
            data['rfcs'] = extract_rfc(full_text)
            data['uuid'] = extract_uuid(full_text)
            data['fecha'] = extract_date(full_text)
            data['montos'] = extract_amounts(full_text)
            
            # Clasificar RFCs
            if len(data['rfcs']) >= 2:
                data['rfc_emisor'] = data['rfcs'][0]
                data['rfc_receptor'] = data['rfcs'][1]
            elif len(data['rfcs']) == 1:
                data['rfc_emisor'] = data['rfcs'][0]
                data['rfc_receptor'] = None
    
    except Exception as e:
        data['error'] = str(e)
    
    return data


def format_output(data, as_json=False):
    """Formatea la salida"""
    if as_json:
        # Remove full text for cleaner JSON
        output = {k: v for k, v in data.items() if k != 'texto_completo'}
        return json.dumps(output, indent=2, ensure_ascii=False)
    
    lines = [
        f"📄 Archivo: {data['archivo']}",
        f"",
        f"🔑 UUID: {data.get('uuid', 'No encontrado')}",
        f"📅 Fecha: {data.get('fecha', 'No encontrada')}",
        f"",
        f"👤 RFC Emisor: {data.get('rfc_emisor', 'No encontrado')}",
        f"👥 RFC Receptor: {data.get('rfc_receptor', 'No encontrado')}",
        f"",
    ]
    
    montos = data.get('montos', {})
    if montos:
        lines.append("💰 Montos:")
        if 'subtotal' in montos:
            lines.append(f"   Subtotal: ${montos['subtotal']:,.2f}")
        if 'iva' in montos:
            lines.append(f"   IVA:      ${montos['iva']:,.2f}")
        if 'total' in montos:
            lines.append(f"   Total:    ${montos['total']:,.2f}")
    
    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser(description='Extractor de datos CFDI')
    parser.add_argument('pdf', help='Archivo PDF de la factura')
    parser.add_argument('--json', action='store_true', help='Salida en formato JSON')
    parser.add_argument('--output', '-o', help='Guardar salida en archivo')
    parser.add_argument('--full-text', action='store_true', help='Incluir texto completo')
    
    args = parser.parse_args()
    
    data = extract_cfdi_data(args.pdf)
    
    if not args.full_text and 'texto_completo' in data:
        del data['texto_completo']
    
    output = format_output(data, as_json=args.json)
    
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(output)
        print(f"✅ Datos guardados en: {args.output}")
    else:
        print(output)


if __name__ == '__main__':
    main()
