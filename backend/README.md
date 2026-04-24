# Procurement Backend

Production-ready Node.js + Express + MongoDB backend for the current procurement frontend.

## Modules

- Purchase Requisition
- Purchase Order
- Receipt

## Stack

- Node.js
- Express
- MongoDB
- Mongoose
- Zod

## Structure

```text
backend/
  src/
    config/
    constants/
    middlewares/
    models/
    modules/
      purchase-requisitions/
      purchase-orders/
      receipts/
    routes/
    services/
    utils/
```

## Environment

Copy `.env.example` to `.env` and update:

```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/excellon-procurement
API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:5173
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
```

## Run

```bash
cd backend
npm install
npm run dev
```

## REST Endpoints

### Purchase Requisition

- `GET /api/v1/purchase-requisitions`
- `GET /api/v1/purchase-requisitions/:id`
- `POST /api/v1/purchase-requisitions`
- `PUT /api/v1/purchase-requisitions/:id`
- `PATCH /api/v1/purchase-requisitions/:id/status`
- `DELETE /api/v1/purchase-requisitions/:id`

### Purchase Order

- `GET /api/v1/purchase-orders`
- `GET /api/v1/purchase-orders/:id`
- `POST /api/v1/purchase-orders`
- `PUT /api/v1/purchase-orders/:id`
- `PATCH /api/v1/purchase-orders/:id/status`
- `DELETE /api/v1/purchase-orders/:id`

### Receipt

- `GET /api/v1/receipts`
- `GET /api/v1/receipts/:id`
- `POST /api/v1/receipts`
- `PUT /api/v1/receipts/:id`
- `PATCH /api/v1/receipts/:id/status`
- `DELETE /api/v1/receipts/:id`

## Response Envelope

```json
{
  "success": true,
  "message": "Purchase requisitions fetched successfully",
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 105,
    "totalPages": 6
  }
}
```

## Frontend Mapping Notes

The backend intentionally returns the field names already used by the current frontend mock data where possible:

- Requisition returns `documentDateTime`, `supplierName`, `requesterName`, `productLines`
- Order returns `orderDateTime`, `requisitionNumber`, `supplierName`, `taxableAmount`, `totalDiscount`, `totalTaxes`, `totalAmount`
- Receipt returns `purchaseOrderNumber`, `requisitionNumber`, `receiveDate`, `receivedBy`, `lines`

Amounts and quantities are returned as fixed two-decimal strings in the response mappers so the frontend can adopt the API without changing current display formatting.

## Business Rules Implemented

- Sequential document numbering by module and year
- Embedded line items with parent-level transactional sync
- Requisition ordered quantities sync from active purchase orders
- Purchase order received quantities sync from active receipts
- Over-order prevention against source requisition balances
- Over-receipt prevention against source purchase order balances unless explicitly overridden
- Soft delete with audit metadata
- Status transition validation for all three modules

## Notes

- Cross-document sync uses MongoDB transactions. Run MongoDB as a replica set in production and in local dev if you want full transactional guarantees.
- The backend is added as an isolated package so the existing frontend build and routes remain unchanged.
