# Technical Service and Warranty System - Job Description / Requirements

## Project Overview

A system for the proper administration of technical service and warranty services, including a public database of problems and solutions for SEO-driven blog content, traffic generation, and new client acquisition.

---

## Core Objectives

- **Administration**: Proper management of technical service and warranty operations
- **Public Database**: Problems and solutions from technical service for blog content
- **Marketing**: SEO visibility for common problems, driving traffic and selling products used in repairs

---

## Functional Requirements

### 1. Order Management
- Orders are **NOT** created by clients on the website
- Orders are created by **Cashiers** (physical contact with customer in store)
- **Warehouse Manager** creates orders for products under warranty from suppliers
- Clients can **inquire about products** used in technical service (public database)
- System must allow entry of computer equipment with order status tracking

### 2. Order Tracking & Status
- Clients check order status and progress via:
  - DigitalServer app
  - Technical support website (track by track number only — no login required)
- Use **"pizza method"**: step-by-step instructions with graphical interface

### 3. Communication
- **Email** and **WhatsApp API** notifications at each process stage
- **Automatic messages**:
  - After **30 days** in delivery area: reminder to pick up
  - After **60 days**: warning that product may be considered abandoned
- **Configurable automatic email** when order has been in workshop for extended time (extend wait time, stay in touch)

### 4. Alerts
- Alert technicians when orders exceed initial estimated time
- Ensure constant communication with client

### 5. Areas (Configurable/Flexible)
- Entrance Area
- Maintenance Area
- Outsourced Area
- Warehouse Area
- Delivery Area
- Spare Parts Waiting Area
- System must be **flexible** for adding new areas (similar to points system)

### 6. Third-Party Technician Handling
- When equipment is sent to outsourced technician:
  - Maintain traceability
  - Customer **should NOT know** it was sent to third party
  - Allow charging repair cost to the technician

### 7. Revenue & Reports
- Calculate revenue by sales category for technical services
- Visible to **Admin** and **Super Admin** only
- Generate reports for proper management of technical services

### 8. Perseo System API Integration
- Call clients by ID number
- Add products (code, price, description)
- Contact suppliers for warranty claims
- Record serial numbers of entered products
- Import products used in technical service (for cashier checkout)

### 9. Payment & Checkout
- Customer pays at **physical checkout**
- Cashier receives receipt from technician with:
  - Products used
  - Serial numbers
  - Technical service cost
- All products imported into Perseo system

### 10. Technical Report
- Printable technical report delivered physically upon service completion

### 11. AI-Powered Description
- Cashiers can write problem description in their own words
- AI-powered button to refine/improve technical description

---

## User Roles

| Role | Description |
|------|-------------|
| **Super Administrator** | Full access, revenue visibility |
| **Administrator** | Full admin, revenue visibility |
| **Cashiers** | Create orders, physical checkout |
| **Lead Technician** | Technical operations, receipts |
| **Outsourced Technician** | Third-party repairs (charged) |
| **Customers** | Track order status only (no order creation) |

---

## Public Website (Frontend)

- **Landing page** (design to be provided later)
- **Blog** with problems/solutions from technical service (SEO)
- **Track page** — customer tracks order by track number only (no auth)
- **No authentication** on frontend

---

## Admin Panel

- Full administrative interface
- Reference: https://serviciotecnico.xyz/Admin
- Credentials (example): admin@digitalserver.com.ec

---

## Technical Requirements

- **Stack**: MERN (MongoDB, Express, React, Node.js)
- **Monorepo**: 3 apps — backend, frontend, admin panel
- **Ports**:
  - Backend: 6190
  - Frontend: 6191
  - Admin Panel: 6192
- **Flexibility**: Structure for adding new features, areas, options

---

## Out of Scope (Initial Phase)

- Landing page design (to be provided later)
- Customer table (not needed initially)
- Product table (not needed initially)
