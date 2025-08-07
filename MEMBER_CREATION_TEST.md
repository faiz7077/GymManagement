# Member Creation with Due Amount - Test Scenario

## Test Case: Create Member with Partial Payment

### Input Data:
- **Registration Fee**: ₹200
- **Package Fee**: ₹800  
- **Discount**: ₹0
- **Total Amount**: ₹1000 (200 + 800 - 0)
- **Paid Amount**: ₹900
- **Expected Due**: ₹100 (1000 - 900)

### Expected Results:

#### 1. Member Record:
```javascript
{
  registration_fee: 200,
  package_fee: 800,
  discount: 0,
  membership_fees: 1000, // total
  paid_amount: 900
}
```

#### 2. Auto-Generated Receipt:
```javascript
{
  amount: 1000,        // Total amount
  amount_paid: 900,    // Amount actually paid
  due_amount: 100,     // Remaining balance
  transaction_type: 'partial_payment',
  description: 'Initial membership payment - [Member Name]'
}
```

#### 3. Display Results:
- **Members Page**: Shows "Due: ₹100" badge
- **Receipt Details**: Shows "Amount Paid: ₹900" and "Due Amount: ₹100"
- **PDF Receipt**: Includes due amount warning

### Verification Steps:
1. Create member with above values
2. Check Members page for due amount display
3. View generated receipt details
4. Download PDF to verify due amount is shown
5. Verify receipt list shows partial payment indicator

## Current Implementation Status: ✅ READY FOR TESTING

The code has been updated to:
- ✅ Auto-generate receipts on member creation
- ✅ Calculate due amounts correctly
- ✅ Map amount_paid and due_amount properly
- ✅ Show correct transaction type
- ✅ Display due amounts across all interfaces