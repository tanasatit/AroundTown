# Business Context

## Overview
**SeeYou AroundTown** manages cash flow for AroundTown Mystery Thai Postcard vending machines.

## The Business Model

### Product
- Thai-themed mystery postcards
- Price: 40 baht per postcard
- Sold via coin-operated vending machine
- Random postcard selection

### Current Operation
- **Machine Capacity**: 800 postcards
- **Payment**: Only 10-baht coins accepted (4 coins = 1 postcard)
- **Locations**: Multiple machines (starting with "Rare Aroon - Ground Floor")

### Cash Exchange System
1. Store near machine receives **12,000 baht in 10-baht coins** (1,200 coins)
2. Customers exchange any denomination for 10-baht coins at store
3. Customers use coins in vending machine
4. Store's exchange box should balance back to 12,000 baht

### Collection Schedule
- **Frequency**: 2 rounds per week (Round 1 & Round 2)
- **Postcard Refill**: Once per week
- **Users**: 3 team members access system

## Current Pain Points

### Problem 1: Manual Postcard Counting
- Must physically count remaining postcards in machine
- Time-consuming and error-prone
- Takes 20-30 minutes per collection

### Problem 2: Manual Calculations
- Calculate: Starting postcards - Remaining = Sold
- Calculate revenue and profit on calculator
- Prone to human error

### Problem 3: Manual Data Entry
- Type everything into Google Sheets
- Slow process
- No validation or error checking

## Solution Approach

### Key Insight
**Count coins instead of postcards:**
- Machine only accepts 10-baht coins
- Each postcard = 4 coins
- Therefore: Coins ÷ 4 = Postcards sold
- No need to count physical postcards!

### System Benefits
1. **Faster**: Just count coins (already needed for accounting)
2. **Accurate**: Math is automatic
3. **Validated**: System checks for errors
4. **Multi-location**: Track multiple machines
5. **Reports**: Automatic analytics and trends

## Users & Roles
- **3 team members** (all equal access for now)
- All can enter collections, view reports
- No role hierarchy needed initially

## Future Expansion
- IoT coin sensors for automatic counting
- Support for 5-10 machine locations
- Real-time inventory alerts
- Hardware integration (Phase 4+)