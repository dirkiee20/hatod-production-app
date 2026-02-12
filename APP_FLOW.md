# Hatod App Flow

This document outlines the standard lifecycle of an order within the Hatod ecosystem, detailing the interactions between the Customer, Merchant, and Rider applications.

## 1. Order Placement (Customer)
- **Actor**: Customer
- **Action**: Adds items to cart and proceeds to checkout.
- **System**: Creates a new order record.
- **Status Change**: `PENDING`
- **Notification**: Merchant receives a new order alert.

## 2. Order Confirmation (Merchant)
- **Actor**: Merchant
- **Action**: Reviews the incoming order and accepts it.
- **Status Change**: `CONFIRMED`
- **Notification**: Customer is notified that the restaurant has received the order.

## 3. Preparation (Merchant)
- **Actor**: Merchant
- **Action**: Kitchen starts preparing the food.
- **Status Change**: `PREPARING`
- **Action**: Once food is cooked and packed.
- **Status Change**: `READY_FOR_PICKUP`
- **Notification**: 
  - Riders in the area (or specific assignment) are notified of a ready order.
  - Customer is notified that food is ready.

## 4. Assignment & Pickup (Rider)
- **Actor**: Rider
- **Action**: Rider views list of `READY_FOR_PICKUP` orders and accepts one.
- **System**: Assigns the Rider ID to the order.
- **Status Change**: `DELIVERING`
  - *Note: currently, the backend transitions directly to DELIVERING upon rider acceptance of a ready order.*
- **Notification**: Customer tracks the rider.

## 5. Delivery & Completion (Rider)
- **Actor**: Rider
- **Action**: Arrives at the customer's location and hands over the order.
- **Action**: Rider marks the order as complete in the app.
- **Status Change**: `DELIVERED`
- **System**: 
  - Updates Payment Status to `PAID` (if Cash on Delivery).
  - Calculates final earnings.
- **Notification**: Customer asks to rate the service.
 
## Summary of Statuses
| Status | Controlled By | Description |
| :--- | :--- | :--- |
| **PENDING** | System | Order just created. |
| **CONFIRMED** | Merchant | Order accepted by restaurant. |
| **PREPARING** | Merchant | Food is being cooked. |
| **READY_FOR_PICKUP** | Merchant | Food is packed and waiting. |
| **DELIVERING** | Rider | Rider has picked up the order and is on the way. |
| **DELIVERED** | Rider | Order successfully received by customer. |
| **CANCELLED** | Cust/Merch/Sys | Order was cancelled. |

## Menu Creation Flow

This section details how menu items are created by the merchant and subsequently displayed to the customer.

### 1. Creation (Merchant App)
- **Actor**: Merchant User
- **Location**: Menu Management Screen
- **Action**:
  1.  **Create Category**: Merchant creates a category (e.g., "Main Course", "Beverages").
  2.  **Add Item**: Merchant adds a new item under a category.
  3.  **Input Details**:
      -   **Name**: Item name (e.g., "Double Cheeseburger")
      -   **Description**: Ingredients or marketing text
      -   **Price**: Base price
      -   **Image**: Uploads a photo
      -   **Preparation Time**: Estimated time to cook
  4.  **Save**: Backend creates the `MenuItem` record.
- **Status**: Item is created but **Hidden** (pending Merchant Approval).

### 2. Admin Approval (Admin Portal)
- **Actor**: Admin User
- **Location**: Merchant Management
- **Action**:
  1.  **Review**: Admin reviews the Merchant profile and their menu items.
  2.  **Decision**: Admin sets the Merchant status to `Approved`.
- **System**: Updates `Merchant.isApproved` to `true`.

### 3. Backend Processing
- **Entity**: `MenuItem` linked to `Merchant` and `Category`.
- **Validation**: Ensures price is valid and merchant exists.
- **Filter**: Only returns data if `Merchant.isApproved` is `true`.
- **Storage**: Image is stored/referenced (URL saved in DB).

### 4. Display (Customer App)
- **Actor**: Customer User
- **Location**: Restaurant Detail Screen
- **Action**:
  1.  **Browse**: Customer taps on a Restaurant card.
  2.  **Fetch**: App requests `GET /merchants/:id`.
  3.  **Filter**: Backend returns related `menuItems` grouped by `categories`.
      -   *Note: Only items where `isAvailable: true` AND `Merchant.isApproved: true` are visible.*
  4.  **Render**: Customer sees the list of categories with items, prices, and images.
