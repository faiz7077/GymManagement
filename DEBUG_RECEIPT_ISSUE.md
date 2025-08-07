# Debug Receipt Display Issue

## Problem
When creating a member with due amount (e.g., Total: ₹1000, Paid: ₹900, Due: ₹100), the receipt is created but not displaying the paid and due amounts correctly.

## Debugging Steps Added

### 1. Database Level (electron/database.cjs)
- ✅ Added logging in createMember to show receipt data being created
- ✅ Added verification query to check saved receipt data
- ✅ Confirmed createReceipt INSERT includes amount_paid and due_amount
- ✅ Confirmed createReceipt returns correct data

### 2. Frontend Level (src/pages/Receipts.tsx)
- ✅ Added logging in loadReceipts to show received data
- ✅ Check if amount_paid and due_amount are in the retrieved data

### 3. Component Level (src/components/receipts/ReceiptDetails.tsx)
- ✅ Added logging to show what data the component receives
- ✅ Verify receipt prop has correct amount_paid and due_amount

## Test Scenario
1. Create member with:
   - Registration Fee: ₹200
   - Package Fee: ₹800
   - Paid Amount: ₹900
   - Expected Due: ₹100

2. Check console logs for:
   - "Receipt data being created:" - Should show amount_paid: 900, due_amount: 100
   - "Saved receipt verification:" - Should confirm data was saved correctly
   - "Loaded receipts with amount data:" - Should show retrieved data has correct fields
   - "ReceiptDetails received receipt data:" - Should show component gets correct data

## Expected Console Output
```
Receipt data being created: {
  amount: 1000,
  amount_paid: 900,
  due_amount: 100,
  ...
}

Saved receipt verification: {
  amount: 1000,
  amount_paid: 900,
  due_amount: 100
}

Loaded receipts with amount data: [{
  receipt_number: "RCP...",
  amount: 1000,
  amount_paid: 900,
  due_amount: 100
}]
```

## Next Steps
1. Create the test member
2. Check console logs
3. Identify where the data is getting lost or not displayed
4. Fix the specific issue found