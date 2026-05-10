class InvoiceManager {
    
    // Genera el mensaje de WhatsApp ordenado
    generateWhatsAppLink(invoice) {
        let msg = `Hola! Gracias por preferir ${CONFIG.shortName}.\n`;
        msg += `Aquí está el resumen de su ${invoice.status.toUpperCase()} #${invoice.id}:\n\n`;
        
        invoice.items.forEach(item => {
            msg += `▫️ ${item.quantity}x ${item.name} - ${CONFIG.currency} ${item.price * item.quantity}\n`;
        });

        msg += `\nSubtotal: ${CONFIG.currency} ${invoice.totals.subtotal}\n`;
        msg += `Envío: ${CONFIG.currency} ${invoice.totals.shipping}\n`;
        if (invoice.totals.commission > 0) {
            msg += `Comisión (Pagar al Recibir): ${CONFIG.currency} ${invoice.totals.commission}\n`;
        }
        msg += `*TOTAL FINAL: ${CONFIG.currency} ${invoice.totals.totalFinal}*\n\n`;
        msg += `Precios sujetos a disponibilidad.\nEnvíos por C807, Forza y Cargo Expreso.`;

        const encodedMsg = encodeURIComponent(msg);
        return `https://wa.me/${CONFIG.whatsapp}?text=${encodedMsg}`;
    }

    // Exporta el contenedor secreto a PNG en alta calidad
    async exportToPNG(invoiceData) {
        const container = document.getElementById('invoice-export-container');
        // 1. Inyectar HTML dinámico en el contenedor (1080px de ancho fijo en CSS)
        container.innerHTML = this.buildInvoiceHTML(invoiceData);
        
        // 2. Usar html2canvas para tomar la "foto"
        try {
            const canvas = await html2canvas(container, {
                scale: 2, // Aumenta la densidad de píxeles para que no se vea "chiquita"
                useCORS: true,
                backgroundColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#0b1120' : '#ffffff'
            });

            // 3. Descargar la imagen
            const link = document.createElement('a');
            link.download = `Factura_${invoiceData.id}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error("Error al generar PNG", error);
            alert("Hubo un error al generar la imagen.");
        }
    }

    buildInvoiceHTML(invoice) {
        // Retorna el HTML con la estructura: Logo, Cliente, Tabla dinámica
        // Al estar en un contenedor de 1080px, la altura crecerá sola según los items.
        return `
            <div class="invoice-header">
                <div>
                    <h1>${CONFIG.shortName}</h1>
                    <p>WhatsApp: ${CONFIG.whatsapp}</p>
                </div>
                <div style="text-align: right;">
                    <h2>${invoice.status.toUpperCase()}</h2>
                    <p>No. ${invoice.id}</p>
                    <p>Fecha: ${new Date().toLocaleDateString()}</p>
                </div>
            </div>
            `;
    }
}