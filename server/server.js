const dgram = require("dgram");
const fs = require("fs");
const path = require("path");

const server = dgram.createSocket("udp4");
const PORT = 4000;
const HOST = "127.0.0.1";

const productsPath = path.join(__dirname, "../database/products.json");
const usersPath = path.join(__dirname, "../database/users.json");
const logPath = path.join(__dirname, "../logs/server-log.txt");

function readJson(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            return [];
        }

        const data = fs.readFileSync(filePath, "utf8");

        if (!data.trim()) {
            return [];
        }

        return JSON.parse(data);
    } catch (error) {
        console.error("Помилка читання JSON:", error.message);
        return [];
    }
}

function writeJson(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    } catch (error) {
        console.error("Помилка запису JSON:", error.message);
    }
}

function writeLog(message) {
    const now = new Date().toLocaleString("uk-UA");
    fs.appendFileSync(logPath, `[${now}] ${message}\n`, "utf8");
}

function sendResponse(responseObject, port, address) {
    const responseBuffer = Buffer.from(JSON.stringify(responseObject));

    server.send(responseBuffer, port, address, (error) => {
        if (error) {
            console.error("Помилка надсилання відповіді:", error.message);
        }
    });
}

server.on("listening", () => {
    const address = server.address();
    console.log(`UDP-сервер запущено на ${address.address}:${address.port}`);
    writeLog(`SERVER STARTED on ${address.address}:${address.port}`);
});

server.on("message", (message, remoteInfo) => {
    try {
        const request = JSON.parse(message.toString());

        writeLog(`REQUEST from ${remoteInfo.address}:${remoteInfo.port} -> ${JSON.stringify(request)}`);

        const { action, data } = request;

        if (action === "register") {
            const users = readJson(usersPath);

            const existingUser = users.find(user => user.login === data.login);

            if (existingUser) {
                const response = {
                    success: false,
                    message: "Користувач з таким логіном уже існує"
                };

                writeLog(`RESPONSE -> ${JSON.stringify(response)}`);
                sendResponse(response, remoteInfo.port, remoteInfo.address);
                return;
            }

            const newUser = {
                id: users.length + 1,
                login: data.login,
                password: data.password
            };

            users.push(newUser);
            writeJson(usersPath, users);

            const response = {
                success: true,
                message: "Реєстрація успішна"
            };

            writeLog(`RESPONSE -> ${JSON.stringify(response)}`);
            sendResponse(response, remoteInfo.port, remoteInfo.address);
            return;
        }

        if (action === "login") {
            const users = readJson(usersPath);

            const foundUser = users.find(
                user => user.login === data.login && user.password === data.password
            );

            if (!foundUser) {
                const response = {
                    success: false,
                    message: "Неправильний логін або пароль"
                };

                writeLog(`RESPONSE -> ${JSON.stringify(response)}`);
                sendResponse(response, remoteInfo.port, remoteInfo.address);
                return;
            }

            const response = {
                success: true,
                message: "Авторизація успішна"
            };

            writeLog(`RESPONSE -> ${JSON.stringify(response)}`);
            sendResponse(response, remoteInfo.port, remoteInfo.address);
            return;
        }

        if (action === "getAllProducts") {
            const products = readJson(productsPath);

            const response = {
                success: true,
                products
            };

            writeLog(`RESPONSE -> returned ${products.length} products`);
            sendResponse(response, remoteInfo.port, remoteInfo.address);
            return;
        }

        if (action === "searchProduct") {
            const products = readJson(productsPath);

            const searchText = data.name.toLowerCase().trim();

            const foundProducts = products.filter(product =>
                product.name.toLowerCase().includes(searchText)
            );

            foundProducts.sort((a, b) => a.price - b.price);

            const response = {
                success: true,
                products: foundProducts
            };

            writeLog(`RESPONSE -> found ${foundProducts.length} products for search "${data.name}"`);
            sendResponse(response, remoteInfo.port, remoteInfo.address);
            return;
        }

        if (action === "addProduct") {
            const products = readJson(productsPath);

            const newProduct = {
                id: products.length + 1,
                name: data.name,
                supermarket: data.supermarket,
                price: Number(data.price),
                category: data.category,
                address: data.address
            };

            products.push(newProduct);
            writeJson(productsPath, products);

            const response = {
                success: true,
                message: "Товар успішно додано",
                product: newProduct
            };

            writeLog(`RESPONSE -> added product ${newProduct.name}`);
            sendResponse(response, remoteInfo.port, remoteInfo.address);
            return;
        }

        const response = {
            success: false,
            message: "Невідома команда"
        };

        writeLog(`RESPONSE -> ${JSON.stringify(response)}`);
        sendResponse(response, remoteInfo.port, remoteInfo.address);

    } catch (error) {
        const errorResponse = {
            success: false,
            message: "Помилка обробки запиту"
        };

        writeLog(`ERROR -> ${error.message}`);
        sendResponse(errorResponse, remoteInfo.port, remoteInfo.address);
    }
});

server.bind(PORT, HOST);