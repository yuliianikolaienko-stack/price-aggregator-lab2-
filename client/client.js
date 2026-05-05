const dgram = require("dgram");
const readline = require("readline");

const client = dgram.createSocket("udp4");
const SERVER_PORT = 4000;
const SERVER_HOST = "127.0.0.1";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function sendRequest(requestObject) {
    const message = Buffer.from(JSON.stringify(requestObject));

    client.send(message, SERVER_PORT, SERVER_HOST, (error) => {
        if (error) {
            console.log("Помилка надсилання запиту:", error.message);
        }
    });
}

client.on("message", (message) => {
    const response = JSON.parse(message.toString());

    console.log("\nВідповідь від сервера:");
    console.log(response);

    showMenu();
});

function showMenu() {
    console.log("\n=== МЕНЮ КЛІЄНТА ===");
    console.log("1. Реєстрація");
    console.log("2. Авторизація");
    console.log("3. Показати всі товари");
    console.log("4. Пошук товару");
    console.log("5. Додати товар");
    console.log("0. Вийти");

    rl.question("Оберіть дію: ", (choice) => {
        if (choice === "1") {
            rl.question("Введіть логін: ", (login) => {
                rl.question("Введіть пароль: ", (password) => {
                    sendRequest({
                        action: "register",
                        data: { login, password }
                    });
                });
            });
        } else if (choice === "2") {
            rl.question("Введіть логін: ", (login) => {
                rl.question("Введіть пароль: ", (password) => {
                    sendRequest({
                        action: "login",
                        data: { login, password }
                    });
                });
            });
        } else if (choice === "3") {
            sendRequest({
                action: "getAllProducts",
                data: {}
            });
        } else if (choice === "4") {
            rl.question("Введіть назву товару: ", (name) => {
                sendRequest({
                    action: "searchProduct",
                    data: { name }
                });
            });
        } else if (choice === "5") {
            rl.question("Назва товару: ", (name) => {
                rl.question("Супермаркет: ", (supermarket) => {
                    rl.question("Ціна: ", (price) => {
                        rl.question("Категорія: ", (category) => {
                            rl.question("Адреса: ", (address) => {
                                sendRequest({
                                    action: "addProduct",
                                    data: {
                                        name,
                                        supermarket,
                                        price,
                                        category,
                                        address
                                    }
                                });
                            });
                        });
                    });
                });
            });
        } else if (choice === "0") {
            console.log("Клієнт завершив роботу.");
            rl.close();
            client.close();
        } else {
            console.log("Невірний вибір.");
            showMenu();
        }
    });
}

showMenu();