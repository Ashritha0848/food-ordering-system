
/* ==================================
   SINGLETON PATTERN
   One shared FoodOrderManager
================================== */

class FoodOrderManager {
    static instance = null;

    constructor() {
        if (FoodOrderManager.instance) {
            return FoodOrderManager.instance;
        }

        this.menu = [
            { id: 1, name: "Burger", price: 120, image: "🍔" },
            { id: 2, name: "Pizza", price: 250, image: "🍕" },
            { id: 3, name: "Biryani", price: 180, image: "🍛" },
            { id: 4, name: "Sandwich", price: 90, image: "🥪" },
            { id: 5, name: "French Fries", price: 80, image: "🍟" },
            { id: 6, name: "Ice Cream", price: 60, image: "🍨" }
        ];

        this.cart = [];
        this.orders = [];

        FoodOrderManager.instance = this;
    }

    static getInstance() {
        if (!FoodOrderManager.instance) {
            new FoodOrderManager();
        }

        return FoodOrderManager.instance;
    }

    addItem(id) {
        const food = this.menu.find(item => item.id === id);

        if (!food) return;

        const existing = this.cart.find(item => item.id === id);

        if (existing) {
            existing.quantity++;
        } else {
            this.cart.push({ ...food, quantity: 1 });
        }

        renderCart();
    }

    removeItem(id) {
        const index = this.cart.findIndex(item => item.id === id);

        if (index === -1) return;

        if (this.cart[index].quantity > 1) {
            this.cart[index].quantity--;
        } else {
            this.cart.splice(index, 1);
        }

        renderCart();
    }

    getTotal() {
        return this.cart.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );
    }

    placeOrder(paymentMethod) {
        if (this.cart.length === 0) {
            throw new Error("Your cart is empty!");
        }

        const payment = new PaymentAdapter(paymentMethod);
        const total = this.getTotal();
        const paymentResult = payment.pay(total);

        const order = {
            id: Date.now(),
            items: this.cart.map(item => ({ ...item })),
            total: total,
            payment: paymentResult
        };

        this.orders.push(order);
        this.cart = [];

        return order;
    }
}


/* ==================================
   ADAPTER PATTERN
   Common interface for payments
================================== */

// Different payment providers

class UPIPayment {
    pay(amount) {
        return `UPI payment of ₹${amount} initiated`;
    }
}

class CardPayment {
    pay(amount) {
        return `Card payment of ₹${amount} initiated`;
    }
}

class CashPayment {
    pay(amount) {
        return `Cash on delivery: ₹${amount}`;
    }
}

// Adapter makes every payment method
// work through the same pay() interface.

class PaymentAdapter {
    constructor(method) {
        switch (method) {
            case "upi":
                this.payment = new UPIPayment();
                break;

            case "card":
                this.payment = new CardPayment();
                break;

            case "cash":
                this.payment = new CashPayment();
                break;

            default:
                throw new Error("Invalid payment method");
        }
    }

    pay(amount) {
        return this.payment.pay(amount);
    }
}


/* ==================================
   COMMAND PATTERN
   Encapsulate user actions
================================== */

class AddToCartCommand {
    constructor(manager, foodId) {
        this.manager = manager;
        this.foodId = foodId;
    }

    execute() {
        this.manager.addItem(this.foodId);
    }
}

class RemoveFromCartCommand {
    constructor(manager, foodId) {
        this.manager = manager;
        this.foodId = foodId;
    }

    execute() {
        this.manager.removeItem(this.foodId);
    }
}

class PlaceOrderCommand {
    constructor(manager, paymentMethod) {
        this.manager = manager;
        this.paymentMethod = paymentMethod;
    }

    execute() {
        return this.manager.placeOrder(this.paymentMethod);
    }
}


/* ==================================
   USER INTERFACE
================================== */

const manager = FoodOrderManager.getInstance();

function renderMenu() {
    const menuElement = document.getElementById("food-menu");

    menuElement.innerHTML = manager.menu.map(food => `
        <div class="food-card">
            <div class="food-image">${food.image}</div>
            <h3>${food.name}</h3>
            <p class="price">₹${food.price}</p>
            <button class="add-button"
                data-food-id="${food.id}">
                Add to Cart
            </button>
        </div>
    `).join("");
}

function renderCart() {
    const cartElement = document.getElementById("cart-items");

    document.getElementById("cart-count").textContent =
        manager.cart.reduce((sum, item) => sum + item.quantity, 0);

    document.getElementById("total").textContent =
        manager.getTotal();

    if (manager.cart.length === 0) {
        cartElement.textContent = "Your cart is empty.";
        return;
    }

    cartElement.innerHTML = manager.cart.map(item => `
        <div class="cart-item">
            <span>
                ${item.name} × ${item.quantity}
                — ₹${item.price * item.quantity}
            </span>

            <button data-remove-id="${item.id}"
                aria-label="Remove one ${item.name}">
                − Remove
            </button>
        </div>
    `).join("");
}

// Add item using Command pattern
document.getElementById("food-menu").addEventListener("click", event => {
    const button = event.target.closest("[data-food-id]");

    if (!button) return;

    const command = new AddToCartCommand(
        manager,
        Number(button.dataset.foodId)
    );

    command.execute();
    showMessage("");
});

// Remove item using Command pattern
document.getElementById("cart-items").addEventListener("click", event => {
    const button = event.target.closest("[data-remove-id]");

    if (!button) return;

    const command = new RemoveFromCartCommand(
        manager,
        Number(button.dataset.removeId)
    );

    command.execute();
    showMessage("");
});

// Place order using Command pattern
document.getElementById("place-order").addEventListener("click", () => {
    try {
        const method = document.getElementById("payment-method").value;

        const command = new PlaceOrderCommand(manager, method);
        const order = command.execute();

        showMessage(
            `Order #${order.id} placed! Total: ₹${order.total}. ` +
            order.payment
        );
    } catch (error) {
        showMessage(error.message);
    }
});

function showMessage(message) {
    document.getElementById("message").textContent = message;
}

function scrollToCart() {
    document.getElementById("cart-section").scrollIntoView({
        behavior: "smooth"
    });
}

// Initialize application
renderMenu();
renderCart();
