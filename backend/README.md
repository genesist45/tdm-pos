# Troy-Dean MotorParts - Backend

This is the backend API for the POS Management System of Troy-Dean MotorParts, built with Laravel.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:

- **PHP** (Version 8.1 or higher recommended)
- **Composer** (PHP Dependency Manager)
- **Database** (MySQL or SQLite)

## 🛠️ Installation

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install PHP dependencies:**
    ```bash
    composer install
    ```

3.  **Setup Environment Variables:**
    Duplicate the `.env.example` file and rename it to `.env`:
    ```bash
    cp .env.example .env
    ```
    Then update the database configuration in `.env` (DB_DATABASE, DB_USERNAME, DB_PASSWORD).

4.  **Generate Application Key:**
    ```bash
    php artisan key:generate
    ```

5.  **Run Migrations:**
    Create the necessary database tables:
    ```bash
    php artisan migrate
    ```

## ⚙️ Setup & Configuration

1.  **Image Storage:**
    This project stores public images in `public/images`. Ensure your server is configured to serve the `public` directory.
    If using `storage` folder in the future, run `php artisan storage:link`.

2.  **Start the Server:**
    ```bash
    php artisan serve
    ```
    The API will be available at `http://localhost:8000` (by default).

## 📂 Project Structure

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/  # API Controllers (Inventory, Sales, etc.)
│   │   └── Middleware/   # HTTP Middleware
│   └── Models/          # Eloquent Models (Inventory, PurchaseHistory, etc.)
├── database/
│   └── migrations/      # Database schema definitions
├── public/              # Publicly accessible assets (images)
├── routes/
│   └── api.php          # API route definitions
├── storage/             # Logs, compiled templates, file uploads
├── .env                 # Environment configuration (DB, API keys)
└── composer.json        # PHP dependencies
```

### Key Components

-   **`routes/api.php`**: Defines all API endpoints accessible by the frontend.
-   **`app/Http/Controllers`**: Contains the logic for handling requests (e.g., `InventoryController`, `PurchaseHistoryController`).
-   **`app/Models`**: Represents database tables and relationships.

## 🔧 Troubleshooting

-   **Images Disappearing/Not Loading**: 
    Ensure the `App\Models\Inventory` and `Category` models have the `image_url` accessor appended. This ensures the API returns the full URL (including domain/port) rather than a relative path, preventing issues when accessing from different network addresses.
