### **Restaurant Ordering System: Detailed Technical Document**

This document provides a comprehensive breakdown of the web-based restaurant ordering system, detailing its architecture, code structure, and real-time data flow.

***

### **1. System Architecture**

The system follows a client-server model utilizing a **Node.js** backend with **Express.js** and **Socket.IO** for real-time communication. It uses an **SQLite** database for persistent storage of orders.

* **Client-Side**: The user interface is split between `Index.html` for customers and `waiter.html` for staff. Both pages are styled with `styles.css` and use JavaScript (`script.js` and inline scripts) to handle user interaction and communication with the server.
* **Server-Side**: The `server.js` file acts as the central hub, managing API endpoints, database connections, and real-time data broadcasting.
* **Database**: The `orders.db` file is a local SQLite database that stores all order information. The `alter.js` script is a utility for modifying the database schema.

***

### **2. Detailed Component Breakdown**

#### **Customer Frontend (`Index.html`, `script.js`, `styles.css`)**

* **`Index.html`**: The main customer-facing page. It contains a static menu with hard-coded items for "Starters," "Main Course," "Desserts," "Drinks," and "Specials." Each menu item has an "Order Now" button that calls the `itemClicked()` function. The navigation buttons use a `showMenu()` function to toggle the visibility of different menu sections.
* **`script.js`**: This client-side script is responsible for:
    * Connecting to the server using Socket.IO (`const socket = io();`).
    * The `showMenu()` function handles the display logic, adding and removing the `active` CSS class to show or hide menu sections.
    * The **`itemClicked(itemName)`** function is the core of the ordering process. It creates a JavaScript object containing the **`item`** and the current **`time`**, then uses `socket.emit("newOrder", order)` to send this data to the server in real time. It also displays a confirmation alert to the user.
* **`styles.css`**: Provides a cohesive design for the entire system. It defines a clean, modern look with a grid layout for menu items on the customer page and a card-based display for orders on the waiter's dashboard.

#### **Waiter Dashboard (`waiter.html`)**

* **`waiter.html`**: This page is a dynamic dashboard for waiters to monitor incoming orders.
    * **Initial Load**: Upon page load, it makes a `fetch` request to the `/api/orders` endpoint on the server to retrieve all past orders from the database.
    * **Real-time Updates**: It listens for the `newOrder` event broadcast by the server using `socket.on("newOrder", (order) => { ... })`. When a new order is received, it appends a new "card" element to the top of the orders list, ensuring the most recent order is always visible. The `addOrder()` function dynamically creates the HTML for each order card.

#### **Backend Server (`server.js`)**

The `server.js` file is the brain of the application. It's built with Express and Socket.IO.

* **Database Connection**: Establishes a connection to the `orders.db` SQLite database and creates the `orders` table if it doesn't exist.
* **REST API Endpoints**: The server provides a full **CRUD (Create, Read, Update, Delete)** API for managing orders:
    * **`GET /api/orders`**: Retrieves a list of all orders from the database.
    * **`POST /api/orders`**: Allows for new orders to be created via a standard HTTP POST request.
    * **`PUT /api/orders/:id`**: Updates an existing order's status based on its ID.
    * **`DELETE /api/orders/:id`**: Deletes an order from the database.
* **Real-time Functionality**: The server's Socket.IO implementation is crucial.
    * It listens for a **`newOrder`** event from the client (`script.js`).
    * When an order is received, it inserts the new order data (`item`, `time`) into the `orders` table.
    * After the order is successfully saved, the server immediately broadcasts the new order object to all connected clients (including the waiter dashboard) using `io.emit("newOrder", savedOrder)`.

#### **Database and Utilities (`orders.db`, `alter.js`)**

* **`orders.db`**: An SQLite database file. It contains a single table named `orders` with the following schema:
    * `id` (INTEGER, PRIMARY KEY, AUTOINCREMENT)
    * `item` (TEXT)
    * `time` (TEXT)
    * `status` (TEXT, DEFAULT 'Pending')
* **`alter.js`**: This standalone Node.js script is specifically designed to modify the database schema. Its sole purpose is to run the SQL command `ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'Pending'`, which adds a `status` column to the `orders` table. This allows orders to have a state (e.g., 'Pending', 'In Progress', 'Completed').

***

### **3. Order Processing Workflow**

1.  A customer on the `Index.html` page clicks "Order Now" for a specific item.
2.  The `script.js` client-side function **`itemClicked`** is triggered. It creates a simple data object (`{ item: itemName, time: new Date().toLocaleTimeString() }`) and emits it to the server.
3.  The **`server.js`** backend receives the `newOrder` event. It processes the data and inserts it into the `orders` table in `orders.db`.
4.  Once the database operation is complete, the server creates a full order object (including the new `id` and `status: "Pending"`) and broadcasts this object back to all connected clients via `io.emit("newOrder", savedOrder)`.
5.  On the `waiter.html` dashboard, the `socket.on("newOrder", ...)` listener is activated. It takes the new order data and dynamically adds it to the top of the list, providing a real-time update to the waiter.
