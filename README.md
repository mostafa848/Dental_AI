# Dental AI

Dental AI is an AI-powered dental imaging platform designed to assist with the analysis of dental X-ray images and provide intelligent dental insights.

The project combines a React frontend with a Python Flask backend and machine-learning models for dental image analysis.

## Features

- Dental X-ray image analysis
- AI-based dental disease recognition
- Panoramic X-ray analysis
- Periapical X-ray analysis
- Deep-learning models for image analysis
- Patient management
- Patient dashboard
- User authentication
- Admin dashboard
- Patient biometric information
- Email service integration
- Interactive 3D dental visualization
- Responsive web interface

## Project Architecture

The project consists of two main parts: the frontend and the backend.

```text
Dental_AI/
├── backend/
│   ├── MiDaS/
│   ├── midascopy/
│   ├── models/
│   ├── app.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── package-lock.json
│   ├── tailwind.config.js
│   └── postcss.config.js
├── .gitignore
└── README.md
```

## Technologies

### Frontend

- React
- JavaScript
- Tailwind CSS
- CSS
- React Components
- 3D dental visualization

### Backend

- Python
- Flask
- Machine Learning and Deep Learning
- YOLO-based models
- MiDaS
- Image processing
- REST API

### Data and Authentication

- MongoDB
- JSON Web Tokens (JWT)

## Frontend Structure

The React application is located in the `frontend/` directory.

```text
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── 3D/
│   │   ├── Auth/
│   │   ├── Biometrics/
│   │   ├── admin/
│   │   ├── analyze/
│   │   ├── images/
│   │   └── services/
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── package.json
└── package-lock.json
```

## Backend Structure

The Flask backend is located in the `backend/` directory.

```text
backend/
├── MiDaS/
├── midascopy/
├── models/
├── app.py
└── requirements.txt
```

The main Flask application is `backend/app.py`, and Python dependencies are listed in `backend/requirements.txt`.

## Getting Started

### Prerequisites

Install the following tools before running the project:

- Git
- Node.js and npm
- Python
- MongoDB or an accessible MongoDB instance

Additional system dependencies may be required by the machine-learning models.

### Clone the Repository

```bash
git clone https://github.com/mostafa848/Dental_AI.git
cd Dental_AI
```

## Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
```

Install the dependencies:

```bash
npm install
```

Start the React development server:

```bash
npm start
```

The frontend is typically available at:

```text
http://localhost:3000
```

## Backend Setup

Open a separate terminal and navigate to the backend directory from the project root:

```bash
cd backend
```

Create a Python virtual environment:

```powershell
python -m venv .venv
```

Activate the environment on Windows:

```powershell
.\.venv\Scripts\Activate.ps1
```

On Linux or macOS, use:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install the Python dependencies:

```bash
pip install -r requirements.txt
```

Start the Flask application:

```bash
python app.py
```

The backend host and port depend on the configuration in `app.py`.

## Environment Variables

Create a `.env` file inside the `backend/` directory for sensitive configuration.

Example:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

These values are examples only. Replace them with your actual configuration.

Do not commit `.env` files, database credentials, API keys, authentication secrets, or other sensitive information to GitHub.

For documentation, you can provide a `backend/.env.example` file containing variable names without real secret values.

## AI Models

The backend uses machine-learning model files for image analysis. These files may include:

```text
best.pt
tooth.pt
tooth1.pt
teeth_2.pt
teeth_3.pt
te
