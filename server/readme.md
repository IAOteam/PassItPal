passitpal/
├── server/
│   ├── .env                 # Environment variables (API keys, DB URI, etc.)
│   ├── package.json         # Project dependencies and scripts
│   ├── app.ts               # Main Express application file
│   ├── tsconfig.json        # TypeScript configuration
│   ├── src/
│   │   ├── config/          # Database connection, constants
│   │   │   └── db.ts
│   │   │   └── constants.ts
│   │   ├── models/          # Mongoose schemas (User, Listing, Message, Transaction)
│   │   │   ├── User.ts
│   │   │   ├── Listing.ts
│   │   │   ├── Message.ts
│   │   │   └── Transaction.ts
│   │   ├── controllers/     # Business logic for handling requests
│   │   │   ├── authController.ts
│   │   │   ├── userController.ts
│   │   │   ├── listingController.ts
│   │   │   ├── messageController.ts
│   │   │   └── transactionController.ts
│   │   ├── routes/          # API routes
│   │   │   ├── authRoutes.ts
│   │   │   ├── userRoutes.ts
│   │   │   ├── listingRoutes.ts
│   │   │   ├── messageRoutes.ts
│   │   │   └── transactionRoutes.ts
│   │   ├── middleware/      # Authentication, authorization, error handling
│   │   │   ├── authMiddleware.ts
│   │   │   └── errorHandler.ts
│   │   ├── services/        # Logic for external integrations (e.g., payment gateway)
│   │   │   └── paymentService.ts
│   │   └── utils/           # Utility functions (e.g., OTP generation, token handling)
│   │       ├── otp.ts
│   │       └── jwt.ts
│   └── dist/                # Compiled JavaScript files (after TypeScript compilation)
├── client/                  # Frontend files (to be developed separately)
└── README.md