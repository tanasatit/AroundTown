# Business Rules & Formulas

## Core Business Rules

### Rule 1: Coin Requirements
- Machine accepts **only 10-baht coins**
- **4 coins = 1 postcard = 40 baht**
- Machine coins must be divisible by 4

### Rule 2: Exchange Box Balance
- Exchange box starts with **12,000 baht in 10-baht coins**
- Should balance back to 12,000 baht each round
- Tolerance: ±1 baht (for rounding)
- Formula: `|exchange_total - 12000| < 1`

### Rule 3: Collection Schedule
- **2 collections per week** (Round 1, Round 2)
- Unique constraint: (date + round + location)
- Cannot create duplicate collections

### Rule 4: Inventory Management
- Max capacity: **800 postcards** per machine
- Minimum: **0 postcards** (cannot go negative)
- Refill: Once per week (not every round)

### Rule 5: Cost Tracking
- Default cost per postcard: **13.766 baht**
- Can change over time (new batches may cost different)
- Stored per collection (historical accuracy)

## Calculation Formulas

### Primary Calculations
```typescript
// Machine total (always 10-baht coins)
machineTotal = machineCoins10baht × 10

// Postcards sold (key insight)
postcardsSold = floor(machineCoins10baht ÷ 4)

// Revenue
revenue = postcardsSold × 40

// Cost
cost = postcardsSold × costPerPostcard

// Profit
profit = revenue - cost
```

### Exchange Box Calculations
```typescript
// Exchange total (mixed denominations)
exchangeTotal = 
  (coins1baht × 1) +
  (coins2baht × 2) +
  (coins5baht × 5) +
  (coins10baht × 10) +
  (notes20baht × 20) +
  (notes50baht × 50) +
  (notes100baht × 100) +
  (notes500baht × 500) +
  (notes1000baht × 1000)

// Balance check
exchangeBalanced = abs(exchangeTotal - 12000) < 1
```

### Inventory Calculations
```typescript
// After collection
postcardsRemaining = previousRemaining - postcardsSold

// After refill
postcardsRemaining = previousRemaining + postcardsAdded
```

### Analytics Formulas
```typescript
// Weekly revenue (2 rounds)
weeklyRevenue = sum(collections where weekNumber = X)

// Average profit margin
profitMargin = (profit ÷ revenue) × 100
// Expected: ~65% ((40 - 13.766) / 40 = 65.6%)

// Sales velocity (postcards per day)
dailyRate = postcardsSold ÷ daysSinceLastCollection
```

## Validation Rules

### Input Validation
```typescript
// Coins must be non-negative integers
machineCoins10baht >= 0 && isInteger
allExchangeInputs >= 0 && isInteger

// Machine coins must be divisible by 4
machineCoins10baht % 4 === 0

// Date cannot be in future
collectionDate <= today()

// Round number must be 1 or 2
roundNumber in [1, 2]

// Week number must be positive
weekNumber >= 1

// Location required
machineLocation.length >= 3 && <= 200

// Postcards cannot go negative
postcardsRemaining >= 0
```

### Business Logic Validation
```typescript
// Cannot have duplicate collection
unique(collectionDate, roundNumber, machineLocation)

// Warning if exchange unbalanced
if (!exchangeBalanced) {
  showWarning(`Exchange box: ${exchangeTotal}฿, expected 12,000฿`)
}

// Alert if low inventory
if (postcardsRemaining < 100) {
  showAlert('Low inventory - refill needed')
}

// Check reasonable coin count
if (machineCoins10baht > 2000) { // >500 postcards = suspicious
  confirmDialog('Unusually high coin count - is this correct?')
}
```

## Data Constraints

### Database Level
```sql
-- Non-negative integers
CHECK (machine_coins_10baht >= 0)
CHECK (postcards_remaining >= 0)

-- Round number constraint
CHECK (round_number IN (1, 2))

-- Week number positive
CHECK (week_number >= 1)

-- Unique collection
UNIQUE (collection_date, round_number, machine_location)

-- Foreign keys
FOREIGN KEY (created_by) REFERENCES users(id)
```

### Application Level
- Max coin input: 10,000 (prevent typos)
- Max note input: 1,000 (prevent typos)
- Date range: 2024-01-01 to today
- Cost per postcard: 1.00 to 50.00 baht (reasonable range)

## Edge Cases

### Scenario 1: Exchange Box Short
```
Exchange total: 11,500 baht
Expected: 12,000 baht
Difference: -500 baht

Action: 
- Show warning
- Allow saving with notes
- Flag for investigation
```

### Scenario 2: Partial Coins
```
Machine coins: 303 (not divisible by 4)

Action:
- Reject input
- Message: "Must be divisible by 4 (4 coins = 1 postcard)"
- Suggest: 300 or 304
```

### Scenario 3: First Collection (No Previous Data)
```
No previous remaining count

Action:
- Require manual entry of starting inventory
- Or: Calculate from refill history
- Store as baseline
```

### Scenario 4: Zero Sales
```
Machine coins: 0
Postcards sold: 0

Action:
- Valid (machine wasn't used)
- Exchange box still should be 12,000
- Allow saving
```

## Cost Updates

### When to Update Cost
- New batch of postcards ordered
- Printing costs change
- Artist fees change

### How to Update
- Set new `costPerPostcard` for future collections
- Historical collections keep original cost
- Report can show cost trends over time

### Example Calculation
```
Initial cost: 13.766 baht/postcard
- Printing: 1.85
- Envelope: 1.23
- Artist fee (amortized): 4.00
- Machine amortization: 5.12
- Venue fee: 0.00
- Other: 1.576
Total: 13.766 baht

If new batch costs more:
costPerPostcard = 15.50 (example)
```

## Reporting Periods

### Week Definition
- ISO Week (Monday to Sunday)
- Week 1 = First week of year
- Function: `getCurrentWeekNumber()`

### Collection Rounds
- **Round 1**: Typically Monday-Wednesday
- **Round 2**: Typically Thursday-Sunday
- No strict time enforcement (business decides)

### Monthly Aggregation
- Sum all collections in calendar month
- Show trends month-over-month
- Calculate average per round

## Performance Expectations

### Typical Collection Stats
- **Average postcards per round**: 50-150
- **Average coins per round**: 200-600
- **Average revenue per round**: 2,000-6,000 baht
- **Average profit per round**: 1,300-3,900 baht
- **Profit margin**: ~65%

### Alerts & Thresholds
- Low inventory: < 100 postcards
- High sales: > 200 postcards/round (refill sooner)
- Exchange shortage: < 11,000 baht (investigate)
- Zero sales: Flag for review (machine issue?)