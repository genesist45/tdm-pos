# Troy-Dean MotorParts - Frontend

This is the frontend application for the POS Management System of Troy-Dean MotorParts, built with React and Vite.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:

- **Node.js** (Version 16 or higher recommended)
- **npm** (Node Package Manager)

---

## 🔧 Tools and Technologies

| Component | Tools / Languages | Description |
|-----------|-------------------|-------------|
| Front-end | React, TypeScript, Vite, CSS | User interface |
| Back-end | PHP, Laravel | Server-side logic |
| Database | MySQL | Data storage |
| Others | VS Code, Git, npm, Composer | Design and development |

---

## 🛠️ Installation

Follow these steps to install the project dependencies:

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```
    This command downloads all the necessary libraries and packages listed in `package.json`.

## ⚙️ Setup & Configuration

Once installed, you can run the application locally:

1.  **Start the development server:**
    ```bash
    npm run dev
    ```

2.  **Access the application:**
    Open your browser and navigate to the URL shown in the terminal, typically:
    > http://localhost:5173

3.  **Build for production (optional):**
    To create a production-ready build, run:
    ```bash
    npm run build
    ```

## 📂 Project Structure

Here is an overview of the frontend folder structure to help you get oriented:

```
frontend/
├── node_modules/       # Installed dependencies (do not edit)
├── public/             # Static public assets
├── src/                # Main source code
│   ├── assets/         # Images, fonts, and global styles
│   ├── components/     # Reusable UI components (buttons, inputs, etc.)
│   ├── layouts/        # Page layouts (headers, sidebars)
│   ├── pages/          # Application pages (Dashboard, Inventory, POS, etc.)
│   ├── App.tsx         # Main application component
│   └── main.tsx        # Entry point of the application
├── package.json        # Project metadata and dependency list
├── vite.config.ts      # Vite configuration settings
└── README.md           # Project documentation
```

### Key Directories:

-   **`src/pages`**: Contains the code for individual pages like `AdminLogin`, `Dashboard`, and `Inventory`.
-   **`src/components`**: Smaller, reusable parts of the interface mostly used across different pages.
-   **`src/layouts`**: Defines the common structure of pages, such as the navigation bar and side menu.
