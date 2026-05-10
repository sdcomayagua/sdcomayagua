class POSManager {
    constructor() {
        this.cart = [];
        this.shippingType = 'normal';
    }

    // Calcula el desglose financiero exacto
    calculateTotals() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        let shipping = 0;
        let commission = 0;

        if (this.shippingType === 'normal') {
            shipping = CONFIG.shipping.normal;
        } else if (this.shippingType === 'cod') {
            shipping = CONFIG.shipping.codBase;
            // Regla: La comisión se calcula sobre subtotal + envío base
            const baseForCommission = subtotal + shipping;
            // Regla: Redondear a Lempiras enteros, sin centavos
            commission = Math.round(baseForCommission * CONFIG.shipping.codCommissionRate);
        }

        const totalFinal = subtotal + shipping + commission;

        return { subtotal, shipping, commission, totalFinal };
    }

    // Convertir cotización a venta (Regla de Stock)
    convertQuoteToSale(quoteId) {
        const quote = state.getInvoice(quoteId);
        if (!quote || quote.status !== 'Cotización') return;

        // Validar stock antes de convertir
        const canFulfill = quote.items.every(item => {
            const product = state.getProduct(item.id);
            return product && product.stock >= item.quantity;
        });

        if (!canFulfill) {
            alert("Error: No hay stock suficiente para procesar esta venta.");
            return false;
        }

        // Reducir stock
        quote.items.forEach(item => {
            state.updateProductStock(item.id, -item.quantity); // Resta
        });

        quote.status = 'Venta';
        state.saveInvoice(quote);
        return true;
    }
}

const pos = new POSManager();