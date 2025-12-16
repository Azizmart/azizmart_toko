// Shared API configuration
const API_CONFIG = {
    URL: "https://script.google.com/macros/s/AKfycby0bfdSEUYzr6P_eE7BtyhqoIHLyooRf71TiQZwDD4UtSmZAwepxsrrRQF2pNzsmFZrEg/exec",
    
    // Fetch products
    async getProducts() {
        try {
            const response = await fetch(this.URL);
            const data = await response.json();
            
            if (data.success) {
                return data.data || [];
            }
            throw new Error(data.error || 'Failed to fetch products');
            
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    // Create order (simulate)
    async createOrder(orderData) {
        // In a real app, you would POST to Google Sheets
        // For now, simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    orderId: 'ORD-' + Date.now(),
                    message: 'Order created successfully'
                });
            }, 1000);
        });
    }
};