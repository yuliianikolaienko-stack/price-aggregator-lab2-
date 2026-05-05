const searchButton = document.getElementById("searchButton");
const allButton = document.getElementById("allButton");
const searchInput = document.getElementById("searchInput");
const resultsDiv = document.getElementById("results");
const messageDiv = document.getElementById("message");
const summaryCard = document.getElementById("summaryCard");
const resultsCount = document.getElementById("resultsCount");

const addProductForm = document.getElementById("addProductForm");
const newName = document.getElementById("newName");
const newMarket = document.getElementById("newMarket");
const newPrice = document.getElementById("newPrice");
const newCategory = document.getElementById("newCategory");
const newAddress = document.getElementById("newAddress");

const tagButtons = document.querySelectorAll(".tag-btn");

function formatPrice(value) {
    return `${Number(value).toFixed(2)} грн`;
}

function buildMapLink(supermarket, address) {
    const query = encodeURIComponent(`${supermarket}, ${address}, Харків`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function getProductEmoji(name) {
    const normalized = name.toLowerCase();

    if (normalized.includes("молоко")) return "🥛";
    if (normalized.includes("хліб")) return "🍞";
    if (normalized.includes("яйця")) return "🥚";
    if (normalized.includes("яблука")) return "🍎";
    if (normalized.includes("сир")) return "🧀";
    if (normalized.includes("гречка")) return "🌾";
    if (normalized.includes("куряче філе")) return "🍗";
    if (normalized.includes("масло")) return "🧈";

    return "🛒";
}

function getCategoryEmoji(category) {
    const normalized = category.toLowerCase();

    if (normalized.includes("молоч")) return "🥛";
    if (normalized.includes("хліб")) return "🍞";
    if (normalized.includes("фрукт")) return "🍎";
    if (normalized.includes("круп")) return "🌾";
    if (normalized.includes("м'яс")) return "🍗";

    return "📦";
}

function renderSummary(data, productName = "") {
    if (!data || data.length === 0) {
        summaryCard.className = "summary-card empty-summary";
        summaryCard.innerHTML = "Після пошуку тут з’явиться короткий підсумок із найвигіднішою ціною.";
        return;
    }

    const cheapest = data[0];
    const mostExpensive = data[data.length - 1];
    const difference = (mostExpensive.price - cheapest.price).toFixed(2);
    const emoji = getProductEmoji(cheapest.name);

    summaryCard.className = "summary-card";
    summaryCard.innerHTML = `
        <div class="summary-title">${emoji} Найкраща пропозиція</div>
        <p><strong>Товар:</strong> ${productName || cheapest.name}</p>
        <p><strong>Супермаркет:</strong> ${cheapest.supermarket}</p>
        <p><strong>Адреса:</strong> ${cheapest.address}</p>
        <div class="summary-price">${formatPrice(cheapest.price)}</div>
        <p class="summary-save">💰 Економія порівняно з найдорожчою пропозицією: ${difference} грн</p>
    `;
}

function renderProducts(data) {
    resultsDiv.innerHTML = "";
    resultsCount.textContent = `${data.length} позицій`;

    if (!data || data.length === 0) {
        resultsDiv.innerHTML = `
            <div class="no-results">
                За вашим запитом нічого не знайдено.<br>
                Спробуйте інший продукт або натисніть “Показати всі”.
            </div>
        `;
        return;
    }

    const cheapestPrice = data[0].price;

    data.forEach(product => {
        const card = document.createElement("div");
        const isBest = product.price === cheapestPrice;
        const productEmoji = getProductEmoji(product.name);
        const categoryEmoji = getCategoryEmoji(product.category);

        card.className = isBest ? "result-card best-card" : "result-card";

        card.innerHTML = `
            ${isBest ? `<div class="best-label">Найвигідніше</div>` : ""}
            <div class="card-badge">${categoryEmoji} ${product.category}</div>
            <h3>${productEmoji} ${product.name}</h3>
            <p><strong>Супермаркет:</strong> ${product.supermarket}</p>
            <p><strong>Адреса:</strong> ${product.address}</p>
            <p class="price">Ціна: ${formatPrice(product.price)}</p>
            <p class="compare-note">Порівняйте вартість і відкрийте місце на карті.</p>
            <div class="card-actions">
                <a class="map-link" href="${buildMapLink(product.supermarket, product.address)}" target="_blank">
                    🗺 Показати на карті
                </a>
            </div>
        `;

        resultsDiv.appendChild(card);
    });
}

async function searchProduct() {
    const productName = searchInput.value.trim();

    messageDiv.textContent = "";
    messageDiv.style.color = "#dc2626";
    resultsDiv.innerHTML = "";

    if (!productName) {
        messageDiv.textContent = "Будь ласка, введіть назву продукту.";
        resultsCount.textContent = "0 позицій";
        renderSummary([]);
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/search?name=${encodeURIComponent(productName)}`);
        const data = await response.json();

        if (!response.ok) {
            messageDiv.textContent = data.message || "Сталася помилка під час пошуку.";
            resultsCount.textContent = "0 позицій";
            renderSummary([]);
            return;
        }

        if (data.length === 0) {
            renderProducts([]);
            renderSummary([]);
            messageDiv.textContent = "Нічого не знайдено за цим запитом.";
            return;
        }

        renderProducts(data);
        renderSummary(data, productName);
    } catch (error) {
        messageDiv.textContent = "Не вдалося підключитися до сервера.";
        resultsCount.textContent = "0 позицій";
        renderSummary([]);
        console.error(error);
    }
}

async function loadAllProducts() {
    messageDiv.textContent = "";
    messageDiv.style.color = "#dc2626";
    searchInput.value = "";

    try {
        const response = await fetch("http://localhost:3000/products");
        const data = await response.json();

        data.sort((a, b) => a.price - b.price);

        renderProducts(data);
        renderSummary([]);
    } catch (error) {
        messageDiv.textContent = "Не вдалося завантажити товари.";
        console.error(error);
    }
}

async function addProduct(event) {
    event.preventDefault();
    messageDiv.textContent = "";
    messageDiv.style.color = "#dc2626";

    const payload = {
        name: newName.value.trim(),
        supermarket: newMarket.value.trim(),
        price: Number(newPrice.value),
        category: newCategory.value.trim(),
        address: newAddress.value.trim()
    };

    if (!payload.name || !payload.supermarket || !payload.price || !payload.category || !payload.address) {
        messageDiv.textContent = "Заповніть усі поля для додавання товару.";
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/products", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            messageDiv.textContent = data.message || "Не вдалося додати товар.";
            return;
        }

        messageDiv.style.color = "#15803d";
        messageDiv.textContent = "Товар успішно додано до бази.";
        addProductForm.reset();

        if (searchInput.value.trim().toLowerCase() === payload.name.toLowerCase()) {
            await searchProduct();
        }
    } catch (error) {
        messageDiv.textContent = "Помилка з'єднання з сервером.";
        console.error(error);
    }
}

searchButton.addEventListener("click", searchProduct);
allButton.addEventListener("click", loadAllProducts);
addProductForm.addEventListener("submit", addProduct);

searchInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        searchProduct();
    }
});

tagButtons.forEach(button => {
    button.addEventListener("click", () => {
        const product = button.dataset.product;
        searchInput.value = product;
        searchProduct();
    });
});