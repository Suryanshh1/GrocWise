🛒 GrocWise — Grocery Price Comparison & Price Intelligence Platform

GrocWise is a full-stack web application designed to simplify grocery shopping by helping users compare product prices across multiple online grocery delivery platforms, including Blinkit, Zepto, Swiggy Instamart, and BigBasket.

The platform provides a centralized interface where users can explore grocery products, compare platform-wise prices, identify cost-effective options, and manage their shopping basket. It aims to improve price transparency and help users make informed purchasing decisions.

GrocWise combines a responsive frontend, a Node.js and Express.js backend, MongoDB database integration, and Socket.IO-based real-time communication to provide an interactive grocery price comparison experience.

🚀 Key Features

1. Multi-Platform Grocery Price Comparison

* Compare grocery prices across Blinkit, Zepto, Swiggy Instamart, and BigBasket.
* View platform-specific pricing for the same product.
* Identify comparatively affordable shopping options.
* Display product information such as name, quantity, category, and price.

2. Simulated Price Intelligence Engine

* Implements a JavaScript-based pricing engine.
* Uses product base prices as the reference for price calculations.
* Generates platform-specific price variations using configurable pricing parameters.
* Supports simulated location-based price variations.
* Provides a foundation for analyzing grocery price differences across platforms.

3. Location-Based Pricing

* Supports location-dependent price calculations.
* Uses city and PIN code information in the pricing logic.
* Demonstrates how grocery prices can vary based on location.

4. Historical Price Tracking

* Generates simulated historical price data.
* Supports price trend visualization.
* Helps users explore how product prices may change over time.

5. Shopping Basket

* Allows users to manage selected grocery products.
* Supports basket-based product comparison.
* Helps users evaluate shopping options based on product prices.

6. Real-Time Product Updates

* Uses Socket.IO for real-time communication between the backend and frontend.
* Notifies connected clients when product data changes.
* Automatically refreshes the product list after product updates.

7. Product Management

* Supports adding products through REST APIs.
* Supports updating product information.
* Supports deleting products.
* Stores product information in MongoDB using Mongoose.

8. Responsive User Interface

* Provides an interactive web interface.
* Includes product search and filtering functionality.
* Presents grocery products and price comparisons in a structured format.

🛠️ Tech Stack

Frontend

* HTML5
* CSS3
* JavaScript
* Socket.IO Client

Backend

* Node.js
* Express.js
* Socket.IO

Database

* MongoDB
* Mongoose

Development Tools

* Visual Studio Code
* Postman
* Git
* GitHub

🏗️ Project Architecture

GrocWise follows a client-server architecture.

                    GrocWise
                       |
          +------------+------------+
          |                         |
       Frontend                  Backend
          |                         |
 HTML, CSS, JavaScript       Node.js + Express.js
          |                         |
          |                    REST APIs
          |                         |
          |                      MongoDB
          |                         |
          +------ Socket.IO --------+
                Real-Time Updates

The frontend communicates with the backend through REST APIs to retrieve and manage product data.

MongoDB stores product information, while Socket.IO enables real-time notifications when product data changes.

## 🏗️ Project Architecture

GrocWise follows a client-server architecture.

```text
                    GrocWise
                       |
          +------------+------------+
          |                         |
       Frontend                  Backend
          |                         |
   HTML, CSS, JS             Node.js + Express
          |                         |
          |                     REST APIs
          |                         |
          |                      MongoDB
          |                         |
          +------ Socket.IO --------+
                Real-Time Updates

⚙️ Installation and Setup

Prerequisites

Make sure you have the following installed:

* Node.js
* npm
* MongoDB Atlas account or a local MongoDB instance
* Git

1. Clone the Repository

git clone https://github.com/YOUR_USERNAME/GrocWise.git

Navigate to the project directory:

cd GrocWise

2. Install Backend Dependencies

cd server
npm install

3. Configure Environment Variables

Create a .env file inside the server directory.

Add your MongoDB connection string and required configuration:

MONGO_URI=your_mongodb_connection_string
PORT=5001

Replace the placeholder with your actual MongoDB connection string.

Do not commit your .env file or expose database credentials publicly.

4. Start the Backend Server

From the server directory, run:

npm run dev

The backend should start on:

http://localhost:5001

5. Launch the Frontend

Open the root index.html file using a local development server.

For example, you can use the Live Server extension in Visual Studio Code.

The frontend will communicate with the backend running on port 5001.

🔌 API Endpoints

The backend provides REST APIs for product management.

Method	Endpoint	Description
GET	/api/products	Retrieve products
GET	/api/products/:productId	Retrieve a specific product
POST	/api/products	Add a new product
PUT	/api/products/:productId	Update an existing product
DELETE	/api/products/:productId	Delete a product

The exact behavior depends on the implementation in productRoutes.js.

🔄 Real-Time Communication

GrocWise uses Socket.IO to notify connected frontend clients when product information changes.

When a product is added, updated, or deleted:

1. The frontend sends a request to the backend.
2. The backend performs the database operation.
3. The backend emits a productsUpdated event.
4. Connected clients receive the event.
5. The frontend fetches the updated product list.

This allows product changes to be reflected without manually refreshing the page.

🎯 Project Objective

The primary objective of GrocWise is to improve grocery price transparency by providing users with a centralized platform for comparing grocery prices across multiple online delivery services.

The project demonstrates the integration of frontend development, RESTful API design, database management, simulated pricing logic, and real-time communication in a full-stack web application.

🔮 Future Enhancements

* Integration with authorized grocery platform APIs for live pricing.
* Automated price history collection.
* Price drop notifications and product watchlists.
* User authentication and personalized shopping lists.
* Advanced basket optimization.
* Improved delivery fee and platform charge calculations.
* Deployment with a cloud-hosted backend and database.

👨‍💻 Developer

Suryansh Sharma

B.Tech — Computer Science and Engineering

Chandigarh Group of Colleges, Landran

⸻

GrocWise is an academic and portfolio project. Platform-specific prices are simulated unless explicitly connected to an authorized live pricing source.
