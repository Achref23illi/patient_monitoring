# Patient Monitoring System

A real-time patient monitoring system built with Node.js, Express, MongoDB, and Socket.IO. This application allows healthcare professionals to monitor patient vital signs, receive alerts for abnormal readings, and manage patient information.

## Features

- **User Authentication** - Secure login for different user roles (admin, doctor, nurse)
- **Patient Management** - Add, view, edit, and delete patient records
- **Vital Signs Monitoring** - Record and track patient vital signs (temperature, heart rate, etc.)
- **Real-time Alerts** - Automated alerts for abnormal vital sign readings
- **Dashboard** - Overview of patients, active alerts, and vital sign trends
- **Responsive Design** - Works on desktop and mobile devices

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4 or higher)
- npm or yarn

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd patient-monitoring
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:
   ```
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/patient-monitor
   JWT_SECRET="369Z1jdbTk+GB/GsVQONyZ5JqPi4jjS8jme2uqqx20I="
   NODE_ENV=development
   JWT_EXPIRE=24h
   ```

4. Seed the database with sample data:
   ```
   node scripts/seed_db.js
   ```

## Running the Application

Start the development server:
```
npm run dev
```

Access the application at http://localhost:3001

## Default User Accounts

After seeding the database, you can log in with the following accounts:

- **Admin**
  - Email: admin@example.com
  - Password: password123

- **Doctor**
  - Email: doctor@example.com
  - Password: password123

- **Nurse**
  - Email: nurse@example.com
  - Password: password123

## Troubleshooting

### MongoDB Connection Issues

If you're having trouble connecting to MongoDB, run this script to test the connection:

```
node scripts/test-mongodb.js
```

### Authentication Issues

If you can't log in with the default credentials, reset the user accounts:

```
node scripts/reset_user.js
```

You can modify this script to reset any user by changing the email address.

### Debug Authentication Process

To debug the authentication process, run:

```
node scripts/debug_login.js
```

This will show detailed information about the login process, including password hashing.

### Reset All Users

To reset all user accounts:

```
node scripts/fix_all_users.js
```

## Project Structure

- **/public** - Frontend assets (HTML, CSS, JavaScript)
  - **/css** - Stylesheets
  - **/js** - Frontend JavaScript files
- **/server** - Backend code
  - **/controllers** - Route handlers
  - **/models** - MongoDB schemas
  - **/routes** - API endpoints
  - **/middleware** - Express middleware
  - **/utils** - Utility functions
  - **/socket** - Socket.IO event handlers

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (admin only)
- `GET /api/auth/me` - Get current user

### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get specific patient
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Vital Signs
- `GET /api/vitals/patient/:patientId` - Get vital signs for a patient
- `GET /api/vitals/patient/:patientId/latest` - Get latest vital signs
- `POST /api/vitals` - Record new vital signs
- `PUT /api/vitals/:id` - Update vital sign record

### Alerts
- `GET /api/alerts` - Get all alerts
- `GET /api/alerts/patient/:patientId` - Get alerts for a patient
- `PUT /api/alerts/:id/resolve` - Resolve an alert
- `POST /api/alerts` - Create a manual alert

## Real-time Events

The application uses Socket.IO for real-time updates:

- `vitalSignUpdate` - When new vital signs are recorded
- `newAlert` - When a new alert is created
- `criticalAlert` - When a critical alert is created
- `alertResolved` - When an alert is resolved

## License

[Your license information here]

## Contributors

[List of contributors]